'use client';

import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';

type Profile = {
  first_name: string | null;
  last_name: string | null;
  phone: string | null;
  birthday: string | null;
};

type UserContextType = {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  loading: boolean;
  signUp: (email: string, password: string, firstName: string, lastName: string) => Promise<{ error: string | null; info?: string }>;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  updateProfile: (data: Partial<Profile>) => Promise<{ error: string | null }>;
};

const UserContext = createContext<UserContextType | null>(null);

export function UserProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      else setProfile(null);
      setLoading(false);

      // Welcome email on first sign-in. Sent here rather than at sign-up
      // because with email confirmation enabled there's no session until the
      // address is confirmed. The route is idempotent, so the repeat SIGNED_IN
      // events from token refreshes only ever produce one email.
      if (event === 'SIGNED_IN' && session?.access_token) {
        fetch('/api/email/welcome', {
          method: 'POST',
          headers: { Authorization: `Bearer ${session.access_token}` },
        }).catch(() => {
          // Best-effort — never block sign-in on a mail call.
        });
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('first_name, last_name, phone, birthday').eq('id', userId).single();
    setProfile(data ?? null);
  };

  const signUp = async (email: string, password: string, firstName: string, lastName: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    if (data.user) {
      await supabase.from('profiles').insert({ id: data.user.id, first_name: firstName, last_name: lastName });
    }
    if (!data.session) {
      // Not a failure — the account was created and needs email confirmation.
      return { error: null, info: 'Account created! Check your email to confirm your account, then sign in.' };
    }
    return { error: null };
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error?.message ?? null };
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const updateProfile = async (data: Partial<Profile>) => {
    if (!user) return { error: 'Not logged in' };
    const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
    if (!error) setProfile(prev => ({ ...prev!, ...data }));
    return { error: error?.message ?? null };
  };

  return (
    <UserContext.Provider value={{ user, session, profile, loading, signUp, signIn, signOut, updateProfile }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error('useUser must be used within UserProvider');
  return ctx;
}
