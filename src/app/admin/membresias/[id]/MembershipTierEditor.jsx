'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STATUSES = [
  { value: 'draft', label: 'Borrador' },
  { value: 'published', label: 'Publicada' },
  { value: 'archived', label: 'Archivada' },
]

const BILLING_PERIODS = [
  { value: 'monthly', label: 'Mensual' },
  { value: 'annual', label: 'Anual' },
  { value: 'lifetime', label: 'Vitalicia' },
  { value: 'one_time', label: 'Pago único' },
]

const GRANT_STATUSES = [
  { value: 'active', label: 'Activa' },
  { value: 'expired', label: 'Expirada' },
  { value: 'revoked', label: 'Revocada' },
]

const STATUS_COLORS = {
  active: { bg: '#d4edda', color: '#155724' },
  expired: { bg: '#fff3cd', color: '#856404' },
  revoked: { bg: '#f8d7da', color: '#721c24' },
}

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function FeaturesList({ features, onChange }) {
  const [newFeature, setNewFeature] = useState('')

  function add() {
    const trimmed = newFeature.trim()
    if (!trimmed) return
    onChange([...features, trimmed])
    setNewFeature('')
  }

  function remove(index) {
    onChange(features.filter((_, i) => i !== index))
  }

  function handleKey(e) {
    if (e.key === 'Enter') { e.preventDefault(); add() }
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {features.length > 0 && (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
          {features.map((f, i) => (
            <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f8f4f1', borderRadius: 8, padding: '7px 12px' }}>
              <span style={{ flex: 1, fontSize: 13, fontFamily: 'DM Sans, sans-serif' }}>✓ {f}</span>
              <button type="button" onClick={() => remove(i)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#b85c5c', fontSize: 16, lineHeight: 1, padding: '0 2px' }}>×</button>
            </li>
          ))}
        </ul>
      )}
      <div style={{ display: 'flex', gap: 8 }}>
        <input
          value={newFeature}
          onChange={(e) => setNewFeature(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ej: Acceso a todos los cursos"
          style={{ flex: 1, padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
        />
        <button type="button" className="admin-button ghost" onClick={add} disabled={!newFeature.trim()}>
          + Agregar
        </button>
      </div>
    </div>
  )
}

export default function MembershipTierEditor({ tier, initialCourses, allCourses, initialGrants }) {
  const router = useRouter()
  const [, startTransition] = useTransition()
  const [activeTab, setActiveTab] = useState('datos')

  // Datos del plan
  const [name, setName] = useState(tier.name || '')
  const [description, setDescription] = useState(tier.description || '')
  const [coverImageUrl, setCoverImageUrl] = useState(tier.cover_image_url || '')
  const [sortOrder, setSortOrder] = useState(tier.sort_order ?? 0)
  const [status, setStatus] = useState(tier.status || 'draft')
  const [priceArs, setPriceArs] = useState(tier.price_ars ?? 0)
  const [priceUsd, setPriceUsd] = useState(tier.price_usd ?? 0)
  const [billingPeriod, setBillingPeriod] = useState(tier.billing_period || 'monthly')
  const [trialDays, setTrialDays] = useState(tier.trial_days ?? 0)
  const [features, setFeatures] = useState(tier.features || [])
  const [isFeatured, setIsFeatured] = useState(Boolean(tier.is_featured))

  // Cursos y miembros
  const [courses, setCourses] = useState(initialCourses)
  const [grants, setGrants] = useState(initialGrants)

  // Formulario nuevo miembro
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberExpires, setNewMemberExpires] = useState('')
  const [newMemberNotes, setNewMemberNotes] = useState('')

  // Formulario agregar curso
  const [newCourseId, setNewCourseId] = useState('')
  const [newCourseTitle, setNewCourseTitle] = useState('')
  const [newCourseSubtitle, setNewCourseSubtitle] = useState('')

  const [busy, setBusy] = useState('')
  const [toast, setToast] = useState(null)

  function showToast(message, type = 'ok') {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3500)
  }

  const linkedCourseIds = useMemo(() => new Set(courses.map((c) => c.id)), [courses])
  const linkableCourses = useMemo(() => allCourses.filter((c) => !linkedCourseIds.has(c.id)), [allCourses, linkedCourseIds])
  const publishedCourseCount = courses.filter((c) => c.status === 'published').length
  const publishChecklist = [
    { key: 'data', label: 'Datos públicos', done: Boolean(name.trim() && description.trim()), required: true },
    { key: 'features', label: 'Beneficios visibles', done: features.length > 0 },
    { key: 'courses', label: 'Curso interno vinculado', done: courses.length > 0, required: true },
    { key: 'publishedContent', label: 'Contenido publicado', done: publishedCourseCount > 0, required: true },
  ]
  const requiredReady = publishChecklist.filter((item) => item.required).every((item) => item.done)
  const missingRequired = publishChecklist.filter((item) => item.required && !item.done).length
  const suggestedCourseTitle = `${name.trim() || 'Membresía'} · Contenido`

  async function handleSaveTier() {
    setBusy('save')
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, coverImageUrl, sortOrder, status, priceArs, priceUsd, billingPeriod, trialDays, features, isFeatured }),
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

  async function handlePublish() {
    if (!requiredReady) {
      showToast('Faltan datos o contenido publicado para publicar la membresía', 'error')
      setActiveTab(name.trim() && description.trim() ? 'cursos' : 'datos')
      return
    }

    const previousStatus = status
    setBusy('publish')
    setStatus('published')
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description, coverImageUrl, sortOrder, status: 'published', priceArs, priceUsd, billingPeriod, trialDays, features, isFeatured }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo publicar')
      showToast('Membresía publicada')
      startTransition(() => router.refresh())
    } catch (error) {
      setStatus(previousStatus)
      showToast(error.message || 'Error al publicar', 'error')
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
      if (!res.ok) throw new Error(data?.error || 'No se pudo agregar')
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

  async function handleCreateMembershipCourse() {
    const title = (newCourseTitle || suggestedCourseTitle).trim()
    if (!title) return
    setBusy('create-course')
    try {
      const courseRes = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          subtitle: newCourseSubtitle,
          isMembership: true,
          status: 'draft',
          visibility: 'private',
        }),
      })
      const courseData = await courseRes.json()
      if (!courseRes.ok) throw new Error(courseData?.error || 'No se pudo crear el curso')

      const course = courseData.course
      const linkRes = await fetch(`/api/admin/membership-tiers/${tier.id}/courses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, sortOrder: courses.length }),
      })
      const linkData = await linkRes.json().catch(() => ({}))
      if (!linkRes.ok) throw new Error(linkData?.error || 'No se pudo vincular el curso')

      setCourses([...courses, { ...course, sort_order: courses.length }])
      setNewCourseTitle('')
      setNewCourseSubtitle('')
      showToast('Curso interno creado')
      router.push(`/admin/courses/${course.id}?tab=constructor`)
    } catch (error) {
      showToast(error.message || 'Error al crear el curso', 'error')
      setBusy('')
    }
  }

  async function handleUnlinkCourse(courseId) {
    if (!window.confirm('¿Quitar este curso de la membresía?')) return
    setBusy(`unlink-${courseId}`)
    try {
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}/courses?courseId=${encodeURIComponent(courseId)}`, { method: 'DELETE' })
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
        body: JSON.stringify({ email: newMemberEmail.trim(), expiresAt: newMemberExpires || null, notes: newMemberNotes }),
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
      const res = await fetch(`/api/admin/membership-tiers/${tier.id}/grants?userId=${encodeURIComponent(userId)}`, { method: 'DELETE' })
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

  const activeCount = grants.filter((g) => g.access_status === 'active').length

  return (
    <>
      <section className="admin-card membership-admin-panel">
        <div className="section-heading">
          <h2>Membership Admin</h2>
          <span className={`status-pill ${requiredReady ? 'published' : 'draft'}`}>
            {requiredReady ? 'Lista para publicar' : `${missingRequired} pendiente${missingRequired === 1 ? '' : 's'}`}
          </span>
        </div>

        <div className="membership-admin-grid">
          <div className="readiness-list">
            {publishChecklist.map((item) => (
              <div key={item.key} className={`readiness-item${item.done ? ' done' : ''}`}>
                <span aria-hidden="true">{item.done ? '✓' : '•'}</span>
                <strong>{item.label}</strong>
              </div>
            ))}
          </div>

          <div className="membership-admin-actions">
            <button type="button" className="admin-button ghost" onClick={() => setActiveTab('datos')}>
              Datos
            </button>
            <button type="button" className="admin-button ghost" onClick={() => setActiveTab('cursos')}>
              Contenido
            </button>
            {status === 'published' ? (
              <Link className="admin-button ghost" href={`/membresia/${tier.slug}`} target="_blank">
                Ver pública
              </Link>
            ) : (
              <button type="button" className="admin-button" onClick={handlePublish} disabled={!!busy || !requiredReady}>
                {busy === 'publish' ? 'Publicando…' : 'Publicar'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Tabs */}
      <div className="editor-tabs" style={{ marginBottom: 20 }}>
        {[
          { id: 'datos', label: 'Datos del plan' },
          { id: 'cursos', label: `Cursos incluidos (${courses.length})` },
          { id: 'miembros', label: `Miembros (${activeCount} activos)` },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`editor-tab${activeTab === tab.id ? ' active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB: DATOS */}
      {activeTab === 'datos' && (
        <section className="admin-card editor-section">
          <div className="section-heading">
            <h2>Datos del plan</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              {status !== 'published' && (
                <button type="button" className="admin-button" style={{ background: 'var(--accent-deep)', color: '#fff' }} onClick={handlePublish} disabled={!!busy || !requiredReady}>
                  {busy === 'publish' ? 'Publicando…' : 'Publicar'}
                </button>
              )}
              <button type="button" className="admin-button ghost" onClick={handleSaveTier} disabled={!!busy}>
                {busy === 'save' ? 'Guardando…' : 'Guardar'}
              </button>
              <button type="button" className="admin-button danger" onClick={handleDeleteTier} disabled={!!busy}>
                Eliminar
              </button>
            </div>
          </div>

          <div className="editor-row">
            <div className="editor-field">
              <label>Nombre del plan</label>
              <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Plan Premium" />
            </div>
            <div className="editor-field">
              <label>Estado</label>
              <select value={status} onChange={(e) => setStatus(e.target.value)}>
                {STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div className="editor-field">
              <label>Período de facturación</label>
              <select value={billingPeriod} onChange={(e) => setBillingPeriod(e.target.value)}>
                {BILLING_PERIODS.map((b) => <option key={b.value} value={b.value}>{b.label}</option>)}
              </select>
            </div>
            <div className="editor-field">
              <label>Orden</label>
              <input type="number" min={0} value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value) || 0)} style={{ maxWidth: 90 }} />
            </div>
          </div>

          <div className="editor-row">
            <div className="editor-field">
              <label>Precio (ARS)</label>
              <input type="number" min={0} value={priceArs} onChange={(e) => setPriceArs(Number(e.target.value) || 0)} placeholder="0" />
            </div>
            <div className="editor-field">
              <label>Precio (USD)</label>
              <input type="number" min={0} step="0.01" value={priceUsd} onChange={(e) => setPriceUsd(Number(e.target.value) || 0)} placeholder="0" />
            </div>
            <div className="editor-field">
              <label>Días de prueba gratuita</label>
              <input type="number" min={0} value={trialDays} onChange={(e) => setTrialDays(Number(e.target.value) || 0)} placeholder="0" />
            </div>
            <div className="editor-field">
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                Plan destacado
              </label>
              <span style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>Aparece con badge en la página pública</span>
            </div>
          </div>

          <div className="editor-field">
            <label>Descripción interna</label>
            <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Descripción visible solo en el admin" />
          </div>

          <div className="editor-field">
            <label>Imagen de portada (URL)</label>
            <input value={coverImageUrl} onChange={(e) => setCoverImageUrl(e.target.value)} placeholder="https://..." />
          </div>

          <div className="editor-field">
            <label>Beneficios visibles al público</label>
            <p style={{ margin: '0 0 8px', fontSize: 12, color: 'var(--muted)' }}>
              Estos aparecen como lista de checkmarks en la página de la membresía. Presioná Enter o hacé clic en "+ Agregar".
            </p>
            <FeaturesList features={features} onChange={setFeatures} />
          </div>
        </section>
      )}

      {/* TAB: CURSOS */}
      {activeTab === 'cursos' && (
        <section className="admin-card editor-section">
          <div className="section-heading">
            <h3>Cursos incluidos</h3>
          </div>
          <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 13 }}>
            Las alumnas con esta membresía activa acceden automáticamente a estos cursos.
          </p>

          <div className="membership-content-create">
            <div className="section-heading" style={{ marginBottom: 8 }}>
              <h4>Nuevo curso interno</h4>
            </div>
            <div className="editor-row">
              <div className="editor-field">
                <label>Título</label>
                <input
                  value={newCourseTitle}
                  onChange={(e) => setNewCourseTitle(e.target.value)}
                  placeholder={suggestedCourseTitle}
                />
              </div>
              <div className="editor-field">
                <label>Subtítulo</label>
                <input
                  value={newCourseSubtitle}
                  onChange={(e) => setNewCourseSubtitle(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
              <div className="editor-field" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="admin-button" onClick={handleCreateMembershipCourse} disabled={busy === 'create-course'}>
                  {busy === 'create-course' ? 'Creando…' : 'Crear y abrir constructor'}
                </button>
              </div>
            </div>
          </div>

          {courses.length === 0 ? (
            <div className="empty-state">Todavía no hay cursos en esta membresía.</div>
          ) : (
            <ul className="materials-list">
              {courses.map((c) => (
                <li key={c.id}>
                  <div>
                    <strong>{c.title}</strong>
                    <span className={`status-pill ${c.status}`} style={{ marginLeft: 8 }}>{c.status}</span>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Link className="admin-button ghost" href={`/admin/courses/${c.id}`} style={{ fontSize: 13, padding: '5px 12px' }}>
                      Editar curso
                    </Link>
                    <button type="button" className="admin-button danger" style={{ fontSize: 13, padding: '5px 12px' }} onClick={() => handleUnlinkCourse(c.id)} disabled={busy === `unlink-${c.id}`}>
                      Quitar
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
            <select
              value={newCourseId}
              onChange={(e) => setNewCourseId(e.target.value)}
              style={{ flex: '1 1 240px', padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif' }}
            >
              <option value="">Elegí un curso para agregar…</option>
              {linkableCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
            <button type="button" className="admin-button" onClick={handleLinkCourse} disabled={!newCourseId || busy === 'link'}>
              {busy === 'link' ? 'Agregando…' : '+ Agregar curso'}
            </button>
          </div>
        </section>
      )}

      {/* TAB: MIEMBROS */}
      {activeTab === 'miembros' && (
        <section className="admin-card editor-section">
          <div className="section-heading">
            <h3>Miembros</h3>
            <span style={{ fontSize: 13, color: 'var(--muted)' }}>{activeCount} activos · {grants.length} total</span>
          </div>
          <p style={{ marginTop: 0, color: 'var(--muted)', fontSize: 13 }}>
            El usuario tiene que haberse registrado al menos una vez con su email antes de poder asignarle acceso.
          </p>

          {/* Formulario nuevo miembro */}
          <div style={{ background: '#f8f4f1', borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 14, fontFamily: 'DM Sans, sans-serif' }}>Otorgar acceso manual</h4>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '2 1 220px' }}>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>Email de la alumna *</label>
                <input
                  type="email"
                  placeholder="email@ejemplo.com"
                  value={newMemberEmail}
                  onChange={(e) => setNewMemberEmail(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 180px' }}>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>Vencimiento (vacío = vitalicia)</label>
                <input
                  type="datetime-local"
                  value={newMemberExpires}
                  onChange={(e) => setNewMemberExpires(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 160px' }}>
                <label style={{ fontSize: 12, color: 'var(--muted)' }}>Notas internas</label>
                <input
                  type="text"
                  placeholder="Ej: beca, cortesía, staff…"
                  value={newMemberNotes}
                  onChange={(e) => setNewMemberNotes(e.target.value)}
                  style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif' }}
                />
              </div>
              <button type="button" className="admin-button" onClick={handleAddMember} disabled={!newMemberEmail.trim() || busy === 'grant'} style={{ flexShrink: 0 }}>
                {busy === 'grant' ? 'Otorgando…' : 'Otorgar acceso'}
              </button>
            </div>
          </div>

          {/* Lista de miembros */}
          {grants.length === 0 ? (
            <div className="empty-state">Todavía no hay miembros en esta membresía.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {grants.map((g) => {
                const statusStyle = STATUS_COLORS[g.access_status] || {}
                return (
                  <div key={g.id} style={{ background: '#fff', border: '1px solid var(--line, #dfd2c8)', borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 16, alignItems: 'center', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 200px', minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 14, fontFamily: 'DM Sans, sans-serif', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {g.profile?.email || g.user_id}
                      </div>
                      {g.profile?.full_name && (
                        <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 2 }}>{g.profile.full_name}</div>
                      )}
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 4 }}>
                        Otorgado {formatDate(g.granted_at)}
                        {g.expires_at ? ` · Vence ${formatDate(g.expires_at)}` : ' · Vitalicia'}
                        {g.notes ? ` · ${g.notes}` : ''}
                      </div>
                    </div>

                    <span style={{ fontSize: 12, fontWeight: 600, padding: '3px 10px', borderRadius: 20, ...statusStyle, flexShrink: 0 }}>
                      {GRANT_STATUSES.find((s) => s.value === g.access_status)?.label || g.access_status}
                    </span>

                    <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                      <select
                        value={g.access_status}
                        onChange={(e) => handleUpdateGrant(g.user_id, { accessStatus: e.target.value, expiresAt: g.expires_at })}
                        disabled={busy === `grant-${g.user_id}`}
                        style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
                      >
                        {GRANT_STATUSES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <input
                        type="datetime-local"
                        value={toDatetimeLocal(g.expires_at)}
                        onChange={(e) => handleUpdateGrant(g.user_id, { accessStatus: g.access_status, expiresAt: e.target.value || null })}
                        title="Fecha de vencimiento"
                        style={{ padding: '6px 10px', borderRadius: 10, border: '1px solid var(--line, #dfd2c8)', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
                      />
                      <button
                        type="button"
                        className="admin-button danger"
                        style={{ fontSize: 13, padding: '6px 12px' }}
                        onClick={() => handleRevokeGrant(g.user_id)}
                        disabled={busy === `revoke-${g.user_id}`}
                      >
                        Revocar
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      )}

      {toast && (
        <div style={{
          position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
          background: toast.type === 'error' ? '#b85c5c' : 'var(--accent-deep, #4a7d6e)',
          color: '#fff', borderRadius: 10, padding: '12px 20px',
          fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 500,
          boxShadow: '0 4px 20px rgba(0,0,0,.15)',
        }}>
          {toast.message}
        </div>
      )}
    </>
  )
}
