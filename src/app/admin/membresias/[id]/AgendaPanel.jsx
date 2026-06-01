'use client'

import { useState } from 'react'

const EVENT_TYPE_OPTIONS = [
  { value: 'live_class', label: 'Clase en vivo' },
  { value: 'content_release', label: 'Publicación de contenido' },
  { value: 'other', label: 'Otro' },
]

function typeLabel(type) {
  return EVENT_TYPE_OPTIONS.find((o) => o.value === type)?.label || 'Evento'
}

function formatDateTime(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  return d.toLocaleString('es-AR', { dateStyle: 'medium', timeStyle: 'short' })
}

// Convierte un ISO a value usable por <input type="datetime-local"> en hora local.
function toLocalInput(value) {
  if (!value) return ''
  const d = new Date(value)
  if (Number.isNaN(d.getTime())) return ''
  const off = d.getTimezoneOffset()
  const local = new Date(d.getTime() - off * 60000)
  return local.toISOString().slice(0, 16)
}

const EMPTY_FORM = {
  title: '',
  eventType: 'live_class',
  startsAt: '',
  endsAt: '',
  locationUrl: '',
  description: '',
}

export default function AgendaPanel({ tierId, initialEvents = [] }) {
  const [events, setEvents] = useState(initialEvents)
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  function resetForm() {
    setForm(EMPTY_FORM)
    setEditingId(null)
    setError('')
  }

  function startEdit(ev) {
    setEditingId(ev.id)
    setError('')
    setForm({
      title: ev.title || '',
      eventType: ev.event_type || 'live_class',
      startsAt: toLocalInput(ev.starts_at),
      endsAt: toLocalInput(ev.ends_at),
      locationUrl: ev.location_url || '',
      description: ev.description || '',
    })
  }

  function sortEvents(list) {
    return [...list].sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (!form.title.trim()) return setError('El título es obligatorio.')
    if (!form.startsAt) return setError('La fecha y hora de inicio es obligatoria.')

    setBusy(true)
    setError('')
    try {
      const isEdit = Boolean(editingId)
      const url = isEdit
        ? `/api/admin/membership-agenda/${editingId}`
        : '/api/admin/membership-agenda'
      const res = await fetch(url, {
        method: isEdit ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId,
          title: form.title,
          eventType: form.eventType,
          startsAt: form.startsAt,
          endsAt: form.endsAt || null,
          locationUrl: form.locationUrl || null,
          description: form.description || null,
        }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo guardar')

      setEvents((prev) => {
        const next = isEdit
          ? prev.map((ev) => (ev.id === data.event.id ? data.event : ev))
          : [...prev, data.event]
        return sortEvents(next)
      })
      resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete(ev) {
    if (!confirm(`¿Eliminar "${ev.title}" de la agenda?`)) return
    setBusy(true)
    try {
      const res = await fetch(`/api/admin/membership-agenda/${ev.id}`, { method: 'DELETE' })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo eliminar')
      }
      setEvents((prev) => prev.filter((x) => x.id !== ev.id))
      if (editingId === ev.id) resetForm()
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  async function toggleCancel(ev) {
    setBusy(true)
    try {
      const nextStatus = ev.status === 'cancelled' ? 'scheduled' : 'cancelled'
      const res = await fetch(`/api/admin/membership-agenda/${ev.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || 'No se pudo actualizar')
      setEvents((prev) => prev.map((x) => (x.id === ev.id ? data.event : x)))
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  const now = Date.now()
  const upcoming = sortEvents(events).filter((ev) => new Date(ev.starts_at).getTime() >= now)
  const past = sortEvents(events).filter((ev) => new Date(ev.starts_at).getTime() < now).reverse()

  const renderRow = (ev) => {
    const cancelled = ev.status === 'cancelled'
    return (
      <div
        key={ev.id}
        style={{
          display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
          gap: 12, padding: '12px 14px', border: '1px solid #e7ddd4', borderRadius: 10,
          background: cancelled ? '#faf6f2' : '#fff', opacity: cancelled ? 0.65 : 1,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <span style={{
              fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.05em',
              padding: '2px 8px', borderRadius: 999,
              background: ev.event_type === 'live_class' ? '#e8f5f1' : '#f3eef8',
              color: ev.event_type === 'live_class' ? '#1d5f55' : '#5b3f79',
            }}>
              {typeLabel(ev.event_type)}
            </span>
            <strong style={{ fontSize: 14 }}>{ev.title}</strong>
            {cancelled && <span style={{ fontSize: 11, color: '#b85c5c', fontWeight: 600 }}>Cancelado</span>}
          </div>
          <div style={{ fontSize: 13, color: '#596567', marginTop: 4 }}>
            🗓 {formatDateTime(ev.starts_at)}
            {ev.ends_at ? ` — ${formatDateTime(ev.ends_at)}` : ''}
          </div>
          {ev.location_url && (
            <a href={ev.location_url} target="_blank" rel="noopener noreferrer"
              style={{ fontSize: 12, color: '#1d5f55' }}>
              {ev.location_url}
            </a>
          )}
          {ev.description && <p style={{ fontSize: 12, color: '#596567', margin: '4px 0 0' }}>{ev.description}</p>}
        </div>
        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
          <button type="button" className="admin-button ghost" onClick={() => startEdit(ev)} disabled={busy}>
            Editar
          </button>
          <button type="button" className="admin-button ghost" onClick={() => toggleCancel(ev)} disabled={busy}>
            {cancelled ? 'Reactivar' : 'Cancelar'}
          </button>
          <button type="button" className="admin-button ghost" onClick={() => handleDelete(ev)} disabled={busy}
            style={{ color: '#b85c5c' }}>
            Eliminar
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) 340px', gap: 24, alignItems: 'start' }}>
      {/* Lista de eventos */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div>
          <h3 style={{ margin: '0 0 10px', fontSize: 15 }}>Próximos ({upcoming.length})</h3>
          {upcoming.length === 0 ? (
            <p style={{ color: '#596567', fontSize: 14 }}>No hay eventos programados todavía.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{upcoming.map(renderRow)}</div>
          )}
        </div>

        {past.length > 0 && (
          <div>
            <h3 style={{ margin: '0 0 10px', fontSize: 15, color: '#596567' }}>Pasados ({past.length})</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>{past.map(renderRow)}</div>
          </div>
        )}
      </div>

      {/* Formulario crear / editar */}
      <form onSubmit={handleSubmit} style={{
        position: 'sticky', top: 16, display: 'flex', flexDirection: 'column', gap: 12,
        padding: 18, border: '1px solid #e7ddd4', borderRadius: 14, background: '#fffefb',
      }}>
        <h3 style={{ margin: 0, fontSize: 15 }}>{editingId ? 'Editar evento' : 'Nuevo evento'}</h3>

        <div className="editor-field">
          <label>Título</label>
          <input value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Ej: Clase en vivo — Vestido Bohemio" />
        </div>

        <div className="editor-field">
          <label>Tipo</label>
          <select value={form.eventType}
            onChange={(e) => setForm({ ...form, eventType: e.target.value })}>
            {EVENT_TYPE_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        <div className="editor-field">
          <label>Inicio</label>
          <input type="datetime-local" value={form.startsAt}
            onChange={(e) => setForm({ ...form, startsAt: e.target.value })} />
        </div>

        <div className="editor-field">
          <label>Fin (opcional)</label>
          <input type="datetime-local" value={form.endsAt}
            onChange={(e) => setForm({ ...form, endsAt: e.target.value })} />
        </div>

        <div className="editor-field">
          <label>Link (Zoom/Vimeo, opcional)</label>
          <input value={form.locationUrl}
            onChange={(e) => setForm({ ...form, locationUrl: e.target.value })}
            placeholder="https://..." />
        </div>

        <div className="editor-field">
          <label>Descripción (opcional)</label>
          <textarea rows={3} value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>

        {error && <p style={{ color: '#b85c5c', fontSize: 13, margin: 0 }}>{error}</p>}

        <div style={{ display: 'flex', gap: 8 }}>
          <button type="submit" className="admin-button" disabled={busy}>
            {busy ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Agregar a la agenda'}
          </button>
          {editingId && (
            <button type="button" className="admin-button ghost" onClick={resetForm} disabled={busy}>
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  )
}
