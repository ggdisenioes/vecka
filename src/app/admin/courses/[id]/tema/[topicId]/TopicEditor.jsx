'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function toDatetimeLocal(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return ''
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

function normalizeTopic(t) {
  return {
    id: t.id,
    title: t.title || '',
    summary: t.summary || '',
    body: t.body || '',
    status: t.status || 'draft',
    isPreview: Boolean(t.is_preview),
    lessonType: t.lesson_type || 'video',
    liveSessionUrl: t.live_session_url || '',
    liveSessionAt: toDatetimeLocal(t.live_session_at),
    videoProvider: t.video_provider || 'none',
    vimeoUrl: t.vimeo_url || '',
    videoStoragePath: t.video_storage_path || '',
    videoBucket: t.video_bucket || 'course-videos',
    videoDurationSeconds: t.video_duration_seconds || '',
    materials: t.materials || [],
  }
}

function formatBytes(bytes) {
  const v = Number(bytes || 0)
  if (!v) return '0 B'
  if (v < 1024) return `${v} B`
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`
  return `${(v / 1048576).toFixed(1)} MB`
}

function MaterialsSection({ parentId, materials, setMaterials }) {
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)

  async function uploadFiles(files) {
    if (!files?.length) return
    setUploading(true)
    const added = []
    for (const file of Array.from(files)) {
      const form = new FormData()
      form.append('file', file)
      form.append('scope', 'topic')
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
    if (!window.confirm('¿Eliminar?')) return
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
              <div><div>{m.file_name}</div><div className="file-meta">{formatBytes(m.size_bytes)} · {m.mime_type}</div></div>
              <button type="button" className="admin-button danger" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => deleteMaterial(m.id)}>Eliminar</button>
            </li>
          ))}
        </ul>
      )}
      <label className={`drop-zone${dragOver ? ' drag-over' : ''}${uploading ? ' uploading' : ''}`}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); uploadFiles(e.dataTransfer.files) }}>
        <input type="file" multiple style={{ display: 'none' }} onChange={(e) => { uploadFiles(e.target.files); e.target.value = '' }} disabled={uploading} />
        {uploading ? <span className="file-meta">Subiendo…</span> : <span className="file-meta">Arrastrá archivos o <u>hacé clic para seleccionar</u></span>}
      </label>
    </div>
  )
}

export default function TopicEditor({ topic: initial, courseId }) {
  const router = useRouter()
  const [topic, setTopic] = useState(() => normalizeTopic(initial))
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function update(partial) { setTopic((prev) => ({ ...prev, ...partial })) }

  function flash(text, type = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 2800)
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/topics/${topic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: topic.title,
          summary: topic.summary,
          body: topic.body,
          status: topic.status,
          isPreview: topic.isPreview,
          lessonType: topic.lessonType,
          liveSessionUrl: topic.liveSessionUrl,
          liveSessionAt: topic.liveSessionAt || null,
          videoProvider: topic.videoProvider,
          vimeoUrl: topic.vimeoUrl,
          videoStoragePath: topic.videoStoragePath,
          videoBucket: topic.videoBucket,
          videoDurationSeconds: topic.videoDurationSeconds || null,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      flash('Tema guardado')
    } catch (e) {
      flash(e.message || 'Error', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="editor-section" style={{ gap: 20 }}>
      <div className="editor-row">
        <div className="editor-field">
          <label>Título</label>
          <input value={topic.title} onChange={(e) => update({ title: e.target.value })} />
        </div>
        <div className="editor-field">
          <label>Estado</label>
          <select value={topic.status} onChange={(e) => update({ status: e.target.value })}>
            <option value="draft">Borrador</option>
            <option value="published">Publicado</option>
            <option value="archived">Archivado</option>
          </select>
        </div>
        <div className="editor-field">
          <label>Tipo</label>
          <select value={topic.lessonType} onChange={(e) => update({ lessonType: e.target.value })}>
            <option value="video">Video</option>
            <option value="article">Artículo</option>
            <option value="live_session">Sesión en vivo</option>
            <option value="attachment">Solo descargas</option>
          </select>
        </div>
        <div className="editor-field">
          <label style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <input type="checkbox" checked={topic.isPreview} onChange={(e) => update({ isPreview: e.target.checked })} />
            Preview pública
          </label>
        </div>
      </div>

      {topic.lessonType === 'live_session' && (
        <div className="editor-row">
          <div className="editor-field">
            <label>Fecha y hora</label>
            <input type="datetime-local" value={topic.liveSessionAt} onChange={(e) => update({ liveSessionAt: e.target.value })} />
          </div>
          <div className="editor-field">
            <label>Link</label>
            <input type="url" value={topic.liveSessionUrl} onChange={(e) => update({ liveSessionUrl: e.target.value })} />
          </div>
        </div>
      )}

      <div className="editor-field">
        <label>Resumen</label>
        <input value={topic.summary} onChange={(e) => update({ summary: e.target.value })} />
      </div>

      <div className="editor-field">
        <label>Contenido</label>
        <textarea value={topic.body} onChange={(e) => update({ body: e.target.value })} style={{ minHeight: 120 }} />
      </div>

      {topic.lessonType === 'video' && (
        <div className="video-block">
          <div className="video-providers">
            <label><input type="radio" checked={topic.videoProvider === 'none'} onChange={() => update({ videoProvider: 'none' })} /> Sin video</label>
            <label><input type="radio" checked={topic.videoProvider === 'vimeo'} onChange={() => update({ videoProvider: 'vimeo' })} /> Vimeo</label>
          </div>
          {topic.videoProvider === 'vimeo' && (
            <div className="editor-field">
              <label>URL de Vimeo</label>
              <input type="url" value={topic.vimeoUrl} onChange={(e) => update({ vimeoUrl: e.target.value })} placeholder="https://vimeo.com/123456789" />
            </div>
          )}
        </div>
      )}

      <MaterialsSection parentId={topic.id} materials={topic.materials} setMaterials={(m) => update({ materials: m })} />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
        <button type="button" className="admin-button" onClick={save} disabled={saving}>{saving ? 'Guardando…' : 'Guardar tema'}</button>
        <button type="button" className="admin-button ghost" onClick={() => router.push(`/admin/courses/${courseId}`)}>← Volver al curso</button>
        {msg && <span style={{ fontSize: 13, color: msg.type === 'error' ? '#b85c5c' : 'var(--accent-deep)' }}>{msg.text}</span>}
      </div>
    </div>
  )
}
