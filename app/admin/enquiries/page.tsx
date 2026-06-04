'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { getSession } from '../../../lib/supabase-admin';
import { supabase } from '../../../lib/supabase';

type Enquiry = {
  id: string;
  type: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  occasion: string;
  budget: string;
  measurements: Record<string, string> | null;
  status: string;
  created_at: string;
};

export default function EnquiriesPage() {
  const router = useRouter();
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState<'all' | 'contact' | 'custom'>('all');

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    const { data } = await supabase.from('enquiries').select('*').order('created_at', { ascending: false });
    setEnquiries(data || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabase.from('enquiries').update({ status: 'read' }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'read' } : e));
  };

  const markReplied = async (id: string) => {
    await supabase.from('enquiries').update({ status: 'replied' }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'replied' } : e));
  };

  const filtered = enquiries.filter(e => filter === 'all' || e.type === filter);
  const unread = enquiries.filter(e => e.status === 'unread').length;

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      <div style={{ backgroundColor: '#2C2C2C', padding: '1rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#FAF7F4', fontWeight: 500 }}>Bloomingdew Admin</h1>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          {[{ label: 'Products', href: '/admin' }, { label: 'Orders', href: '/admin/orders' }, { label: 'Enquiries', href: '/admin/enquiries' }, { label: 'Homepage', href: '/admin/homepage' }].map(({ label, href }) => (
            <Link key={href} href={href} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: href === '/admin/enquiries' ? '#C9A882' : '#9A8F87', textDecoration: 'none' }}>{label}</Link>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>Enquiries</h2>
            {unread > 0 && (
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#E65100', marginTop: '0.3rem' }}>
                {unread} unread message{unread !== 1 ? 's' : ''}
              </p>
            )}
          </div>
          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {(['all', 'contact', 'custom'] as const).map(f => (
              <button key={f} onClick={() => setFilter(f)} style={{
                padding: '0.4rem 1rem', border: '1px solid', cursor: 'pointer',
                fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'capitalize',
                borderColor: filter === f ? '#2C2C2C' : '#E8DDD3',
                backgroundColor: filter === f ? '#2C2C2C' : '#FFFFFF',
                color: filter === f ? '#FAF7F4' : '#2C2C2C',
              }}>
                {f === 'all' ? 'All' : f === 'contact' ? 'Contact' : 'Custom Orders'}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {loading ? (
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87', textAlign: 'center', padding: '4rem' }}>Loading...</p>
          ) : filtered.length === 0 ? (
            <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '4rem', textAlign: 'center' }}>
              <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>No enquiries yet</p>
              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>Messages from the contact and custom order forms will appear here.</p>
            </div>
          ) : filtered.map(enquiry => (
            <div key={enquiry.id} style={{
              backgroundColor: '#FFFFFF',
              border: `1px solid ${enquiry.status === 'unread' ? '#C9A882' : '#E8DDD3'}`,
              borderLeft: `4px solid ${enquiry.status === 'unread' ? '#C9A882' : enquiry.status === 'replied' ? '#2E7D32' : '#E8DDD3'}`,
            }}>
              {/* Header */}
              <div style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '1rem' }}
                onClick={() => { setExpanded(expanded === enquiry.id ? null : enquiry.id); if (enquiry.status === 'unread') markRead(enquiry.id); }}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap' }}>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C' }}>
                        {enquiry.first_name} {enquiry.last_name}
                      </p>
                      <span style={{
                        padding: '0.15rem 0.5rem', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        fontFamily: "'Jost', sans-serif",
                        backgroundColor: enquiry.type === 'custom' ? '#E3F2FD' : '#F3E5F5',
                        color: enquiry.type === 'custom' ? '#1565C0' : '#6A1B9A',
                      }}>
                        {enquiry.type === 'custom' ? 'Custom Order' : 'Contact'}
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>{enquiry.email}</p>
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#5C5450', maxWidth: '300px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {enquiry.subject || enquiry.occasion || enquiry.message?.slice(0, 60)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87' }}>
                    {new Date(enquiry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <span style={{
                    padding: '0.2rem 0.6rem', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontFamily: "'Jost', sans-serif",
                    backgroundColor: enquiry.status === 'unread' ? '#FFF3E0' : enquiry.status === 'replied' ? '#E8F5E9' : '#F5F5F5',
                    color: enquiry.status === 'unread' ? '#E65100' : enquiry.status === 'replied' ? '#2E7D32' : '#9A8F87',
                  }}>
                    {enquiry.status}
                  </span>
                  <span style={{ color: '#9A8F87', fontSize: '0.8rem' }}>{expanded === enquiry.id ? '▲' : '▼'}</span>
                </div>
              </div>

              {/* Expanded */}
              {expanded === enquiry.id && (
                <div style={{ borderTop: '1px solid #E8DDD3', padding: '1.5rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: enquiry.type === 'custom' ? '1fr 1fr' : '1fr', gap: '2rem' }}>
                    <div>
                      {enquiry.subject && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.5rem' }}>Subject: {enquiry.subject}</p>}
                      {enquiry.occasion && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.5rem' }}>Occasion: {enquiry.occasion}</p>}
                      {enquiry.budget && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87', marginBottom: '0.75rem' }}>Budget: {enquiry.budget}</p>}
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 300, color: '#2C2C2C', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>{enquiry.message}</p>
                    </div>

                    {enquiry.type === 'custom' && enquiry.measurements && (
                      <div>
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem' }}>Measurements</p>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                          {Object.entries(enquiry.measurements).filter(([, v]) => v).map(([key, value]) => (
                            <div key={key} style={{ padding: '0.5rem', backgroundColor: '#F5F5F5' }}>
                              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', textTransform: 'capitalize', color: '#9A8F87', marginBottom: '0.2rem' }}>{key}</p>
                              <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2C2C2C' }}>{value} cm</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', alignItems: 'center' }}>
                    <a href={`mailto:${enquiry.email}`} style={{
                      padding: '0.7rem 1.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
                      fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em',
                      textTransform: 'uppercase', textDecoration: 'none', display: 'inline-block',
                    }}>
                      Reply via Email
                    </a>
                    {enquiry.status !== 'replied' && (
                      <button onClick={() => markReplied(enquiry.id)} style={{
                        padding: '0.7rem 1.2rem', backgroundColor: 'transparent', color: '#2E7D32',
                        border: '1px solid #2E7D32', fontFamily: "'Jost', sans-serif",
                        fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                        Mark as Replied
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
