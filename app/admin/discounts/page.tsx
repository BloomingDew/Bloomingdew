'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getSession } from '../../../lib/supabase-admin';
import { toast } from '../../../components/Toast';

type Discount = {
  id: string;
  code: string;
  type: 'percent' | 'fixed';
  value: number;
  min_subtotal: number;
  starts_at: string | null;
  expires_at: string | null;
  max_uses: number | null;
  use_count: number;
  active: boolean;
  created_at: string;
};

const emptyForm = {
  code: '', type: 'percent' as 'percent' | 'fixed', value: '',
  min_subtotal: '', starts_at: '', expires_at: '', max_uses: '',
};

export default function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  useEffect(() => {
    getSession().then(s => { if (!s) router.push('/admin/login'); });
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    const res = await fetch('/api/admin/discounts');
    const data = await res.json().catch(() => ({}));
    if (res.ok) setDiscounts(data.discounts || []);
    setLoading(false);
  };

  const createDiscount = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch('/api/admin/discounts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: form.code,
        type: form.type,
        value: Number(form.value),
        min_subtotal: form.min_subtotal ? Number(form.min_subtotal) : 0,
        starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : null,
        expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
        max_uses: form.max_uses ? Number(form.max_uses) : null,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setSaving(false);
    if (!res.ok) { toast(data.error || 'Could not create the code.', 'error'); return; }
    setForm(emptyForm);
    setDiscounts(prev => [data.discount, ...prev]);
  };

  const toggleActive = async (d: Discount) => {
    const res = await fetch('/api/admin/discounts', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id, active: !d.active }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || 'Could not update the code.', 'error'); return; }
    setDiscounts(prev => prev.map(x => x.id === d.id ? data.discount : x));
  };

  const deleteDiscount = async (d: Discount) => {
    if (!confirm(`Delete code ${d.code}? This cannot be undone.`)) return;
    const res = await fetch('/api/admin/discounts', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: d.id }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) { toast(data.error || 'Could not delete the code.', 'error'); return; }
    setDiscounts(prev => prev.filter(x => x.id !== d.id));
  };

  const fmtWindow = (d: Discount) => {
    const fmt = (s: string) => new Date(s).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    if (!d.starts_at && !d.expires_at) return 'Always';
    if (d.starts_at && d.expires_at) return `${fmt(d.starts_at)} – ${fmt(d.expires_at)}`;
    if (d.starts_at) return `From ${fmt(d.starts_at)}`;
    return `Until ${fmt(d.expires_at!)}`;
  };

  return (
    <div>
      <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '3rem 2rem' }}>

        <div style={{ marginBottom: '1.5rem' }}>
          <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.6rem', fontWeight: 500, color: '#2C2C2C' }}>Discount Codes</h2>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.82rem', fontWeight: 300, color: '#9A8F87', marginTop: '0.3rem' }}>
            Create and manage promotional codes customers can apply at checkout.
          </p>
        </div>

        {/* Create form card */}
        <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '1.5rem', marginBottom: '2rem' }}>
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em', textTransform: 'uppercase', color: '#C9A882', marginBottom: '1rem' }}>
            New Code
          </p>
          <form onSubmit={createDiscount}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={labelStyle}>Code *</label>
                <input required style={inputStyle} value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value.toUpperCase() })} placeholder="WELCOME10" />
              </div>
              <div>
                <label style={labelStyle}>Type *</label>
                <select style={inputStyle} value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value as 'percent' | 'fixed' })}>
                  <option value="percent">Percent off</option>
                  <option value="fixed">Fixed amount (USD)</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>{form.type === 'percent' ? 'Percent *' : 'Amount (USD) *'}</label>
                <input required type="number" min="0.01" step="0.01" max={form.type === 'percent' ? 100 : undefined}
                  style={inputStyle} value={form.value}
                  onChange={e => setForm({ ...form, value: e.target.value })}
                  placeholder={form.type === 'percent' ? '10' : '10.00'} />
              </div>
              <div>
                <label style={labelStyle}>Min Subtotal (USD)</label>
                <input type="number" min="0" step="0.01" style={inputStyle} value={form.min_subtotal}
                  onChange={e => setForm({ ...form, min_subtotal: e.target.value })} placeholder="0" />
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
              <div>
                <label style={labelStyle}>Starts (optional)</label>
                <input type="datetime-local" style={inputStyle} value={form.starts_at}
                  onChange={e => setForm({ ...form, starts_at: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Expires (optional)</label>
                <input type="datetime-local" style={inputStyle} value={form.expires_at}
                  onChange={e => setForm({ ...form, expires_at: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Max Uses (optional)</label>
                <input type="number" min="1" step="1" style={inputStyle} value={form.max_uses}
                  onChange={e => setForm({ ...form, max_uses: e.target.value })} placeholder="Unlimited" />
              </div>
            </div>
            <button type="submit" disabled={saving} style={{
              padding: '0.7rem 1.8rem', backgroundColor: saving ? '#9A8F87' : '#2C2C2C', color: '#FAF7F4',
              fontFamily: "'Jost', sans-serif", fontSize: '0.72rem', letterSpacing: '0.12em',
              textTransform: 'uppercase', border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
            }}>
              {saving ? 'Creating…' : 'Create Code'}
            </button>
          </form>
        </div>

        {/* List */}
        {loading ? (
          <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', color: '#9A8F87', textAlign: 'center', padding: '4rem' }}>Loading...</p>
        ) : discounts.length === 0 ? (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', padding: '4rem', textAlign: 'center' }}>
            <p style={{ fontFamily: "'Playfair Display', serif", fontSize: '1.2rem', color: '#2C2C2C', marginBottom: '0.5rem' }}>No discount codes yet</p>
            <p style={{ fontFamily: "'Jost', sans-serif", fontSize: '0.85rem', fontWeight: 300, color: '#9A8F87' }}>Create your first code above.</p>
          </div>
        ) : (
          <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #E8DDD3' }}>
                  {['Code', 'Discount', 'Min Subtotal', 'Window', 'Uses', 'Status', ''].map(h => (
                    <th key={h} style={{
                      textAlign: 'left', padding: '0.9rem 1.2rem',
                      fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.12em',
                      textTransform: 'uppercase', color: '#9A8F87', fontWeight: 500,
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {discounts.map(d => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #E8DDD3', opacity: d.active ? 1 : 0.6 }}>
                    <td style={{ ...cellStyle, fontWeight: 500, letterSpacing: '0.08em' }}>{d.code}</td>
                    <td style={cellStyle}>{d.type === 'percent' ? `${Number(d.value)}%` : `$${Number(d.value).toFixed(2)}`}</td>
                    <td style={cellStyle}>{Number(d.min_subtotal) > 0 ? `$${Number(d.min_subtotal).toFixed(2)}` : '—'}</td>
                    <td style={cellStyle}>{fmtWindow(d)}</td>
                    <td style={cellStyle}>{d.use_count} / {d.max_uses ?? '∞'}</td>
                    <td style={cellStyle}>
                      <span style={{
                        padding: '0.2rem 0.6rem', fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase',
                        fontFamily: "'Jost', sans-serif",
                        backgroundColor: d.active ? '#E8F5E9' : '#F5F5F5',
                        color: d.active ? '#2E7D32' : '#9A8F87',
                      }}>
                        {d.active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td style={{ ...cellStyle, whiteSpace: 'nowrap' }}>
                      <button onClick={() => toggleActive(d)} style={{
                        padding: '0.4rem 0.9rem', backgroundColor: 'transparent',
                        color: d.active ? '#9A8F87' : '#2E7D32',
                        border: `1px solid ${d.active ? '#9A8F87' : '#2E7D32'}`,
                        fontFamily: "'Jost', sans-serif", fontSize: '0.65rem', letterSpacing: '0.1em',
                        textTransform: 'uppercase', cursor: 'pointer', marginRight: '0.5rem',
                      }}>
                        {d.active ? 'Deactivate' : 'Activate'}
                      </button>
                      <button onClick={() => deleteDiscount(d)} style={{
                        padding: '0.4rem 0.9rem', backgroundColor: 'transparent', color: '#C62828',
                        border: '1px solid #C62828', fontFamily: "'Jost', sans-serif",
                        fontSize: '0.65rem', letterSpacing: '0.1em', textTransform: 'uppercase', cursor: 'pointer',
                      }}>
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', fontFamily: "'Jost', sans-serif",
  fontSize: '0.68rem', letterSpacing: '0.12em', textTransform: 'uppercase',
  color: '#9A8F87', marginBottom: '0.4rem',
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '0.6rem 0.8rem', boxSizing: 'border-box',
  backgroundColor: '#FFFFFF', border: '1px solid #E8DDD3',
  color: '#2C2C2C', fontFamily: "'Jost', sans-serif",
  fontSize: '0.85rem', fontWeight: 300, outline: 'none',
};

const cellStyle: React.CSSProperties = {
  padding: '0.9rem 1.2rem', fontFamily: "'Jost', sans-serif",
  fontSize: '0.82rem', color: '#2C2C2C',
};
