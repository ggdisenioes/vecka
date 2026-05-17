'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const ROLE_OPTIONS = [
  { value: 'student', label: 'Alumna' },
  { value: 'editorial', label: 'Editorial' },
  { value: 'admin', label: 'Admin' },
]

const STATUS_COLORS = {
  active: { bg: '#d4f0e6', color: '#2e7d6a' },
  expired: { bg: '#fde8e8', color: '#7b1a1a' },
  revoked: { bg: '#fde8e8', color: '#7b1a1a' },
}

const inputStyle = { padding: '9px 12px', border: '1px solid #d0c8c0', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: '100%', boxSizing: 'border-box', background: '#fff' }
const labelStyle = { fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, display: 'block' }

function initials(p) {
  const name = p.display_name || p.full_name || p.email || '?'
  return name.split(' ').map((n) => n[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('')
}

function periodLabel(period) {
  return period === 'monthly' ? 'mensual' : period === 'annual' ? 'anual' : period === 'lifetime' ? 'vitalicia' : ''
}

export default function UserDetail({ profile, enrollments, grants, availableCourses, availableTiers, userId }) {
  const router = useRouter()
  const [tab, setTab] = useState('perfil')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)

  // Profile form
  const [form, setForm] = useState({
    fullName: profile.full_name || '',
    displayName: profile.display_name || '',
    email: profile.email || '',
    phone: profile.phone || '',
    bio: profile.bio || '',
    role: profile.role || 'student',
  })

  // Enrollment state
  const [enrollmentList, setEnrollmentList] = useState(enrollments)
  const [addCourseId, setAddCourseId] = useState('')
  const [addingCourse, setAddingCourse] = useState(false)

  // Membership state
  const [grantList, setGrantList] = useState(grants)
  const [addTierId, setAddTierId] = useState('')
  const [addExpiresAt, setAddExpiresAt] = useState('')
  const [addNotes, setAddNotes] = useState('')
  const [addingGrant, setAddingGrant] = useState(false)

  function flash(msg, isError = false) {
    if (isError) { setError(msg); setSuccess(null) }
    else { setSuccess(msg); setError(null) }
    setTimeout(() => { setError(null); setSuccess(null) }, 3500)
  }

  async function saveProfile(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      flash('Cambios guardados correctamente.')
      router.refresh()
    } catch (err) {
      flash(err.message, true)
    } finally {
      setSaving(false)
    }
  }

  async function addCourse() {
    if (!addCourseId) return
    setAddingCourse(true)
    try {
      const res = await fetch('/api/admin/enrollments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, courseId: addCourseId, accessStatus: 'active' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al asignar')
      const course = availableCourses.find((c) => c.id === addCourseId)
      setEnrollmentList((prev) => [{ ...data.enrollment, courses: course || null }, ...prev])
      setAddCourseId('')
      flash('Curso asignado.')
    } catch (err) {
      flash(err.message, true)
    } finally {
      setAddingCourse(false)
    }
  }

  async function removeCourse(enrollmentId) {
    if (!confirm('¿Quitar acceso a este curso?')) return
    const res = await fetch(`/api/admin/enrollments/${enrollmentId}`, { method: 'DELETE' })
    if (res.ok) {
      setEnrollmentList((prev) => prev.filter((e) => e.id !== enrollmentId))
      flash('Inscripción eliminada.')
    }
  }

  async function addGrant() {
    if (!addTierId) return
    setAddingGrant(true)
    try {
      const tier = availableTiers.find((t) => t.id === addTierId)
      const res = await fetch('/api/admin/memberships', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: addTierId,
          email: profile.email,
          accessStatus: 'active',
          expiresAt: addExpiresAt || null,
          notes: addNotes || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al asignar')
      setGrantList((prev) => [{ ...data.grant, membership_tiers: tier || null }, ...prev])
      setAddTierId('')
      setAddExpiresAt('')
      setAddNotes('')
      flash('Membresía asignada.')
    } catch (err) {
      flash(err.message, true)
    } finally {
      setAddingGrant(false)
    }
  }

  async function removeGrant(grantId) {
    if (!confirm('¿Eliminar esta membresía?')) return
    const res = await fetch(`/api/admin/memberships/${grantId}`, { method: 'DELETE' })
    if (res.ok) {
      setGrantList((prev) => prev.filter((g) => g.id !== grantId))
      flash('Membresía eliminada.')
    }
  }

  async function revokeGrant(grantId) {
    const res = await fetch(`/api/admin/memberships/${grantId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessStatus: 'revoked' }),
    })
    if (res.ok) {
      setGrantList((prev) => prev.map((g) => g.id === grantId ? { ...g, access_status: 'revoked' } : g))
      flash('Membresía revocada.')
    }
  }

  async function sendPasswordReset() {
    try {
      const res = await fetch(`/api/admin/users/${userId}/reset-password`, { method: 'POST' })
      if (res.ok) flash('Email de recuperación enviado.')
      else flash('No se pudo enviar el email de recuperación.', true)
    } catch {
      flash('Error al enviar el email.', true)
    }
  }

  const tabs = [
    { id: 'perfil', label: 'Perfil' },
    { id: 'cursos', label: `Cursos (${enrollmentList.length})` },
    { id: 'membresias', label: `Membresías (${grantList.filter((g) => g.access_status === 'active').length})` },
  ]

  return (
    <div style={{ marginTop: 24 }}>
      {/* User header card */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '22px 26px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 20, display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 26, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
          {initials(profile)}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700 }}>
            {profile.display_name || profile.full_name || '—'}
          </div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, color: 'var(--muted)' }}>{profile.email}</div>
          <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>
            Miembro desde {new Date(profile.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' })}
            {' · '}
            <span style={{ fontWeight: 700, color: profile.role === 'admin' ? '#7b1a1a' : profile.role === 'editorial' ? '#1a3a6e' : '#2e7d6a' }}>
              {ROLE_OPTIONS.find((r) => r.value === profile.role)?.label || profile.role}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <div style={{ textAlign: 'center', padding: '10px 16px', background: '#f0faf6', borderRadius: 10 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: '#2e7d6a' }}>{enrollmentList.length}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)' }}>Cursos</div>
          </div>
          <div style={{ textAlign: 'center', padding: '10px 16px', background: '#eef2ff', borderRadius: 10 }}>
            <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 24, fontWeight: 700, color: '#1a3a6e' }}>{grantList.filter((g) => g.access_status === 'active').length}</div>
            <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 11, color: 'var(--muted)' }}>Membresías</div>
          </div>
        </div>
      </div>

      {/* Flash message */}
      {(success || error) && (
        <div style={{ padding: '12px 18px', borderRadius: 10, marginBottom: 16, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, background: error ? '#fde8e8' : '#d4f0e6', color: error ? '#7b1a1a' : '#2e7d6a' }}>
          {success || error}
        </div>
      )}

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: '2px solid oklch(88% 0.012 60)', marginBottom: 24, gap: 0 }}>
        {tabs.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{ padding: '10px 20px', border: 'none', borderBottom: `3px solid ${tab === t.id ? '#5e9e8a' : 'transparent'}`, marginBottom: -2, background: 'transparent', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: tab === t.id ? 700 : 400, color: tab === t.id ? '#5e9e8a' : 'var(--muted)', transition: 'all .15s', whiteSpace: 'nowrap' }}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* --- Perfil Tab --- */}
      {tab === 'perfil' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 20 }}>
          {/* Edit form */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px 26px', border: '1px solid oklch(88% 0.012 60)' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginTop: 0, marginBottom: 18 }}>Datos personales</h3>
            <form onSubmit={saveProfile} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <div>
                <label style={labelStyle}>Nombre completo</label>
                <input style={inputStyle} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Nombre para mostrar</label>
                <input style={inputStyle} value={form.displayName} onChange={(e) => setForm({ ...form, displayName: e.target.value })} placeholder={form.fullName} />
              </div>
              <div>
                <label style={labelStyle}>Email</label>
                <input style={inputStyle} type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
              </div>
              <div>
                <label style={labelStyle}>Teléfono</label>
                <input style={inputStyle} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} placeholder="+54 9 11 ..." />
              </div>
              <div>
                <label style={labelStyle}>Rol</label>
                <select style={inputStyle} value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                  {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Bio (opcional)</label>
                <textarea style={{ ...inputStyle, minHeight: 80, resize: 'vertical' }} value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} />
              </div>
              <button type="submit" disabled={saving} className="admin-button" style={{ alignSelf: 'flex-start' }}>
                {saving ? 'Guardando…' : 'Guardar cambios'}
              </button>
            </form>
          </div>

          {/* Actions */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '24px 26px', border: '1px solid oklch(88% 0.012 60)', height: 'fit-content' }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginTop: 0, marginBottom: 18 }}>Acciones</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <button
                onClick={sendPasswordReset}
                className="admin-button ghost"
                style={{ textAlign: 'left' }}
              >
                🔑 Enviar email para restablecer contraseña
              </button>
              <a
                href={`mailto:${profile.email}`}
                className="admin-button ghost"
                style={{ textDecoration: 'none', display: 'block', textAlign: 'left' }}
              >
                ✉ Enviar email directo
              </a>
            </div>
            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid oklch(92% 0.01 60)' }}>
              <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 700, color: '#c0392b', letterSpacing: '0.06em', textTransform: 'uppercase', marginBottom: 10 }}>Zona de peligro</div>
              <button
                onClick={async () => {
                  if (!confirm(`¿Eliminar permanentemente a ${profile.email}? Esta acción no se puede deshacer.`)) return
                  const res = await fetch(`/api/admin/users/${userId}`, { method: 'DELETE' })
                  if (res.ok) { flash('Usuario eliminado.'); setTimeout(() => router.push('/admin/usuarios'), 1200) }
                  else flash('No se pudo eliminar el usuario.', true)
                }}
                style={{ padding: '9px 18px', background: '#fde8e8', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: 8, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700 }}
              >
                Eliminar usuario
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- Cursos Tab --- */}
      {tab === 'cursos' && (
        <div>
          {/* Add course */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 18, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: 1, minWidth: 200 }}>
              <label style={labelStyle}>Asignar curso</label>
              <select style={inputStyle} value={addCourseId} onChange={(e) => setAddCourseId(e.target.value)}>
                <option value="">— Seleccionar curso —</option>
                {availableCourses
                  .filter((c) => !enrollmentList.some((e) => e.course_id === c.id))
                  .map((c) => <option key={c.id} value={c.id}>{c.title}</option>)
                }
              </select>
            </div>
            <button onClick={addCourse} disabled={!addCourseId || addingCourse} className="admin-button">
              {addingCourse ? 'Asignando…' : '+ Asignar'}
            </button>
          </div>

          {/* Enrollment list */}
          {enrollmentList.length === 0 ? (
            <div className="empty-state">Esta alumna no tiene cursos asignados.</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 80px', padding: '11px 20px', background: 'oklch(96% 0.012 60)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {['Curso', 'Estado', 'Asignado', ''].map((h) => <div key={h}>{h}</div>)}
              </div>
              {enrollmentList.map((e) => {
                const sc = STATUS_COLORS[e.access_status] || STATUS_COLORS.active
                return (
                  <div key={e.id} style={{ display: 'grid', gridTemplateColumns: '1fr 120px 140px 80px', padding: '13px 20px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{e.courses?.title || '—'}</div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>{e.courses?.category || ''}</div>
                    </div>
                    <div>
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {e.access_status === 'active' ? 'Activo' : e.access_status === 'expired' ? 'Expirado' : 'Revocado'}
                      </span>
                    </div>
                    <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                      {new Date(e.granted_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    <div>
                      <button onClick={() => removeCourse(e.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 13, padding: '4px 8px' }} title="Quitar acceso">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}

      {/* --- Membresías Tab --- */}
      {tab === 'membresias' && (
        <div>
          {/* Add grant */}
          <div style={{ background: '#fff', borderRadius: 14, padding: '20px 24px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 18 }}>
            <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 18, marginTop: 0, marginBottom: 14 }}>Asignar membresía</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 10, marginBottom: 12 }}>
              <div>
                <label style={labelStyle}>Plan</label>
                <select style={inputStyle} value={addTierId} onChange={(e) => setAddTierId(e.target.value)}>
                  <option value="">— Seleccionar —</option>
                  {availableTiers.map((t) => (
                    <option key={t.id} value={t.id}>{t.name} {periodLabel(t.billing_period) ? `· ${periodLabel(t.billing_period)}` : ''}</option>
                  ))}
                </select>
              </div>
              <div>
                <label style={labelStyle}>Fecha de vencimiento (opcional)</label>
                <input type="date" style={inputStyle} value={addExpiresAt} onChange={(e) => setAddExpiresAt(e.target.value)} />
              </div>
              <div>
                <label style={labelStyle}>Notas (opcional)</label>
                <input style={inputStyle} value={addNotes} onChange={(e) => setAddNotes(e.target.value)} placeholder="Ej: beca, cortesía..." />
              </div>
            </div>
            <button onClick={addGrant} disabled={!addTierId || addingGrant} className="admin-button">
              {addingGrant ? 'Asignando…' : '+ Asignar membresía'}
            </button>
          </div>

          {/* Grant list */}
          {grantList.length === 0 ? (
            <div className="empty-state">Esta alumna no tiene membresías asignadas.</div>
          ) : (
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 100px', padding: '11px 20px', background: 'oklch(96% 0.012 60)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {['Plan', 'Tipo', 'Estado', 'Vence', ''].map((h) => <div key={h}>{h}</div>)}
              </div>
              {grantList.map((g) => {
                const sc = STATUS_COLORS[g.access_status] || STATUS_COLORS.active
                const tier = g.membership_tiers
                return (
                  <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '1fr 110px 110px 110px 100px', padding: '13px 20px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                    <div>
                      <div style={{ fontWeight: 600 }}>{tier?.name || '—'}</div>
                      {g.notes && <div style={{ fontSize: 11, color: 'var(--muted)', marginTop: 2 }}>{g.notes}</div>}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      {g.grant_type === 'payment' ? 'Pago' : g.grant_type === 'trial' ? 'Prueba' : g.grant_type === 'manual' ? 'Manual' : 'Admin'}
                    </div>
                    <div>
                      <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700, background: sc.bg, color: sc.color }}>
                        {g.access_status === 'active' ? 'Activa' : g.access_status === 'expired' ? 'Expirada' : 'Revocada'}
                      </span>
                    </div>
                    <div style={{ fontSize: 12, color: 'var(--muted)' }}>
                      {g.expires_at ? new Date(g.expires_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Sin vencimiento'}
                    </div>
                    <div style={{ display: 'flex', gap: 4 }}>
                      {g.access_status === 'active' && (
                        <button onClick={() => revokeGrant(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 12, padding: '3px 6px' }} title="Revocar">⊘</button>
                      )}
                      <button onClick={() => removeGrant(g.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#c0392b', fontSize: 13, padding: '3px 6px' }} title="Eliminar">✕</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
