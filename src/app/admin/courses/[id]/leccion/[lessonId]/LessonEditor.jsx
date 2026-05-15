'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const STATUSES = ['draft', 'published', 'archived']
const VIDEO_PROVIDERS = ['none', 'vimeo', 'upload']
const LESSON_TYPES = ['video', 'article', 'live_session', 'attachment']

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function normalizeLesson(lesson) {
  return {
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title || '',
    summary: lesson.summary || '',
    body: lesson.body || '',
    status: lesson.status || 'draft',
    isPreview: Boolean(lesson.is_preview),
    lessonType: lesson.lesson_type || 'video',
    liveSessionUrl: lesson.live_session_url || '',
    liveSessionAt: toDatetimeLocal(lesson.live_session_at),
    videoProvider: lesson.video_provider || 'none',
    vimeoUrl: lesson.vimeo_url || '',
    videoStoragePath: lesson.video_storage_path || '',
    videoBucket: lesson.video_bucket || 'course-videos',
    videoDurationSeconds: lesson.video_duration_seconds || '',
    materials: lesson.materials || [],
  }
}

function formatBytes(bytes) {
  const v = Number(bytes || 0)
  if (!v) return '0 B'
  if (v < 1024) return `${v} B`
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / 1048576).toFixed(1)} MB`
}

function MaterialsSection({ scope, parentId, materials, setMaterials }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFiles(files) {
    if (!files?.length) return
    setUploading(true)
    const added = []
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      form.append('scope', scope)
      form.append('parentId', parentId)
      form.append('sortOrder', String(materials.length + added.length + 1))
      const res = await fetch('/api/admin/materials', { method: 'POST', body: form })
      const data = await res.json()
      if (res.ok) added.push(data.material)
    }
    setMaterials([...materials, ...added])
    setUploading(false)
  }

  async function deleteMaterial(id) {
    if (!window.confirm('¿Eliminar este archivo?')) return
    await fetch(`/api/admin/materials/${id}`, { method: 'DELETE' })
    setMaterials(materials.filter((m) => m.id !== id))
  }

  return (
    <div className="editor-section">
      <h4 style={{ margin: '0 0 10px', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>Materiales descargables</h4>
      {materials.length > 0 && (
        <ul className="materials-list">
          {materials.map((m) => (
            <li key={m.id}>
              <div>
                <div>{m.file_name}</div>
                <div className="file-meta">{formatBytes(m.size_bytes)} · {m.mime_type}</div>
              </div>
              <button type="button" className="admin-button danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => deleteMaterial(m.id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}
      <label
        className={`drop-zone${dragOver ? ' drag-over' : ''}${uploading ? ' uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}
      >
        <input type="file" multiple style={{ display: 'none' }} onChange={(e) => { uploadFiles(e.target.files); e.target.value = '' }} disabled={uploading} />
        {uploading ? <span className="file-meta">Subiendo…</span> : <span className="file-meta">Arrastrá archivos o <u>hacé clic para seleccionar</u></span>}
      </label>
    </div>
  )
}

export default function LessonEditor({ lesson: initial, courseId }) {
  const router = useRouter()
  const [lesson, setLesson] = useState(() => normalizeLesson(initial))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function update(partial) {
    setLesson((prev) => ({ ...prev, ...partial }))
  }

  function flash(text, type = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 2800)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lesson.title,
          summary: lesson.summary,
          body: lesson.body,
          status: lesson.status,
          isPreview: lesson.isPreview,
          lessonType: lesson.lessonType,
          liveSessionUrl: lesson.liveSessionUrl,
          liveSessionAt: lesson.liveSessionAt || null,
          videoProvider: lesson.videoProvider,
          vimeoUrl: lesson.vimeoUrl,
          videoStoragePath: lesson.videoStoragePath,
          videoBucket: lesson.videoBucket,
          videoDurationSeconds: lesson.videoDurationSeconds || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      flash('Lección guardada')
    } catch (e) {
      flash(e.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="editor-section" style={{ gap: 20 }}>
      <div className="editor-row">
        <div className="editor-field">
          <label>Título</label>
          <input value={lesson.title} onChange={(e) => update({ title: e.target.value })} />
        </div>
        <div className="editor-field">
          <label>Estado</label>
          <select value={lesson.status} onChange={(e) => update({ status: e.target.value })}>
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="archived">Archivada</option>
          </select>
        </div>
        <div className="editor-field">
          <label>Tipo de lección</label>
          <select value={lesson.lessonType} onChange={(e) => update({ lessonType: e.target.value })}>
            <option value="video">Video</option>
            <option value="article">Artículo / texto</option>
            <option value="live_session">Sesión en vivo</option>
            <option value="attachment">Solo descargas</option>
          </select>
        </div>
        <div className="editor-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={lesson.isPreview} onChange={(e) => update({ isPreview: e.target.checked })} />
            Preview pública
          </label>
        </div>
      </div>

      {lesson.lessonType === 'live_session' && (
        <div className="editor-row">
          <div className="editor-field">
            <label>Fecha y hora</label>
            <input type="datetime-local" value={lesson.liveSessionAt} onChange={(e) => update({ liveSessionAt: e.target.value })} />
          </div>
          <div className="editor-field">
            <label>Link (Zoom / Meet)</label>
            <input type="url" value={lesson.liveSessionUrl} onChange={(e) => update({ liveSessionUrl: e.target.value })} placeholder="https://" />
          </div>
        </div>
      )}

      <div className="editor-field">
        <label>Resumen</label>
        <input value={lesson.summary} onChange={(e) => update({ summary: e.target.value })} />
      </div>

      <div className="editor-field">
        <label>Contenido / descripción</label>
        <textarea value={lesson.body} onChange={(e) => update({ body: e.target.value })} style={{ minHeight: 120 }} />
      </div>

      {(lesson.lessonType === 'video' || lesson.lessonType === 'article') && (
        <div className="video-block">
          <div className="video-providers">
            <label><input type="radio" checked={lesson.videoProvider === 'none'} onChange={() => update({ videoProvider: 'none' })} /> Sin video</label>
            <label><input type="radio" checked={lesson.videoProvider === 'vimeo'} onChange={() => update({ videoProvider: 'vimeo' })} /> Vimeo</label>
          </div>
          {lesson.videoProvider === 'vimeo' && (
            <div className="editor-field">
              <label>URL de Vimeo</label>
              <input type="url" value={lesson.vimeoUrl} onChange={(e) => update({ vimeoUrl: e.target.value })} placeholder="https://vimeo.com/123456789" />
            </div>
          )}
        </div>
      )}

      <MaterialsSection
        scope="lesson"
        parentId={lesson.id}
        materials={lesson.materials}
        setMaterials={(m) => update({ materials: m })}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" className="admin-button" onClick={save} disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar lección'}
        </button>
        <button type="button" className="admin-button ghost" onClick={() => router.push(`/admin/courses/${courseId}`)}>
          ← Volver al curso
        </button>
        {msg && (
          <span className={`file-meta${msg.type === 'error' ? ' error' : ''}`} style={{ color: msg.type === 'error' ? '#b85c5c' : 'var(--accent-deep)' }}>
            {msg.text}
          </span>
        )}
      </div>
    </div>
  )
}
