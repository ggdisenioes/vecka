'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicada' },
  { value: 'archived', label: 'Archivada' },
]

const GRANT_STATUSES = [
  { value: 'active', label: 'Activo' },
  { value: 'expired', label: 'Expirado' },
  { value: 'revoked', label: 'Revocado' },
]

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

export default function MembershipTierEditor({ tier, initialCourses, allCourses, initialGrants }) {
  const router = useRouter()
  const [, startTransition] = useTransition()

  const [name, setName] = useState(tier.name || '')
  const [description, setDescription] = useState(tier.description || '')
  const [coverImageUrl, setCoverImageUrl] = useState(tier.cover_image_url || '')
  const [sortOrder, setSortOrder] = useState(tier.sort_order ?? 0)
  const [status, setStatus] = useState(tier.status || 'draft')

  const [courses, setCourses] = useState(initialCourses)
  const [grants, setGrants] = useState(initialGrants)

  const [newCourseId, setNewCourseId] = useState('')
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberExpires, setNewMemberExpires] = useState('')
  const [newMemberNotes, setNewMemberNotes] = useState('')

  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'info') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const linkedCourseIds = useMemo(() => new Set(courses.map((c) => c.id)), [courses])
  const linkableCourses = useMemo(
    () => allCourses.filter((c) => !linkedCourseIds.has(c.id)),
    [allCourses, linkedCourseIds],
  )

  async function handleSaveTier() {
    setBusy('save')
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          description,
          coverImageUrl,
          sortOrder,
          status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo guardar')
      showToast('Cambios guardados')
      startTransition(() => router.refresh())
    } catch (error) {
      showToast(error.message || 'Error al guardar', 'error')
    } finally {
      setBusy('')
    }
  }

  async function handleDeleteTier() {
    if (!window.confirm(`¿Borrar la membresía "${tier.name}"? Esto revoca el acceso de todos sus miembros.`)) return
    setBusy('delete')
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}`, { method: 'DELETE' })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo borrar')
      router.push('/admin/membresias')
    } catch (error) {
      showToast(error.message || 'Error al borrar', 'error')
      setBusy('')
    }
  }

  async function handleLinkCourse() {
    if (!newCourseId) return
    setBusy('link')
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: newCourseId, sortOrder: courses.length }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo agregar el curso')
      const added = allCourses.find((c) => c.id === newCourseId)
      if (added) setCourses([...courses, { ...added, sort_order: courses.length }])
      setNewCourseId('')
      showToast('Curso agregado')
      startTransition(() => router.refresh())
    } catch (error) {
      showToast(error.message || 'Error', 'error')
    } finally {
      setBusy('')
    }
  }

  async function handleUnlinkCourse(courseId) {
    if (!window.confirm('¿Quitar este curso del nivel?')) return
    setBusy(`unlink-${courseId}`)
    try {
      const res = await fetch(
        `/api/admin/membership-tiers/${tier.id}/courses?courseId=${encodeURIComponent(courseId)}`,
        { method: 'DELETE' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo quitar')
      setCourses(courses.filter((c) => c.id !== courseId))
      showToast('Curso quitado')
      startTransition(() => router.refresh())
    } catch (error) {
      showToast(error.message || 'Error', 'error')
    } finally {
      setBusy('')
    }
  }

  async function handleAddMember() {
    if (!newMemberEmail.trim()) return
    setBusy('grant')
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}/grants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: newMemberEmail.trim(),
          expiresAt: newMemberExpires || null,
          notes: newMemberNotes,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo otorgar acceso')
      setNewMemberEmail('')
      setNewMemberExpires('')
      setNewMemberNotes('')
      showToast('Acceso otorgado')
      startTransition(() => router.refresh())
    } catch (error) {
      showToast(error.message || 'Error', 'error')
    } finally {
      setBusy('')
    }
  }

  async function handleUpdateGrant(userId, patch) {
    setBusy(`grant-${userId}`)
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}/grants`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, ...patch }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo actualizar')
      setGrants(grants.map((g) => (g.user_id === userId ? { ...g, ...patch } : g)))
      showToast('Membresía actualizada')
      startTransition(() => router.refresh())
    } catch (error) {
      showToast(error.message || 'Error', 'error')
    } finally {
      setBusy('')
    }
  }

  async function handleRevokeGrant(userId) {
    if (!window.confirm('¿Revocar el acceso de este miembro?')) return
    setBusy(`revoke-${userId}`)
    try {
      const res = await fetch(
        `/api/admin/membership-tiers/${tier.id}/grants?userId=${encodeURIComponent(userId)}`,
        { method: 'DELETE' },
      )
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data?.error || 'No se pudo revocar')
      setGrants(grants.filter((g) => g.user_id !== userId))
      showToast('Acceso revocado')
      startTransition(() => router.refresh())
    } catch (error) {
      showToast(error.message || 'Error', 'error')
    } finally {
      setBusy('')
    }
  }

  return (
    <>
      <section className="admin-card">
        <div className="section-heading">
          <h2>Datos de la membresía</h2>
        </div>
        <div className="editor-section">
          <div className="editor-row">
            <div className="editor-field">
              <label>Nombre</label>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="editor-field">
              <label>Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div className="editor-field">
              <label>Orden</label>
              <input
                type="number"
                value={sortOrder}
                onChange={(e) => setSortOrder(Number(e.target.value) || 0)}
              />
            </div>
          </div>
          <div className="editor-field">
            <label>Descripción</label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Qué incluye esta membresía"
            />
          </div>
          <div className="editor-field">
            <label>Imagen de portada (URL)</label>
            <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} />
          </div>
          <div className="actions-row">
            <button
              type="button"
              className="admin-button"
              onClick={handleSaveTier}
              disabled={busy === 'save'}
            >
              {busy === 'save' ? 'Guardando…' : 'Guardar cambios'}
            </button>
            <button
              type="button"
              className="admin-button danger"
              onClick={handleDeleteTier}
              disabled={busy === 'delete'}
            >
              {busy === 'delete' ? 'Borrando…' : 'Borrar membresía'}
            </button>
          </div>
        </div>
      </section>

      <section className="admin-card">
        <div className="section-heading">
          <h3>Cursos incluidos</h3>
        </div>
        <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 13 }}>
          Los miembros de esta membresía obtienen acceso automático a todos los cursos listados acá.
          Para subir contenido (videos, PDFs, texto, sesiones en vivo) abrí el editor del curso.
        </p>

        {courses.length === 0 ? (
          <div className="empty-state">Todavía no hay cursos en esta membresía.</div>
        ) : (
          <ul className="materials-list">
            {courses.map((c) => (
              <li key={c.id}>
                <span>
                  <strong>{c.title}</strong>{' '}
                  <span className={`status-pill ${c.status}`}>{c.status}</span>
                </span>
                <span style={{ display: 'flex', gap: 8 }}>
                  <Link className="admin-button ghost" href={`/admin/courses/${c.id}`}>
                    Editar contenido
                  </Link>
                  <button
                    type="button"
                    className="admin-button danger"
                    onClick={() => handleUnlinkCourse(c.id)}
                    disabled={busy === `unlink-${c.id}`}
                  >
                    Quitar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}

        <div className="upload-row" style={{ marginTop: 14 }}>
          <select
            value={newCourseId}
            onChange={(e) => setNewCourseId(e.target.value)}
            style={{ flex: '1 1 240px', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--line, #dfd2c8)' }}
          >
            <option value="">Elegí un curso para agregar…</option>
            {linkableCourses.map((c) => (
              <option key={c.id} value={c.id}>
                {c.title} {c.is_membership ? '· (ya marcado membresía)' : ''}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="admin-button"
            onClick={handleLinkCourse}
            disabled={!newCourseId || busy === 'link'}
          >
            {busy === 'link' ? 'Agregando…' : 'Agregar curso'}
          </button>
        </div>
      </section>

      <section className="admin-card">
        <div className="section-heading">
          <h3>Miembros</h3>
        </div>
        <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 13 }}>
          Otorgá o revocá el acceso manualmente. El usuario tiene que estar registrado primero (entrar al menos una vez con su email).
        </p>

        <div className="upload-row" style={{ marginBottom: 14 }}>
          <input
            type="email"
            placeholder="email@ejemplo.com"
            value={newMemberEmail}
            onChange={(e) => setNewMemberEmail(e.target.value)}
            style={{ flex: '1 1 200px', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--line, #dfd2c8)' }}
          />
          <input
            type="datetime-local"
            value={newMemberExpires}
            onChange={(e) => setNewMemberExpires(e.target.value)}
            style={{ padding: '8px 12px', borderRadius: 12, border: '1px solid var(--line, #dfd2c8)' }}
            title="Vencimiento (opcional, vacío = vitalicia)"
          />
          <input
            type="text"
            placeholder="Notas (opcional)"
            value={newMemberNotes}
            onChange={(e) => setNewMemberNotes(e.target.value)}
            style={{ flex: '1 1 160px', padding: '8px 12px', borderRadius: 12, border: '1px solid var(--line, #dfd2c8)' }}
          />
          <button
            type="button"
            className="admin-button"
            onClick={handleAddMember}
            disabled={!newMemberEmail.trim() || busy === 'grant'}
          >
            {busy === 'grant' ? 'Otorgando…' : 'Otorgar acceso'}
          </button>
        </div>

        {grants.length === 0 ? (
          <div className="empty-state">Todavía no hay miembros en esta membresía.</div>
        ) : (
          <ul className="materials-list">
            {grants.map((g) => (
              <li key={g.id}>
                <span>
                  <strong>{g.profile?.email || g.user_id}</strong>{' '}
                  {g.profile?.full_name ? <span className="file-meta">· {g.profile.full_name}</span> : null}
                  <div className="file-meta">
                    Otorgado {formatDate(g.granted_at)}
                    {g.expires_at ? ` · Expira ${formatDate(g.expires_at)}` : ' · Vitalicia'}
                  </div>
                </span>
                <span style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <select
                    value={g.access_status}
                    onChange={(e) =>
                      handleUpdateGrant(g.user_id, {
                        accessStatus: e.target.value,
                        expiresAt: g.expires_at,
                      })
                    }
                    disabled={busy === `grant-${g.user_id}`}
                    style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)' }}
                  >
                    {GRANT_STATUSES.map((s) => (
                      <option key={s.value} value={s.value}>{s.label}</option>
                    ))}
                  </select>
                  <input
                    type="datetime-local"
                    value={toDatetimeLocal(g.expires_at)}
                    onChange={(e) =>
                      handleUpdateGrant(g.user_id, {
                        accessStatus: g.access_status,
                        expiresAt: e.target.value || null,
                      })
                    }
                    style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)' }}
                    title="Vencimiento"
                  />
                  <button
                    type="button"
                    className="admin-button danger"
                    onClick={() => handleRevokeGrant(g.user_id)}
                    disabled={busy === `revoke-${g.user_id}`}
                  >
                    Revocar
                  </button>
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {toast ? <div className={`toast ${toast.type === 'error' ? 'error' : ''}`}>{toast.message}</div> : null}
    </>
  )
}
