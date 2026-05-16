'use client'

import { useState, useMemo } from 'react'

function genCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase()
}

const defaultForm = {
  code: '',
  description: '',
  discountType: 'percent',
  discountValue: '',
  maxUses: '',
  validFrom: '',
  validUntil: '',
  tierIds: [],
  active: true,
}

export default function CouponsPanel({ initialCoupons, tiers }) {
  const [coupons, setCoupons] = useState(initialCoupons)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return q ? coupons.filter((c) => c.code.toLowerCase().includes(q) || (c.description || '').toLowerCase().includes(q)) : coupons
  }, [coupons, search])

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }))
  }

  function toggleTier(id) {
    setForm((f) => ({
      ...f,
      tierIds: f.tierIds.includes(id) ? f.tierIds.filter((t) => t !== id) : [...f.tierIds, id],
    }))
  }

  async function handleCreate(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          discountValue: Number(form.discountValue || 0),
          maxUses: form.maxUses ? Number(form.maxUses) : null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al crear')
      setCoupons((prev) => [data.coupon, ...prev])
      setForm(defaultForm)
      setShowForm(false)
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function toggleActive(coupon) {
    const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ active: !coupon.active }),
    })
    if (res.ok) {
      setCoupons((prev) => prev.map((c) => c.id === coupon.id ? { ...c, active: !c.active } : c))
    }
  }

  async function handleDelete(id) {
    if (!confirm('¿Eliminar este cupón? Esta acción no se puede deshacer.')) return
    const res = await fetch(`/api/admin/coupons/${id}`, { method: 'DELETE' })
    if (res.ok) setCoupons((prev) => prev.filter((c) => c.id !== id))
  }

  const inputStyle = { padding: '8px 12px', border: '1px solid #d0c8c0', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: '100%', boxSizing: 'border-box', background: '#fff' }
  const labelStyle = { fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, display: 'block' }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <input
          type="text"
          placeholder="Buscar cupón…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ ...inputStyle, width: 240 }}
        />
        <button
          className="admin-button"
          onClick={() => { setShowForm(true); setForm({ ...defaultForm, code: genCode() }) }}
        >
          + Nuevo cupón
        </button>
      </div>

      {showForm && (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(88% 0.012 60)', padding: 24, marginBottom: 24 }}>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginBottom: 16 }}>Nuevo cupón</h3>
          <form onSubmit={handleCreate}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14, marginBottom: 14 }}>
              <div>
                <label style={labelStyle}>Código</label>
                <div style={{ display: 'flex', gap: 6 }}>
                  <input style={{ ...inputStyle, flex: 1 }} value={form.code} onChange={field('code')} required placeholder="DESCUENTO20" />
                  <button type="button" onClick={() => setForm((f) => ({ ...f, code: genCode() }))} style={{ padding: '8px 10px', background: '#f0ece8', border: '1px solid #d0c8c0', borderRadius: 8, cursor: 'pointer', fontSize: 12 }} title="Generar código">⟳</button>
                </div>
              </div>
              <div>
                <label style={labelStyle}>Descripción</label>
                <input style={inputStyle} value={form.description} onChange={field('description')} placeholder="Opcional" />
              </div>
              <div>
                <label style={labelStyle}>Tipo de descuento</label>
                <select style={inputStyle} value={form.discountType} onChange={field('discountType')}>
                  <option value="percent">% Porcentaje</option>
                  <option value="fixed_ars">Monto fijo ARS</option>
                </select>
              </div>
              <div>
                <label style={labelStyle}>Valor del descuento</label>
                <input style={inputStyle} type="number" min="0" step="0.01" value={form.discountValue} onChange={field('discountValue')} required placeholder={form.discountType === 'percent' ? '20' : '5000'} />
              </div>
              <div>
                <label style={labelStyle}>Máximo de usos (vacío = ilimitado)</label>
                <input style={inputStyle} type="number" min="1" value={form.maxUses} onChange={field('maxUses')} placeholder="Ilimitado" />
              </div>
              <div>
                <label style={labelStyle}>Válido desde</label>
                <input style={inputStyle} type="date" value={form.validFrom} onChange={field('validFrom')} />
              </div>
              <div>
                <label style={labelStyle}>Válido hasta</label>
                <input style={inputStyle} type="date" value={form.validUntil} onChange={field('validUntil')} />
              </div>
            </div>

            {tiers.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Aplica a (vacío = todos los planes)</label>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {tiers.map((t) => (
                    <label key={t.id} style={{ display: 'flex', alignItems: 'center', gap: 6, fontFamily: 'DM Sans, sans-serif', fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" checked={form.tierIds.includes(t.id)} onChange={() => toggleTier(t.id)} />
                      {t.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {error && <div style={{ color: '#c0392b', fontFamily: 'DM Sans, sans-serif', fontSize: 13, marginBottom: 10 }}>{error}</div>}

            <div style={{ display: 'flex', gap: 10 }}>
              <button type="submit" disabled={saving} className="admin-button">{saving ? 'Guardando…' : 'Crear cupón'}</button>
              <button type="button" onClick={() => { setShowForm(false); setError(null) }} className="admin-button ghost">Cancelar</button>
            </div>
          </form>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="empty-state">
          {search ? 'No hay cupones que coincidan con la búsqueda.' : 'Todavía no hay cupones. Hacé clic en "+ Nuevo cupón" para crear el primero.'}
        </div>
      ) : (
        <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 80px 80px 90px 100px', padding: '11px 20px', background: 'oklch(96% 0.012 60)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
            {['Código', 'Descripción', 'Descuento', 'Usos', 'Límite', 'Vence', 'Estado'].map((h) => <div key={h}>{h}</div>)}
          </div>
          {filtered.map((c, i) => {
            const isExpired = c.valid_until && new Date(c.valid_until) < new Date()
            const isFull = c.max_uses !== null && c.uses_count >= c.max_uses
            const isEffectivelyActive = c.active && !isExpired && !isFull
            return (
              <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '140px 1fr 140px 80px 80px 90px 100px', padding: '13px 20px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                <div style={{ fontWeight: 700, fontFamily: 'monospace', fontSize: 14, color: '#1a3a6e' }}>{c.code}</div>
                <div style={{ color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.description || '—'}</div>
                <div style={{ fontWeight: 600, color: '#2e7d6a' }}>
                  {c.discount_type === 'percent' ? `${c.discount_value}%` : `$${Number(c.discount_value).toLocaleString('es-AR')} ARS`}
                </div>
                <div>{c.uses_count}</div>
                <div style={{ color: 'var(--muted)' }}>{c.max_uses ?? '∞'}</div>
                <div style={{ fontSize: 12, color: isExpired ? '#c0392b' : 'var(--muted)' }}>
                  {c.valid_until ? new Date(c.valid_until).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' }) : '—'}
                </div>
                <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                  <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 4, fontWeight: 700, background: isEffectivelyActive ? '#d4f0e6' : '#fde8e8', color: isEffectivelyActive ? '#2e7d6a' : '#7b1a1a' }}>
                    {isFull ? 'Agotado' : isExpired ? 'Vencido' : c.active ? 'Activo' : 'Pausado'}
                  </span>
                  <button onClick={() => toggleActive(c)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted)', fontSize: 13 }} title={c.active ? 'Pausar' : 'Activar'}>
                    {c.active ? '⏸' : '▶'}
                  </button>
                  <button onClick={() => handleDelete(c.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 13 }} title="Eliminar">✕</button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
