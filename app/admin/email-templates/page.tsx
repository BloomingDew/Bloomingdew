'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { supabase } from '../../../lib/supabase';
import { getSession } from '../../../lib/supabase-admin';

type Template = {
  id: string;
  name: string;
  subject: string;
  body: string;
  variables: string[];
  updated_at: string;
};

export default function EmailTemplatesPage() {
  const router = useRouter();
  const [templates, setTemplates] = useState<Template[]>([]);
  const [selected, setSelected] = useState<Template | null>(null);
  const [form, setForm] = useState({ subject: '', body: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTemplate, setNewTemplate] = useState({ id: '', name: '', subject: '', body: '' });
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState('');

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('email_templates').select('*').order('name');
    setTemplates(data || []);
    setLoading(false);
  };

  const selectTemplate = (t: Template) => {
    setSelected(t);
    setForm({ subject: t.subject, body: t.body });
    setSuccess('');
  };

  const handleCreate = async () => {
    if (!newTemplate.id || !newTemplate.name || !newTemplate.subject || !newTemplate.body) {
      setNewError('All fields are required.');
      return;
    }
    setCreating(true);
    setNewError('');
    const { error } = await supabase.from('email_templates').insert({
      id: newTemplate.id.toLowerCase().replace(/\s+/g, '-'),
      name: newTemplate.name,
      subject: newTemplate.subject,
      body: newTemplate.body,
      variables: [],
    });
    if (error) {
      setNewError(error.message);
      setCreating(false);
      return;
    }
    await fetchTemplates();
    setShowNewForm(false);
    setNewTemplate({ id: '', name: '', subject: '', body: '' });
    setCreating(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    await supabase.from('email_templates')
      .update({ subject: form.subject, body: form.body, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    setTemplates(prev => prev.map(t => t.id === selected.id ? { ...t, ...form } : t));
    setSelected(prev => prev ? { ...prev, ...form } : null);
    setSaving(false);
    setSuccess('Template saved successfully.');
    setTimeout(() => setSuccess(''), 3000);
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
      {/* Topbar */}
      <div style={{ backgroundColor: '#2C2C2C', padding: '0 2rem', height: '56px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Link href="/admin" style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#FAF7F4', textDecoration: 'none' }}>
          Bloomingdew
        </Link>
        <nav style={{ display: 'flex', gap: '2rem' }}>
          {[['Products', '/admin'], ['Orders', '/admin/orders'], ['Enquiries', '/admin/enquiries'], ['Email Templates', '/admin/email-templates']].map(([label, href]) => (
            <Link key={href} href={href} style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.75rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: href === '/admin/email-templates' ? '#C9A882' : '#9A8F87', textDecoration: 'none' }}>
              {label}
            </Link>
          ))}
        </nav>
      </div>

      <div style={{ maxWidth: '1100px', margin: '0 auto', padding: '3rem 2rem' }}>
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.8rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '0.5rem' }}>
          Email Templates
        </h1>
        <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87', marginBottom: '2.5rem' }}>
          Edit the emails sent to customers. Use the available variables to personalise each message.
        </p>

        {loading ? (
          <p style={{ fontFamily: "'Jost', sans-serif", color: '#9A8F87' }}>Loading...</p>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '260px 1fr', gap: '2rem', alignItems: 'start' }}>

            {/* Template list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {templates.map(t => (
                <button
                  key={t.id}
                  onClick={() => { selectTemplate(t); setShowNewForm(false); }}
                  style={{
                    padding: '1.2rem 1.5rem', textAlign: 'left', cursor: 'pointer',
                    backgroundColor: selected?.id === t.id && !showNewForm ? '#2C2C2C' : '#FFFFFF',
                    color: selected?.id === t.id && !showNewForm ? '#FAF7F4' : '#2C2C2C',
                    border: '1px solid #E8DDD3', transition: 'all 0.15s',
                  }}
                >
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 500, margin: '0 0 4px' }}>{t.name}</p>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', fontWeight: 300, margin: 0, opacity: 0.7 }}>
                    {selected?.id === t.id && !showNewForm ? 'Editing' : 'Click to edit'}
                  </p>
                </button>
              ))}

              {/* Add new */}
              <button
                onClick={() => { setShowNewForm(true); setSelected(null); setNewError(''); }}
                style={{
                  padding: '1rem 1.5rem', textAlign: 'left', cursor: 'pointer',
                  backgroundColor: showNewForm ? '#C9A882' : 'transparent',
                  color: showNewForm ? '#FAF7F4' : '#C9A882',
                  border: '1px dashed #C9A882', transition: 'all 0.15s',
                  fontFamily: "'Jost', sans-serif", fontSize: '0.82rem',
                  letterSpacing: '0.08em',
                }}
              >
                + New Template
              </button>
            </div>

            {/* New template form */}
            {showNewForm ? (
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '2rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' }}>
                  New Template
                </h2>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>Template ID <span style={{ color: '#9A8F87', fontSize: '0.68rem' }}>(no spaces, e.g. welcome-email)</span></label>
                  <input value={newTemplate.id} onChange={e => setNewTemplate(p => ({ ...p, id: e.target.value }))} style={inputStyle} placeholder="e.g. welcome-email" />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>Template Name</label>
                  <input value={newTemplate.name} onChange={e => setNewTemplate(p => ({ ...p, name: e.target.value }))} style={inputStyle} placeholder="e.g. Welcome Email" />
                </div>

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>Subject Line</label>
                  <input value={newTemplate.subject} onChange={e => setNewTemplate(p => ({ ...p, subject: e.target.value }))} style={inputStyle} placeholder="Email subject..." />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Email Body</label>
                  <textarea
                    value={newTemplate.body}
                    onChange={e => setNewTemplate(p => ({ ...p, body: e.target.value }))}
                    rows={12}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                    placeholder="Write your email body here..."
                  />
                </div>

                {newError && <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#C0392B', marginBottom: '1rem' }}>{newError}</p>}

                <div style={{ display: 'flex', gap: '1rem' }}>
                  <button onClick={handleCreate} disabled={creating} style={{
                    padding: '1rem 2rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
                    fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    border: 'none', cursor: creating ? 'not-allowed' : 'pointer', opacity: creating ? 0.7 : 1,
                  }}>
                    {creating ? 'Creating...' : 'Create Template'}
                  </button>
                  <button onClick={() => setShowNewForm(false)} style={{
                    padding: '1rem 2rem', backgroundColor: 'transparent', color: '#2C2C2C',
                    fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    border: '1px solid #E8DDD3', cursor: 'pointer',
                  }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : null}

            {/* Editor */}
            {!showNewForm && selected ? (
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '2rem' }}>
                <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', fontWeight: 500, color: '#2C2C2C', marginBottom: '1.5rem' }}>
                  {selected.name}
                </h2>

                {/* Available variables */}
                <div style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: '#FAF7F4', border: '1px solid #E8DDD3' }}>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.1em', textTransform: 'uppercase', color: '#9A8F87', marginBottom: '0.6rem' }}>
                    Available Variables
                  </p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {selected.variables.map(v => (
                      <span key={v} style={{
                        fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                        backgroundColor: '#E8DDD3', color: '#2C2C2C',
                        padding: '3px 10px', cursor: 'pointer',
                      }}
                        onClick={() => {
                          const el = document.getElementById('body-textarea') as HTMLTextAreaElement;
                          if (el) {
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const newBody = form.body.substring(0, start) + v + form.body.substring(end);
                            setForm(prev => ({ ...prev, body: newBody }));
                          }
                        }}
                        title="Click to insert at cursor"
                      >
                        {v}
                      </span>
                    ))}
                  </div>
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.7rem', color: '#9A8F87', margin: '0.5rem 0 0' }}>
                    Click a variable to insert it at cursor position in the body.
                  </p>
                </div>

                {/* Subject */}
                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>Subject Line</label>
                  <input
                    value={form.subject}
                    onChange={e => setForm(prev => ({ ...prev, subject: e.target.value }))}
                    style={inputStyle}
                    placeholder="Email subject..."
                  />
                </div>

                {/* Body */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Email Body</label>
                  <textarea
                    id="body-textarea"
                    value={form.body}
                    onChange={e => setForm(prev => ({ ...prev, body: e.target.value }))}
                    rows={16}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                    placeholder="Write your email..."
                  />
                </div>

                {success && (
                  <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', color: '#2E7D32', marginBottom: '1rem' }}>
                    {success}
                  </p>
                )}

                <button
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: '1rem 2.5rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
                    fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                    letterSpacing: '0.15em', textTransform: 'uppercase',
                    border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                    opacity: saving ? 0.7 : 1,
                  }}
                >
                  {saving ? 'Saving...' : 'Save Template'}
                </button>
              </div>
            ) : !showNewForm ? (
              <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '3rem', textAlign: 'center' }}>
                <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.1rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>
                  Select a template to edit
                </p>
                <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>
                  Choose from the list on the left, or create a new one.
                </p>
              </div>
            ) : null}
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Jost', sans-serif",
  fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#9A8F87', marginBottom: '0.5rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.85rem 1rem',
  backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3',
  color: '#2C2C2C', fontFamily: "'Jost', sans-serif",
  fontSize: '0.88rem', fontWeight: 300, outline: 'none',
  boxSizing: 'border-box',
};
