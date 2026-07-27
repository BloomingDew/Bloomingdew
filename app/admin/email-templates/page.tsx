'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
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
  const [newTemplate, setNewTemplate] = useState({ id: '', name: '', subject: '', body: '', variables: [] as string[] });
  const [newVariable, setNewVariable] = useState('');
  const [creating, setCreating] = useState(false);
  const [newError, setNewError] = useState('');
  const [hasUnsaved, setHasUnsaved] = useState(false);

  const bodyRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('email_templates').select('*').order('name');
    setTemplates(data || []);
    setLoading(false);
  };

  const confirmLeave = () => {
    if (hasUnsaved) {
      return window.confirm('You have unsaved changes. Leave anyway?');
    }
    return true;
  };

  const selectTemplate = (t: Template) => {
    if (!confirmLeave()) return;
    setSelected(t);
    setForm({ subject: t.subject, body: t.body });
    if (bodyRef.current) bodyRef.current.value = t.body;
    setSuccess('');
    setHasUnsaved(false);
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
      variables: newTemplate.variables,
    });
    if (error) {
      setNewError(error.message);
      setCreating(false);
      return;
    }
    await fetchTemplates();
    setShowNewForm(false);
    setNewTemplate({ id: '', name: '', subject: '', body: '', variables: [] });
    setNewVariable('');
    setCreating(false);
  };

  const handleSave = async () => {
    if (!selected) return;
    const currentBody = bodyRef.current ? bodyRef.current.value : form.body;
    setSaving(true);
    await supabase.from('email_templates')
      .update({ subject: form.subject, body: currentBody, updated_at: new Date().toISOString() })
      .eq('id', selected.id);
    setTemplates(prev => prev.map(t => t.id === selected.id ? { ...t, subject: form.subject, body: currentBody } : t));
    setSelected(prev => prev ? { ...prev, subject: form.subject, body: currentBody } : null);
    setSaving(false);
    setSuccess('Template saved successfully.');
    setHasUnsaved(false);
    setTimeout(() => setSuccess(''), 3000);
  };

  const deleteTemplate = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this template? This cannot be undone.')) return;
    await supabase.from('email_templates').delete().eq('id', id);
    setTemplates(prev => prev.filter(t => t.id !== id));
    if (selected?.id === id) {
      setSelected(null);
      setForm({ subject: '', body: '' });
      setHasUnsaved(false);
    }
  };

  const addNewVariable = () => {
    const v = newVariable.trim();
    if (!v || newTemplate.variables.includes(v)) return;
    setNewTemplate(p => ({ ...p, variables: [...p.variables, v] }));
    setNewVariable('');
  };

  const removeNewVariable = (v: string) => {
    setNewTemplate(p => ({ ...p, variables: p.variables.filter(x => x !== v) }));
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#F5F5F5' }}>
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
          <div style={{ display: 'grid', gridTemplateColumns: 'max(200px, 25%) 1fr', gap: '2rem', alignItems: 'start' }}>

            {/* Template list */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {templates.map(t => (
                <div key={t.id} style={{ position: 'relative' }}>
                  <button
                    onClick={() => { selectTemplate(t); setShowNewForm(false); }}
                    style={{
                      width: '100%', padding: '1.2rem 1.5rem', paddingBottom: '2rem', textAlign: 'left', cursor: 'pointer',
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
                  <button
                    onClick={e => { e.stopPropagation(); deleteTemplate(t.id); }}
                    title="Delete template"
                    style={{
                      position: 'absolute', bottom: '0.5rem', right: '0.75rem',
                      background: 'none', border: 'none', cursor: 'pointer',
                      fontFamily: "'Jost', sans-serif", fontSize: '0.68rem',
                      color: selected?.id === t.id && !showNewForm ? '#FAB9B9' : '#C0392B',
                      letterSpacing: '0.05em', padding: '2px 4px',
                    }}
                  >
                    Delete
                  </button>
                </div>
              ))}

              {/* Add new */}
              <button
                onClick={() => {
                  if (!confirmLeave()) return;
                  setShowNewForm(true);
                  setSelected(null);
                  setNewError('');
                  setHasUnsaved(false);
                }}
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

                <div style={{ marginBottom: '1.2rem' }}>
                  <label style={labelStyle}>Email Body</label>
                  <textarea
                    value={newTemplate.body}
                    onChange={e => setNewTemplate(p => ({ ...p, body: e.target.value }))}
                    rows={12}
                    style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.7 }}
                    placeholder="Write your email body here..."
                  />
                </div>

                {/* Variables */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Variables</label>
                  <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.6rem' }}>
                    <input
                      value={newVariable}
                      onChange={e => setNewVariable(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addNewVariable(); } }}
                      style={{ ...inputStyle, flex: 1 }}
                      placeholder="e.g. {{customer_name}}"
                    />
                    <button
                      onClick={addNewVariable}
                      style={{
                        padding: '0.85rem 1.2rem', backgroundColor: '#2C2C2C', color: '#FAF7F4',
                        fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                        letterSpacing: '0.1em', border: 'none', cursor: 'pointer', whiteSpace: 'nowrap',
                      }}
                    >
                      Add
                    </button>
                  </div>
                  {newTemplate.variables.length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                      {newTemplate.variables.map(v => (
                        <span key={v} style={{
                          fontFamily: "'Jost', sans-serif", fontSize: '0.78rem',
                          backgroundColor: '#E8DDD3', color: '#2C2C2C',
                          padding: '3px 10px', display: 'flex', alignItems: 'center', gap: '0.4rem',
                        }}>
                          {v}
                          <button
                            onClick={() => removeNewVariable(v)}
                            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#9A8F87', fontSize: '0.9rem', lineHeight: 1, padding: 0 }}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
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
                          const el = bodyRef.current;
                          if (el) {
                            const start = el.selectionStart;
                            const end = el.selectionEnd;
                            const current = el.value;
                            const newBody = current.substring(0, start) + v + current.substring(end);
                            el.value = newBody;
                            el.selectionStart = el.selectionEnd = start + v.length;
                            el.focus();
                            setForm(prev => ({ ...prev, body: newBody }));
                            setHasUnsaved(true);
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
                    onChange={e => { setForm(prev => ({ ...prev, subject: e.target.value })); setHasUnsaved(true); }}
                    style={inputStyle}
                    placeholder="Email subject..."
                  />
                </div>

                {/* Body — uncontrolled with ref to preserve cursor position */}
                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={labelStyle}>Email Body</label>
                  <textarea
                    id="body-textarea"
                    ref={bodyRef}
                    defaultValue={form.body}
                    onBlur={e => { setForm(prev => ({ ...prev, body: e.target.value })); }}
                    onChange={() => setHasUnsaved(true)}
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
