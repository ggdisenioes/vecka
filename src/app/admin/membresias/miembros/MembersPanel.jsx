'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

const STATUS_LABELS = { active: 'Activa', expired: 'Expirada', revoked: 'Revocada' }
const STATUS_STYLES = {
  active: { background: '#d4edda', color: '#155724' },
  expired: { background: '#fff3cd', color: '#856404' },
  revoked: { background: '#f8d7da', color: '#721c24' },
}
const BILLING_LABELS = { monthly: '/mes', annual: '/año', lifetime: ' vitalicia', one_time: ' único' }

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const p = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`
}

function daysUntil(iso) {
  if (!iso) return null
  const diff = new Date(iso) - new Date()
  return Math.ceil(diff / 86400000)
}

function exportCSV(members) {
  const headers = ['Email', 'Nombre', 'Plan', 'Estado', 'Inicio', 'Vencimiento', 'Notas', 'Fuente']
  const rows = members.map((m) => [
    m.profile?.email || m.user_id,
    m.profile?.full_name || '',
    m.tier?.name || '',
    STATUS_LABELS[m.access_status] || m.access_status,
    formatDate(m.starts_at || m.granted_at),
    m.expires_at ? formatDate(m.expires_at) : 'Vitalicia',
    m.notes || '',
    m.payment_reference ? 'Pago' : 'Manual',
  ])
  const csv = [headers, ...rows].map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(',')).join('\n')
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `miembros-${new Date().toISOString().slice(0, 10)}.csv`
  a.click()
  URL.revokeObjectURL(url)
}

function StatCard({ label, value, sub, color }) {
  return (
    <div style={{ background: '#fff', border: '1px solid var(--line, #dfd2c8)', borderRadius: 14, padding: '18px 22px', flex: '1 1 160px' }}>
      <div style={{ fontSize: 28, fontWeight: 700, fontFamily: 'Cormorant Garamond, serif', color: color || 'var(--accent-deep)' }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: 'DM Sans, sans-serif', marginTop: 2 }}>{label}</div>
      {sub && <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function AddMemberModal({ tiers, onClose, onAdded }) {
  const [email, setEmail] = useState('')
  const [tierId, setTierId] = useState(tiers[0]?.id || '')
  const [expiresAt, setExpiresAt] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email.trim() || !tierId) return
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), tierId, expiresAt: expiresAt || null, notes }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'Error al crear')
      onAdded()
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: '32px 36px', width: '100%', maxWidth: 520, boxShadow: '0 20px 60px rgba(0,0,0,.18)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
          <h2 style={{ margin: 0, fontFamily: 'Cormorant Garamond, serif', fontSize: 24 }}>Agregar miembro</h2>
          <button type="button" onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 20, color: 'var(--muted)' }}>✕</button>
        </div>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div className="editor-field">
            <label>Email de la alumna *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@ejemplo.com" required disabled={loading} />
          </div>
          <div className="editor-field">
            <label>Plan de membresía *</label>
            <select value={tierId} onChange={(e) => setTierId(e.target.value)} required disabled={loading}>
              {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div className="editor-row">
            <div className="editor-field">
              <label>Vencimiento <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(vacío = vitalicia)</span></label>
              <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} disabled={loading} />
            </div>
          </div>
          <div className="editor-field">
            <label>Notas internas <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(opcional)</span></label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Ej: beca, cortesía, staff…" disabled={loading} />
          </div>
          {error && <p style={{ color: '#b85c5c', fontSize: 13, margin: 0 }}>{error}</p>}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button type="button" className="admin-button ghost" onClick={onClose} disabled={loading}>Cancelar</button>
            <button type="submit" className="admin-button" disabled={loading || !email.trim() || !tierId}>
              {loading ? 'Agregando…' : 'Otorgar acceso'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function MemberRow({ member, tiers, onUpdate, onDelete }) {
  const [editing, setEditing] = useState(false)
  const [status, setStatus] = useState(member.access_status)
  const [expiresAt, setExpiresAt] = useState(toDatetimeLocal(member.expires_at))
  const [tierId, setTierId] = useState(member.tier_id)
  const [notes, setNotes] = useState(member.notes || '')
  const [busy, setBusy] = useState(false)

  const days = daysUntil(member.expires_at)
  const isExpiringSoon = days !== null && days >= 0 && days <= 7

  async function save() {
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/memberships/${member.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accessStatus: status, expiresAt: expiresAt || null, tierId, notes }),
      })
      if (!res.ok) {
        const d = await res.json()
        throw new Error(d?.error || 'Error')
      }
      onUpdate(member.id, { access_status: status, expires_at: expiresAt || null, tier_id: tierId, notes })
      setEditing(false)
    } catch (err) {
      alert(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function revoke() {
    if (!window.confirm(`¿Revocar acceso de ${member.profile?.email || member.user_id}?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/memberships/${member.id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al revocar')
      onDelete(member.id)
    } catch (err) {
      alert(err.message)
      setBusy(false)
    }
  }

  const statusStyle = STATUS_STYLES[member.access_status] || {}
  const tierName = tiers.find((t) => t.id === member.tier_id)?.name || member.tier?.name || '—'

  return (
    <div style={{ background: '#fff', border: '1px solid var(--line, #dfd2c8)', borderRadius: 12, padding: '14px 18px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      {/* Header row */}
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 220px', minWidth: 0 }}>
          <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {member.profile?.email || member.user_id}
          </div>
          {member.profile?.full_name && (
            <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 1 }}>{member.profile.full_name}</div>
          )}
          <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 600, color: 'var(--accent-deep)' }}>{tierName}</span>
            <span>·</span>
            <span>Desde {formatDate(member.starts_at || member.granted_at)}</span>
            <span>·</span>
            <span style={{ color: isExpiringSoon ? '#856404' : 'var(--muted)' }}>
              {member.expires_at
                ? days !== null && days < 0
                  ? `Venció ${formatDate(member.expires_at)}`
                  : isExpiringSoon
                  ? `⚠ Vence en ${days} días`
                  : `Vence ${formatDate(member.expires_at)}`
                : 'Vitalicia'}
            </span>
            {member.notes && <span>· {member.notes}</span>}
            {member.payment_reference && <span>· Pago</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexShrink: 0, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, ...statusStyle }}>
            {STATUS_LABELS[member.access_status] || member.access_status}
          </span>
          <button type="button" className="admin-button ghost" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => setEditing(!editing)} disabled={busy}>
            {editing ? 'Cancelar' : 'Editar'}
          </button>
          <button type="button" className="admin-button danger" style={{ fontSize: 12, padding: '5px 12px' }} onClick={revoke} disabled={busy}>
            Revocar
          </button>
        </div>
      </div>

      {/* Edit form */}
      {editing && (
        <div style={{ borderTop: '1px solid var(--line, #dfd2c8)', paddingTop: 12, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Plan</label>
            <select value={tierId} onChange={(e) => setTierId(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Estado</label>
            <select value={status} onChange={(e) => setStatus(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
              <option value="active">Activa</option>
              <option value="expired">Expirada</option>
              <option value="revoked">Revocada</option>
            </select>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Vencimiento (vacío = vitalicia)</label>
            <input type="datetime-local" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)}
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
            <label style={{ fontSize: 11, color: 'var(--muted)' }}>Notas</label>
            <input type="text" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Notas internas…"
              style={{ padding: '7px 10px', borderRadius: 8, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }} />
          </div>
          <button type="button" className="admin-button" onClick={save} disabled={busy} style={{ flexShrink: 0 }}>
            {busy ? 'Guardando…' : 'Guardar'}
          </button>
        </div>
      )}
    </div>
  )
}

export default function MembersPanel({ initialGrants, tiers }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [grants, setGrants] = useState(initialGrants)
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterTier, setFilterTier] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)

  const filtered = useMemo(() => {
    const q = search.toLowerCase()
    return grants.filter((g) => {
      if (filterStatus && g.access_status !== filterStatus) return false
      if (filterTier && g.tier_id !== filterTier) return false
      if (q) {
        const email = (g.profile?.email || '').toLowerCase()
        const name = (g.profile?.full_name || '').toLowerCase()
        if (!email.includes(q) && !name.includes(q)) return false
      }
      return true
    })
  }, [grants, search, filterStatus, filterTier])

  const stats = useMemo(() => {
    const active = grants.filter((g) => g.access_status === 'active')
    const expiringSoon = active.filter((g) => {
      const d = daysUntil(g.expires_at)
      return d !== null && d >= 0 && d <= 7
    })
    const expired = grants.filter((g) => g.access_status === 'expired')
    return { total: grants.length, active: active.length, expiringSoon: expiringSoon.length, expired: expired.length }
  }, [grants])

  function handleUpdate(id, patch) {
    setGrants((prev) => prev.map((g) => g.id === id ? { ...g, ...patch } : g))
  }

  function handleDelete(id) {
    setGrants((prev) => prev.filter((g) => g.id !== id))
  }

  function handleAdded() {
    startTransition(() => router.refresh())
  }

  return (
    <>
      {/* Stats */}
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 24 }}>
        <StatCard label="Miembros activos" value={stats.active} sub={`de ${stats.total} total`} />
        <StatCard label="Vencen en 7 días" value={stats.expiringSoon} color={stats.expiringSoon > 0 ? '#856404' : undefined} />
        <StatCard label="Expiradas" value={stats.expired} color={stats.expired > 0 ? '#b85c5c' : undefined} />
        <StatCard label="Planes" value={tiers.length} sub="en el sistema" />
      </div>

      {/* Toolbar */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 16, alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por email o nombre…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: '1 1 240px', padding: '9px 14px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}
        />
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
          <option value="">Todos los estados</option>
          <option value="active">Activas</option>
          <option value="expired">Expiradas</option>
          <option value="revoked">Revocadas</option>
        </select>
        <select value={filterTier} onChange={(e) => setFilterTier(e.target.value)}
          style={{ padding: '9px 12px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
          <option value="">Todos los planes</option>
          {tiers.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <button type="button" className="admin-button ghost" onClick={() => exportCSV(filtered)} style={{ flexShrink: 0 }}>
          ↓ Exportar CSV
        </button>
        <button type="button" className="admin-button" onClick={() => setShowAddModal(true)} style={{ flexShrink: 0 }}>
          + Agregar miembro
        </button>
      </div>

      {/* Result count */}
      <p style={{ fontSize: 13, color: 'var(--muted)', margin: '0 0 12px' }}>
        {filtered.length === grants.length
          ? `${grants.length} miembros en total`
          : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''} de ${grants.length}`}
      </p>

      {/* Member list */}
      {filtered.length === 0 ? (
        <div className="empty-state">
          {grants.length === 0 ? 'Todavía no hay miembros. Hacé clic en "+ Agregar miembro" para empezar.' : 'No hay resultados para los filtros aplicados.'}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((g) => (
            <MemberRow
              key={g.id}
              member={g}
              tiers={tiers}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}

      {/* Add member modal */}
      {showAddModal && (
        <AddMemberModal
          tiers={tiers}
          onClose={() => setShowAddModal(false)}
          onAdded={handleAdded}
        />
      )}
    </>
  )
}
