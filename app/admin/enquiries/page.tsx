'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession, supabaseAuth } from '../../../lib/supabase-admin';

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
  const [showArchived, setShowArchived] = useState(false);
  const [search, setSearch] = useState('');
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replySubject, setReplySubject] = useState('');
  const [replyMessage, setReplyMessage] = useState('');
  const [replyError, setReplyError] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [replySent, setReplySent] = useState<string | null>(null);

  const openReply = (enquiry: Enquiry) => {
    setReplyingTo(enquiry.id);
    setReplySubject(enquiry.subject ? `Re: ${enquiry.subject}` : 'Re: Your enquiry — Bloomingdew');
    setReplyMessage('');
    setReplyError('');
    setReplySent(null);
  };

  const sendReply = async (enquiryId: string) => {
    if (!replySubject.trim() || !replyMessage.trim()) {
      setReplyError('Please fill in the subject and message.');
      return;
    }
    setSendingReply(true);
    setReplyError('');
    const res = await fetch('/api/admin/enquiries/reply', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enquiryId, subject: replySubject, message: replyMessage }),
    });
    setSendingReply(false);
    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: 'Unknown error' }));
      setReplyError(error || 'Failed to send.');
      return;
    }
    setReplyingTo(null);
    setReplySent(enquiryId);
    setEnquiries(prev => prev.map(e => e.id === enquiryId ? { ...e, status: 'replied' } : e));
  };

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchEnquiries();
  }, []);

  const fetchEnquiries = async () => {
    const { data } = await supabaseAuth.from('enquiries').select('*').order('created_at', { ascending: false });
    setEnquiries(data || []);
    setLoading(false);
  };

  const markRead = async (id: string) => {
    await supabaseAuth.from('enquiries').update({ status: 'read' }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'read' } : e));
  };

  const markUnread = async (id: string) => {
    await supabaseAuth.from('enquiries').update({ status: 'unread' }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'unread' } : e));
  };

  const markReplied = async (id: string) => {
    await supabaseAuth.from('enquiries').update({ status: 'replied' }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'replied' } : e));
  };

  const markAccepted = async (id: string) => {
    await supabaseAuth.from('enquiries').update({ status: 'accepted' }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'accepted' } : e));
  };

  const archiveEnquiry = async (id: string) => {
    await supabaseAuth.from('enquiries').update({ status: 'archived' }).eq('id', id);
    setEnquiries(prev => prev.map(e => e.id === id ? { ...e, status: 'archived' } : e));
    setExpanded(null);
  };

  const searchLower = search.toLowerCase();
  const filtered = enquiries.filter(e => {
    if (!showArchived && e.status === 'archived') return false;
    if (filter !== 'all' && e.type !== filter) return false;
    if (search) {
      const fullName = `${e.first_name} ${e.last_name}`.toLowerCase();
      if (!fullName.includes(searchLower) && !e.email.toLowerCase().includes(searchLower)) return false;
    }
    return true;
  });

  const unread = enquiries.filter(e => e.status === 'unread').length;
  const accepted = enquiries.filter(e => e.status === 'accepted').length;

  return (
    <div>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>Enquiries</h2>
            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.3rem', flexWrap: 'wrap' }}>
              {unread > 0 && (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#E65100' }}>
                  {unread} unread message{unread !== 1 ? 's' : ''}
                </p>
              )}
              {accepted > 0 && (
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.78rem', color: '#1565C0' }}>
                  {accepted} accepted order{accepted !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
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
            <button onClick={() => setShowArchived(v => !v)} style={{
              padding: '0.4rem 1rem', border: '1px solid', cursor: 'pointer',
              fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em',
              borderColor: showArchived ? '#9A8F87' : '#E8DDD3',
              backgroundColor: showArchived ? '#9A8F87' : '#FFFFFF',
              color: showArchived ? '#FAF7F4' : '#9A8F87',
            }}>
              {showArchived ? 'Hide Archived' : 'Show Archived'}
            </button>
          </div>
        </div>

        {/* Search */}
        <div style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="Search by name or email…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '0.6rem 1rem', border: '1px solid #E8DDD3',
              fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2C2C2C',
              outline: 'none', backgroundColor: '#FFFFFF', boxSizing: 'border-box',
            }}
          />
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
              borderLeft: `4px solid ${enquiry.status === 'unread' ? '#C9A882' : enquiry.status === 'accepted' ? '#1565C0' : enquiry.status === 'replied' ? '#2E7D32' : enquiry.status === 'archived' ? '#BDBDBD' : '#E8DDD3'}`,
              opacity: enquiry.status === 'archived' ? 0.7 : 1,
            }}>
              {/* Header — toggle only, no auto-mark-read */}
              <div style={{ padding: '1.2rem 1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer', flexWrap: 'wrap', gap: '1rem' }}
                onClick={() => setExpanded(expanded === enquiry.id ? null : enquiry.id)}>
                <div style={{ display: 'flex', gap: '2rem', alignItems: 'center', flexWrap: 'wrap', minWidth: 0, flex: 1 }}>
                  <div style={{ flexShrink: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.2rem' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.88rem', fontWeight: 500, color: '#2C2C2C' }}>
                        {enquiry.first_name} {enquiry.last_name}
                      </p>
                      <span style={{
                        padding: '0.15rem 0.5rem', fontSize: '0.62rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        fontFamily: "'Jost', sans-serif", flexShrink: 0,
                        backgroundColor: enquiry.type === 'custom' ? '#E3F2FD' : '#F3E5F5',
                        color: enquiry.type === 'custom' ? '#1565C0' : '#6A1B9A',
                      }}>
                        {enquiry.type === 'custom' ? 'Custom Order' : 'Contact'}
                      </span>
                    </div>
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', color: '#9A8F87' }}>{enquiry.email}</p>
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#5C5450', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0, maxWidth: '300px' }}>
                    {enquiry.subject || enquiry.occasion || enquiry.message?.slice(0, 60)}
                  </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexShrink: 0 }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', color: '#9A8F87' }}>
                    {new Date(enquiry.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                  </p>
                  <span style={{
                    padding: '0.2rem 0.6rem', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                    fontFamily: "'Jost', sans-serif",
                    backgroundColor: enquiry.status === 'unread' ? '#FFF3E0' : enquiry.status === 'accepted' ? '#E3F2FD' : enquiry.status === 'replied' ? '#E8F5E9' : enquiry.status === 'archived' ? '#F5F5F5' : '#F5F5F5',
                    color: enquiry.status === 'unread' ? '#E65100' : enquiry.status === 'accepted' ? '#1565C0' : enquiry.status === 'replied' ? '#2E7D32' : '#9A8F87',
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

                  {/* In-admin reply */}
                  {replyingTo === enquiry.id ? (
                    <div style={{ marginTop: '1.5rem', border: '1px solid #E8DDD3', padding: '1.2rem', backgroundColor: '#FAFAFA' }}>
                      <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '0.75rem' }}>
                        Reply to {enquiry.email}
                      </p>
                      <input
                        value={replySubject}
                        onChange={e => setReplySubject(e.target.value)}
                        placeholder="Subject"
                        style={{ width: '100%', padding: '0.6rem 0.75rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', outline: 'none', marginBottom: '0.6rem', boxSizing: 'border-box' }}
                      />
                      <textarea
                        value={replyMessage}
                        onChange={e => setReplyMessage(e.target.value)}
                        placeholder="Write your reply..."
                        style={{ width: '100%', minHeight: '120px', padding: '0.75rem', border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', outline: 'none', resize: 'vertical', boxSizing: 'border-box' }}
                      />
                      {replyError && (
                        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.8rem', color: '#C62828', marginTop: '0.5rem' }}>{replyError}</p>
                      )}
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.9rem' }}>
                        <button onClick={() => sendReply(enquiry.id)} disabled={sendingReply} style={{
                          padding: '0.6rem 1.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none',
                          fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em',
                          textTransform: 'uppercase', cursor: sendingReply ? 'default' : 'pointer', opacity: sendingReply ? 0.6 : 1,
                        }}>
                          {sendingReply ? 'Sending…' : 'Send Reply'}
                        </button>
                        <button onClick={() => setReplyingTo(null)} style={{
                          padding: '0.6rem 1.2rem', backgroundColor: 'transparent', color: '#9A8F87',
                          border: '1px solid #E8DDD3', fontFamily: "'Jost', sans-serif", fontSize: '0.72rem',
                          letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                        }}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : replySent === enquiry.id ? (
                    <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#2E7D32', marginTop: '1.5rem' }}>
                      Reply sent ✓
                    </p>
                  ) : null}

                  <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                    {replyingTo !== enquiry.id && (
                      <button onClick={() => openReply(enquiry)} style={{
                        padding: '0.7rem 1.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4', border: 'none',
                        fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em',
                        textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                        Reply
                      </button>
                    )}

                    {/* Mark as Read — only shown when status is unread */}
                    {enquiry.status === 'unread' && (
                      <button onClick={() => markRead(enquiry.id)} style={{
                        padding: '0.7rem 1.2rem', backgroundColor: 'transparent', color: '#9A8F87',
                        border: '1px solid #9A8F87', fontFamily: "'Jost', sans-serif",
                        fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                        Mark as Read
                      </button>
                    )}

                    {/* Mark as Unread — shown when read, replied, or accepted */}
                    {(enquiry.status === 'read' || enquiry.status === 'replied' || enquiry.status === 'accepted') && (
                      <button onClick={() => markUnread(enquiry.id)} style={{
                        padding: '0.7rem 1.2rem', backgroundColor: 'transparent', color: '#E65100',
                        border: '1px solid #E65100', fontFamily: "'Jost', sans-serif",
                        fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                        Mark as Unread
                      </button>
                    )}

                    {enquiry.status !== 'accepted' && enquiry.status !== 'archived' && (
                      <button onClick={() => markAccepted(enquiry.id)} style={{
                        padding: '0.7rem 1.2rem', backgroundColor: '#1565C0', color: '#FFFFFF',
                        border: 'none', fontFamily: "'Jost', sans-serif",
                        fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                        Accept
                      </button>
                    )}

                    {enquiry.status !== 'replied' && enquiry.status !== 'accepted' && enquiry.status !== 'archived' && (
                      <button onClick={() => markReplied(enquiry.id)} style={{
                        padding: '0.7rem 1.2rem', backgroundColor: 'transparent', color: '#2E7D32',
                        border: '1px solid #2E7D32', fontFamily: "'Jost', sans-serif",
                        fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                        Mark as Replied
                      </button>
                    )}

                    {enquiry.status !== 'archived' && (
                      <button onClick={() => archiveEnquiry(enquiry.id)} style={{
                        padding: '0.7rem 1.2rem', backgroundColor: 'transparent', color: '#BDBDBD',
                        border: '1px solid #BDBDBD', fontFamily: "'Jost', sans-serif",
                        fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', cursor: 'pointer',
                        marginLeft: 'auto',
                      }}>
                        Archive
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
