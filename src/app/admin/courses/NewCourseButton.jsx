'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCourseButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [title, setTitle] = useState('')
  const [subtitle, setSubtitle] = useState('')
  const [error, setError] = useState(null)
  const titleRef = useRef(null)

  useEffect(() => {
    if (open) {
      setTitle('')
      setSubtitle('')
      setError(null)
      setTimeout(() => titleRef.current?.focus(), 50)
    }
  }, [open])

  useEffect(() => {
    function onKey(e) {
      if (e.key === 'Escape') setOpen(false)
    }
    if (open) document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!title.trim()) { setError('El título es obligatorio'); return }
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), subtitle: subtitle.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo crear el curso')
      router.refresh()
      router.push(`/admin/courses/${data.course.id}?tab=constructor`)
    } catch (err) {
      setError(err.message || 'Error al crear el curso')
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className="admin-button" onClick={() => setOpen(true)}>
        + Nuevo curso
      </button>

      {open && (
        <div className="modal-backdrop" onClick={(e) => { if (e.target === e.currentTarget) setOpen(false) }}>
          <div className="modal-box">
            <div className="modal-header">
              <h2>Nuevo curso</h2>
              <button type="button" className="modal-close" onClick={() => setOpen(false)} aria-label="Cerrar">✕</button>
            </div>

            <form onSubmit={handleSubmit} className="modal-body">
              <div className="editor-field">
                <label>Título del curso <span style={{ color: '#b85c5c' }}>*</span></label>
                <input
                  ref={titleRef}
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ej: Diseño editorial para principiantes"
                  disabled={loading}
                />
              </div>

              <div className="editor-field">
                <label>Subtítulo <span className="file-meta">(opcional)</span></label>
                <input
                  value={subtitle}
                  onChange={(e) => setSubtitle(e.target.value)}
                  placeholder="Una descripción breve del curso"
                  disabled={loading}
                />
              </div>

              {error && <p className="modal-error">{error}</p>}

              <div className="modal-footer">
                <button type="button" className="admin-button ghost" onClick={() => setOpen(false)} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="admin-button" disabled={loading || !title.trim()}>
                  {loading ? 'Creando…' : 'Crear curso'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  )
}
