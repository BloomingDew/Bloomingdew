'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '../../context/UserContext';
import { supabase } from '../../lib/supabase';

type Order = {
  id: string;
  created_at: string;
  status: string;
  total: number;
  items: { name: string; size: string; quantity: number; price: string }[];
};

type Address = {
  id: string;
  label: string;
  first_name: string;
  last_name: string;
  address: string;
  city: string;
  country: string;
  is_default: boolean;
};

function AccountPageInner() {
  const { user, profile, loading, signOut, updateProfile } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [tab, setTab] = useState<'orders' | 'profile' | 'addresses'>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [editProfile, setEditProfile] = useState(false);
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', phone: '', birthday: '' });
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState('');
  const [showWelcome, setShowWelcome] = useState(false);
  const [showAddAddress, setShowAddAddress] = useState(false);
  const [addressForm, setAddressForm] = useState({ label: 'Home', first_name: '', last_name: '', address: '', apartment: '', city: '', postcode: '', country: 'Nigeria', phone: '' });
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push('/account/login');
  }, [user, loading]);

  useEffect(() => {
    if (searchParams.get('welcome')) setShowWelcome(true);
  }, [searchParams]);

  useEffect(() => {
    if (profile) setProfileForm({ first_name: profile.first_name || '', last_name: profile.last_name || '', phone: profile.phone || '', birthday: profile.birthday || '' });
  }, [profile]);

  useEffect(() => {
    if (!user) return;
    supabase.from('orders').select('id, created_at, status, total, items').eq('user_id', user.id).order('created_at', { ascending: false })
      .then(({ data }) => setOrders(data || []));
    supabase.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false })
      .then(({ data }) => setAddresses(data || []));
  }, [user]);

  const handleSaveProfile = async () => {
    setSaving(true);
    const { error } = await updateProfile(profileForm);
    if (!error) { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2000); setEditProfile(false); }
    setSaving(false);
  };

  const handleSaveAddress = async () => {
    if (!user) return;
    setSavingAddress(true);
    const { data } = await supabase.from('addresses').insert({ ...addressForm, user_id: user.id, is_default: addresses.length === 0 }).select().single();
    if (data) setAddresses(prev => [...prev, data]);
    setShowAddAddress(false);
    setAddressForm({ label: 'Home', first_name: '', last_name: '', address: '', apartment: '', city: '', postcode: '', country: 'Nigeria', phone: '' });
    setSavingAddress(false);
  };

  const deleteAddress = async (id: string) => {
    await supabase.from('addresses').delete().eq('id', id);
    setAddresses(prev => prev.filter(a => a.id !== id));
  };

  const setDefault = async (id: string) => {
    await supabase.from('addresses').update({ is_default: false }).eq('user_id', user!.id);
    await supabase.from('addresses').update({ is_default: true }).eq('id', id);
    setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === id })));
  };

  // While the auth state resolves, show a light skeleton instead of a blank flash.
  // (Unauthenticated users are redirected away by the effect above.)
  if (loading || !user) return (
    <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem 6rem' }}>
      <div style={{ height: '32px', width: '40%', backgroundColor: '#E8DDD3', marginBottom: '2rem', animation: 'pulse 1.5s infinite' }} />
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[80, 100, 100, 60].map((w, i) => (
          <div key={i} style={{ height: '18px', width: `${w}%`, backgroundColor: '#E8DDD3', animation: 'pulse 1.5s infinite' }} />
        ))}
      </div>
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.5; } }`}</style>
    </div>
  );

  const STATUS_COLORS: Record<string, { bg: string; color: string }> = {
    pending: { bg: '#FFF3E0', color: '#E65100' },
    in_production: { bg: '#E3F2FD', color: '#1565C0' },
    shipped: { bg: '#F3E5F5', color: '#6A1B9A' },
    delivered: { bg: '#E8F5E9', color: '#2E7D32' },
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '4rem 2rem 6rem' }}>

      {showWelcome && (
        <div style={{ backgroundColor: '#E8F5E9', border: '1px solid #A5D6A7', padding: '1rem 1.5rem', marginBottom: '2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2E7D32' }}>
            Welcome to Bloomingdew, {profile?.first_name}! Your account has been created.
          </p>
          <button onClick={() => setShowWelcome(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#2E7D32', fontSize: '1rem' }}>✕</button>
        </div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '3rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.4rem' }}>
            My Account
          </h1>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
            {user.email}
          </p>
        </div>
        <button onClick={() => { signOut(); router.push('/'); }} style={{
          fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em',
          textTransform: 'uppercase', color: '#9A8F87', background: 'none',
          border: '1px solid #E8DDD3', padding: '0.6rem 1.2rem', cursor: 'pointer',
        }}>
          Sign Out
        </button>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E8DDD3', marginBottom: '2.5rem', gap: '0' }}>
        {(['orders', 'profile', 'addresses'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)} style={{
            fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em',
            textTransform: 'uppercase', padding: '0.9rem 1.5rem', background: 'none',
            border: 'none', borderBottom: `2px solid ${tab === t ? '#2C2C2C' : 'transparent'}`,
            color: tab === t ? '#2C2C2C' : '#9A8F87', cursor: 'pointer',
          }}>
            {t === 'orders' ? 'Orders' : t === 'profile' ? 'Profile' : 'Addresses'}
          </button>
        ))}
      </div>

      {/* Orders */}
      {tab === 'orders' && (
        <div>
          {orders.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '5rem 0' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.3rem', color: '#2C2C2C', marginBottom: '0.75rem' }}>No orders yet</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87', marginBottom: '2rem' }}>Your order history will appear here.</p>
              <Link href="/shop" style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', letterSpacing: '0.15em', textTransform: 'uppercase', padding: '0.9rem 2rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', textDecoration: 'none' }}>
                Shop Now
              </Link>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {orders.map(order => (
                <div key={order.id} style={{ border: '1px solid #E8DDD3', padding: '1.5rem', backgroundColor: '#FFFFFF' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                    <div>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.25rem' }}>
                        Order #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#5C5450' }}>
                        {new Date(order.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <span style={{
                        padding: '0.25rem 0.75rem', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        fontFamily: "'Jost', sans-serif",
                        backgroundColor: STATUS_COLORS[order.status]?.bg || '#F5F5F5',
                        color: STATUS_COLORS[order.status]?.color || '#9A8F87',
                      }}>
                        {order.status?.replace('_', ' ')}
                      </span>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.9rem', fontWeight: 500, color: '#2C2C2C' }}>
                        ₦{order.total?.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  {order.items && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', paddingTop: '1rem', borderTop: '1px solid #F5F5F5' }}>
                      {order.items.map((item, i) => (
                        <p key={i} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#5C5450' }}>
                          {item.name} — Size {item.size} × {item.quantity}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Profile */}
      {tab === 'profile' && (
        <div style={{ maxWidth: '500px' }}>
          {!editProfile ? (
            <div style={{ border: '1px solid #E8DDD3', padding: '2rem', backgroundColor: '#FFFFFF' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C' }}>Personal Details</h2>
                <button onClick={() => setEditProfile(true)} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', background: 'none', border: '1px solid #E8DDD3', padding: '0.4rem 0.9rem', cursor: 'pointer' }}>
                  Edit
                </button>
              </div>
              {[
                { label: 'Name', value: `${profile?.first_name || ''} ${profile?.last_name || ''}`.trim() || '—' },
                { label: 'Email', value: user.email || '—' },
                { label: 'Phone', value: profile?.phone || '—' },
                { label: 'Birthday', value: profile?.birthday ? new Date(profile.birthday).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '—' },
              ].map(({ label, value }) => (
                <div key={label} style={{ marginBottom: '1rem', paddingBottom: '1rem', borderBottom: '1px solid #F5F5F5' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.3rem' }}>{label}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C' }}>{value}</p>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ border: '1px solid #E8DDD3', padding: '2rem', backgroundColor: '#FFFFFF' }}>
              <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' }}>Edit Profile</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={fieldLabel}>First Name</label>
                    <input style={fieldInput} value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Last Name</label>
                    <input style={fieldInput} value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Phone</label>
                  <input style={fieldInput} value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} placeholder="+234 801 234 5678" />
                </div>
                <div>
                  <label style={fieldLabel}>Birthday</label>
                  <input type="date" style={fieldInput} value={profileForm.birthday} onChange={e => setProfileForm({ ...profileForm, birthday: e.target.value })} />
                </div>
                {saveMsg && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32' }}>{saveMsg}</p>}
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={handleSaveProfile} disabled={saving} style={{ flex: 1, padding: '0.9rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: 'none', cursor: 'pointer' }}>
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                  <button onClick={() => setEditProfile(false)} style={{ padding: '0.9rem 1.5rem', backgroundColor: 'transparent', color: '#9A8F87', fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase', border: '1px solid #E8DDD3', cursor: 'pointer' }}>
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Addresses */}
      {tab === 'addresses' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#9A8F87' }}>
              {addresses.length} saved address{addresses.length !== 1 ? 'es' : ''}
            </p>
            <button onClick={() => setShowAddAddress(!showAddAddress)} style={{
              fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', padding: '0.6rem 1.2rem',
              backgroundColor: showAddAddress ? 'transparent' : '#2C2C2C',
              color: showAddAddress ? '#9A8F87' : '#FAF7F4',
              border: '1px solid #2C2C2C', cursor: 'pointer',
            }}>
              {showAddAddress ? 'Cancel' : '+ Add Address'}
            </button>
          </div>

          {/* Add address form */}
          {showAddAddress && (
            <div style={{ border: '1px solid #E8DDD3', padding: '2rem', backgroundColor: '#FFFFFF', marginBottom: '1.5rem' }}>
              <h3 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' }}>New Address</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={fieldLabel}>Label</label>
                  <select style={fieldInput} value={addressForm.label} onChange={e => setAddressForm({ ...addressForm, label: e.target.value })}>
                    {['Home', 'Work', 'Other'].map(l => <option key={l}>{l}</option>)}
                  </select>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={fieldLabel}>First Name</label>
                    <input style={fieldInput} value={addressForm.first_name} onChange={e => setAddressForm({ ...addressForm, first_name: e.target.value })} />
                  </div>
                  <div>
                    <label style={fieldLabel}>Last Name</label>
                    <input style={fieldInput} value={addressForm.last_name} onChange={e => setAddressForm({ ...addressForm, last_name: e.target.value })} />
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Address</label>
                  <input style={fieldInput} value={addressForm.address} onChange={e => setAddressForm({ ...addressForm, address: e.target.value })} placeholder="123 Example Street" />
                </div>
                <div>
                  <label style={fieldLabel}>Apartment / Suite (optional)</label>
                  <input style={fieldInput} value={addressForm.apartment} onChange={e => setAddressForm({ ...addressForm, apartment: e.target.value })} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={fieldLabel}>City</label>
                    <input style={fieldInput} value={addressForm.city} onChange={e => setAddressForm({ ...addressForm, city: e.target.value })} placeholder="Lagos" />
                  </div>
                  <div>
                    <label style={fieldLabel}>Postal Code</label>
                    <input style={fieldInput} value={addressForm.postcode} onChange={e => setAddressForm({ ...addressForm, postcode: e.target.value })} placeholder="100001" />
                  </div>
                </div>
                <div>
                  <label style={fieldLabel}>Phone</label>
                  <input style={fieldInput} value={addressForm.phone} onChange={e => setAddressForm({ ...addressForm, phone: e.target.value })} placeholder="+234 801 234 5678" />
                </div>
                <button onClick={handleSaveAddress} disabled={savingAddress || !addressForm.address || !addressForm.city} style={{
                  padding: '0.9rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
                  fontFamily: "'Jost', sans-serif", fontSize: '0.75rem',
                  letterSpacing: '0.15em', textTransform: 'uppercase',
                  border: 'none', cursor: 'pointer', opacity: savingAddress ? 0.7 : 1,
                }}>
                  {savingAddress ? 'Saving...' : 'Save Address'}
                </button>
              </div>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
            {addresses.map(addr => (
              <div key={addr.id} style={{ border: `1px solid ${addr.is_default ? '#C9A882' : '#E8DDD3'}`, padding: '1.5rem', backgroundColor: '#FFFFFF', position: 'relative' }}>
                {addr.is_default && (
                  <span style={{ position: 'absolute', top: '1rem', right: '1rem', fontFamily: "'Jost', sans-serif", fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A882' }}>
                    Default
                  </span>
                )}
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.75rem' }}>{addr.label}</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', color: '#2C2C2C', marginBottom: '0.25rem' }}>{addr.first_name} {addr.last_name}</p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#5C5450', lineHeight: 1.6 }}>
                  {addr.address}<br />{addr.city}, {addr.country}
                </p>
                <div style={{ display: 'flex', gap: '1rem', marginTop: '1.25rem' }}>
                  {!addr.is_default && (
                    <button onClick={() => setDefault(addr.id)} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#9A8F87', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                      Set Default
                    </button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.68rem', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#C0392B', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                    Remove
                  </button>
                </div>
              </div>
            ))}
            {addresses.length === 0 && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
                No saved addresses yet. Addresses are saved automatically when you place an order.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function AccountPage() {
  return (
    <Suspense>
      <AccountPageInner />
    </Suspense>
  );
}

const fieldLabel: React.CSSProperties = {
  display: 'block', fontFamily: "'Jost', sans-serif",
  fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#9A8F87', marginBottom: '0.5rem',
};
const fieldInput: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem',
  backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3',
  color: '#2C2C2C', fontFamily: "'Jost', sans-serif",
  fontSize: '0.88rem', fontWeight: 300, outline: 'none',
};
