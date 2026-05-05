'use client'

import { useCallback, useState } from 'react'
import { useRouter } from 'next/navigation'

function normalizeMaterials(list = []) {
  return list
    .slice()
    .sort((a, b) => Number(a?.sort_order || 0) - Number(b?.sort_order || 0))
}

function normalizeVideo(record = {}) {
  return {
    videoProvider: record.video_provider || 'none',
    vimeoUrl: record.vimeo_url || '',
    externalVideoUrl: record.external_video_url || '',
    videoStoragePath: record.video_storage_path || '',
    videoBucket: record.video_bucket || 'course-videos',
    videoDurationSeconds: Number(record.video_duration_seconds || 0) || '',
  }
}

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
    position: lesson.position || 1,
    lessonType: lesson.lesson_type || 'video',
    liveSessionUrl: lesson.live_session_url || '',
    liveSessionAt: toDatetimeLocal(lesson.live_session_at),
    ...normalizeVideo(lesson),
    materials: normalizeMaterials(lesson.materials || []),
  }
}

function normalizeModule(module) {
  return {
    id: module.id,
    title: module.title || '',
    description: module.description || '',
    position: module.position || 1,
    ...normalizeVideo(module),
    materials: normalizeMaterials(module.materials || []),
    lessons: (module.lessons || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0)).map(normalizeLesson),
  }
}

function normalizeCourse(course) {
  return {
    id: course.id,
    slug: course.slug,
    title: course.title || '',
    subtitle: course.subtitle || '',
    description: course.description || '',
    category: course.category || '',
    level: course.level || '',
    duration: course.duration_label || '',
    coverImageUrl: course.cover_image_url || '',
    price: course.price_ars ?? 0,
    priceUSD: course.price_usd ?? 0,
    isMembership: Boolean(course.is_membership),
    status: course.status || 'draft',
    visibility: course.visibility || 'private',
    materials: normalizeMaterials(course.materials || []),
    modules: (course.modules || []).slice().sort((a, b) => (a.position || 0) - (b.position || 0)).map(normalizeModule),
  }
}

function useToast() {
  const [toast, setToast] = useState(null)
  const show = useCallback((msg, type = 'info') => {
    setToast({ msg, type, key: Date.now() })
    setTimeout(() => setToast((current) => (current && current.msg === msg ? null : current)), 2800)
  }, [])
  return { toast, show }
}

function formatBytes(bytes) {
  const value = Number(bytes || 0)
  if (!value) return '0 B'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

function MaterialsManager({ scope, parentId, materials, onChange, toast }) {
  const [uploading, setUploading] = useState(false)

  async function handleUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('scope', scope)
      formData.append('parentId', parentId)
      formData.append('sortOrder', String(materials.length + 1))
      const response = await fetch('/api/admin/materials', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Error al subir')
      onChange([...materials, data.material])
      toast.show('Material subido')
    } catch (error) {
      toast.show(error.message || 'Error al subir', 'error')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  async function handleDelete(materialId) {
    if (!window.confirm('¿Eliminar este archivo?')) return
    try {
      const response = await fetch(`/api/admin/materials/${materialId}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al eliminar')
      }
      onChange(materials.filter((material) => material.id !== materialId))
      toast.show('Material eliminado')
    } catch (error) {
      toast.show(error.message || 'Error al eliminar', 'error')
    }
  }

  return (
    <div className="editor-section">
      <div className="section-heading">
        <h4>Materiales descargables</h4>
      </div>
      {materials.length === 0 ? (
        <div className="empty-state" style={{ padding: 12 }}>Sin materiales todavía</div>
      ) : (
        <ul className="materials-list">
          {materials.map((material) => (
            <li key={material.id}>
              <div>
                <div>{material.file_name}</div>
                <div className="file-meta">{formatBytes(material.size_bytes)} · {material.mime_type}</div>
              </div>
              <button type="button" className="admin-button danger" onClick={() => handleDelete(material.id)}>
                Eliminar
              </button>
            </li>
          ))}
        </ul>
      )}
      <div className="upload-row">
        <input type="file" onChange={handleUpload} disabled={uploading} />
        {uploading ? <span className="file-meta">Subiendo…</span> : null}
      </div>
    </div>
  )
}

function VideoBlock({ scope, parentId, value, onChange, toast }) {
  const [uploading, setUploading] = useState(false)

  function setProvider(provider) {
    onChange({ ...value, videoProvider: provider })
  }

  async function handleVideoUpload(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const signResponse = await fetch('/api/admin/videos/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope, parentId, fileName: file.name }),
      })
      const signData = await signResponse.json()
      if (!signResponse.ok) throw new Error(signData?.error || 'No se pudo firmar la subida')

      const uploadResponse = await fetch(signData.signedUrl, {
        method: 'PUT',
        body: file,
        headers: { 'Content-Type': file.type || 'application/octet-stream' },
      })
      if (!uploadResponse.ok) throw new Error('La subida del video falló')

      onChange({
        ...value,
        videoProvider: 'upload',
        videoStoragePath: signData.storagePath,
        videoBucket: signData.bucket,
      })
      toast.show('Video subido. Recordá guardar para confirmar.')
    } catch (error) {
      toast.show(error.message || 'Error al subir video', 'error')
    } finally {
      setUploading(false)
      event.target.value = ''
    }
  }

  return (
    <div className="video-block">
      <div className="video-providers">
        <label>
          <input
            type="radio"
            checked={value.videoProvider === 'none'}
            onChange={() => setProvider('none')}
          />
          Sin video
        </label>
        <label>
          <input
            type="radio"
            checked={value.videoProvider === 'vimeo'}
            onChange={() => setProvider('vimeo')}
          />
          Vimeo
        </label>
        <label>
          <input
            type="radio"
            checked={value.videoProvider === 'upload'}
            onChange={() => setProvider('upload')}
          />
          Subir archivo
        </label>
      </div>

      {value.videoProvider === 'vimeo' ? (
        <div className="editor-field">
          <label>URL de Vimeo</label>
          <input
            type="url"
            placeholder="https://vimeo.com/123456789"
            value={value.vimeoUrl || ''}
            onChange={(event) => onChange({ ...value, vimeoUrl: event.target.value })}
          />
        </div>
      ) : null}

      {value.videoProvider === 'upload' ? (
        <div className="editor-section">
          {value.videoStoragePath ? (
            <div className="file-meta">Archivo actual: {value.videoStoragePath.split('/').pop()}</div>
          ) : (
            <div className="file-meta">Sin archivo todavía</div>
          )}
          <div className="upload-row">
            <input type="file" accept="video/*" onChange={handleVideoUpload} disabled={uploading} />
            {uploading ? <span className="file-meta">Subiendo…</span> : null}
          </div>
        </div>
      ) : null}
    </div>
  )
}

function buildVideoPayload(value) {
  return {
    videoProvider: value.videoProvider,
    vimeoUrl: value.vimeoUrl,
    externalVideoUrl: value.externalVideoUrl,
    videoStoragePath: value.videoStoragePath,
    videoBucket: value.videoBucket,
    videoDurationSeconds: value.videoDurationSeconds || null,
  }
}

function LessonCard({ lesson, onChange, onDelete, toast }) {
  const [saving, setSaving] = useState(false)

  function update(partial) {
    onChange({ ...lesson, ...partial })
  }

  async function save() {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: lesson.title,
          summary: lesson.summary,
          body: lesson.body,
          position: lesson.position,
          status: lesson.status,
          isPreview: lesson.isPreview,
          lessonType: lesson.lessonType || 'video',
          liveSessionUrl: lesson.liveSessionUrl || '',
          liveSessionAt: lesson.liveSessionAt || null,
          ...buildVideoPayload(lesson),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Error al guardar')
      toast.show(`Clase "${lesson.title}" guardada`)
    } catch (error) {
      toast.show(error.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('¿Eliminar esta clase y todos sus materiales?')) return
    try {
      const response = await fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al eliminar')
      }
      onDelete(lesson.id)
      toast.show('Clase eliminada')
    } catch (error) {
      toast.show(error.message || 'Error al eliminar', 'error')
    }
  }

  return (
    <div className="lesson-card">
      <div className="lesson-header">
        <div className="lesson-title">{lesson.title || 'Clase sin título'}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="admin-button" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar clase'}
          </button>
          <button type="button" className="admin-button danger" onClick={remove}>Eliminar clase</button>
        </div>
      </div>

      <div className="editor-row">
        <div className="editor-field">
          <label>Título</label>
          <input value={lesson.title} onChange={(event) => update({ title: event.target.value })} />
        </div>
        <div className="editor-field">
          <label>Posición</label>
          <input
            type="number"
            min={1}
            value={lesson.position}
            onChange={(event) => update({ position: Number(event.target.value) || 1 })}
          />
        </div>
        <div className="editor-field">
          <label>Estado</label>
          <select value={lesson.status} onChange={(event) => update({ status: event.target.value })}>
            <option value="draft">Borrador</option>
            <option value="published">Publicada</option>
            <option value="archived">Archivada</option>
          </select>
        </div>
        <div className="editor-field">
          <label>Tipo de clase</label>
          <select value={lesson.lessonType} onChange={(event) => update({ lessonType: event.target.value })}>
            <option value="video">Video</option>
            <option value="article">Artículo / texto</option>
            <option value="live_session">Sesión en vivo</option>
            <option value="attachment">Solo descargas</option>
          </select>
        </div>
        <div className="editor-field">
          <label>
            <input
              type="checkbox"
              checked={lesson.isPreview}
              onChange={(event) => update({ isPreview: event.target.checked })}
            />{' '}
            Clase de muestra (preview pública)
          </label>
        </div>
      </div>

      {lesson.lessonType === 'live_session' ? (
        <div className="editor-row">
          <div className="editor-field">
            <label>Fecha y hora de la sesión</label>
            <input
              type="datetime-local"
              value={lesson.liveSessionAt}
              onChange={(event) => update({ liveSessionAt: event.target.value })}
            />
          </div>
          <div className="editor-field">
            <label>Link de la sesión (Zoom / Meet / etc.)</label>
            <input
              type="url"
              placeholder="https://"
              value={lesson.liveSessionUrl}
              onChange={(event) => update({ liveSessionUrl: event.target.value })}
            />
          </div>
        </div>
      ) : null}

      <div className="editor-field">
        <label>Resumen</label>
        <input value={lesson.summary} onChange={(event) => update({ summary: event.target.value })} />
      </div>

      <div className="editor-field">
        <label>Contenido / descripción</label>
        <textarea value={lesson.body} onChange={(event) => update({ body: event.target.value })} />
      </div>

      <div className="editor-field">
        <label>Video</label>
        <VideoBlock
          scope="lesson"
          parentId={lesson.id}
          value={lesson}
          onChange={(next) => update(next)}
          toast={toast}
        />
      </div>

      <MaterialsManager
        scope="lesson"
        parentId={lesson.id}
        materials={lesson.materials}
        onChange={(materials) => update({ materials })}
        toast={toast}
      />
    </div>
  )
}

function ModuleCard({ module, onChange, onDelete, toast }) {
  const [saving, setSaving] = useState(false)
  const [adding, setAdding] = useState(false)

  function update(partial) {
    onChange({ ...module, ...partial })
  }

  async function save() {
    setSaving(true)
    try {
      const response = await fetch(`/api/admin/modules/${module.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: module.title,
          description: module.description,
          position: module.position,
          ...buildVideoPayload(module),
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Error al guardar')
      toast.show(`Módulo "${module.title}" guardado`)
    } catch (error) {
      toast.show(error.message || 'Error al guardar', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('¿Eliminar este módulo y todas sus clases?')) return
    try {
      const response = await fetch(`/api/admin/modules/${module.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al eliminar')
      }
      onDelete(module.id)
      toast.show('Módulo eliminado')
    } catch (error) {
      toast.show(error.message || 'Error al eliminar', 'error')
    }
  }

  async function addLesson() {
    setAdding(true)
    try {
      const response = await fetch('/api/admin/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ moduleId: module.id, title: 'Nueva clase' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Error al crear la clase')
      const newLesson = normalizeLesson(data.lesson)
      update({ lessons: [...module.lessons, newLesson] })
      toast.show('Clase creada')
    } catch (error) {
      toast.show(error.message || 'Error al crear la clase', 'error')
    } finally {
      setAdding(false)
    }
  }

  function updateLesson(lessonId, next) {
    update({
      lessons: module.lessons.map((lesson) => (lesson.id === lessonId ? next : lesson)),
    })
  }

  function removeLesson(lessonId) {
    update({ lessons: module.lessons.filter((lesson) => lesson.id !== lessonId) })
  }

  return (
    <div className="module-card">
      <div className="module-header">
        <div className="module-title">{module.title || 'Módulo sin título'}</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" className="admin-button" onClick={save} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar módulo'}
          </button>
          <button type="button" className="admin-button danger" onClick={remove}>Eliminar módulo</button>
        </div>
      </div>

      <div className="editor-row">
        <div className="editor-field">
          <label>Título</label>
          <input value={module.title} onChange={(event) => update({ title: event.target.value })} />
        </div>
        <div className="editor-field">
          <label>Posición</label>
          <input
            type="number"
            min={1}
            value={module.position}
            onChange={(event) => update({ position: Number(event.target.value) || 1 })}
          />
        </div>
      </div>

      <div className="editor-field">
        <label>Descripción</label>
        <textarea value={module.description} onChange={(event) => update({ description: event.target.value })} />
      </div>

      <div className="editor-field">
        <label>Video del módulo (opcional)</label>
        <VideoBlock
          scope="module"
          parentId={module.id}
          value={module}
          onChange={(next) => update(next)}
          toast={toast}
        />
      </div>

      <MaterialsManager
        scope="module"
        parentId={module.id}
        materials={module.materials}
        onChange={(materials) => update({ materials })}
        toast={toast}
      />

      <div className="section-heading" style={{ marginTop: 18 }}>
        <h4>Clases</h4>
        <button type="button" className="admin-button subtle" onClick={addLesson} disabled={adding}>
          {adding ? 'Creando…' : '+ Añadir clase'}
        </button>
      </div>

      {module.lessons.length === 0 ? (
        <div className="empty-state" style={{ padding: 12 }}>Aún no hay clases en este módulo.</div>
      ) : (
        module.lessons.map((lesson) => (
          <LessonCard
            key={lesson.id}
            lesson={lesson}
            onChange={(next) => updateLesson(lesson.id, next)}
            onDelete={removeLesson}
            toast={toast}
          />
        ))
      )}
    </div>
  )
}

export default function CourseEditor({ initialCourse }) {
  const router = useRouter()
  const [course, setCourse] = useState(() => normalizeCourse(initialCourse))
  const [savingCourse, setSavingCourse] = useState(false)
  const [addingModule, setAddingModule] = useState(false)
  const toast = useToast()

  function updateCourse(partial) {
    setCourse((current) => ({ ...current, ...partial }))
  }

  async function saveCourse() {
    setSavingCourse(true)
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: course.title,
          subtitle: course.subtitle,
          description: course.description,
          category: course.category,
          level: course.level,
          duration: course.duration,
          coverImageUrl: course.coverImageUrl,
          price: course.price,
          priceUSD: course.priceUSD,
          isMembership: course.isMembership,
          status: course.status,
          visibility: course.visibility,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Error al guardar')
      toast.show('Curso guardado')
      router.refresh()
    } catch (error) {
      toast.show(error.message || 'Error al guardar', 'error')
    } finally {
      setSavingCourse(false)
    }
  }

  async function deleteCourse() {
    if (!window.confirm('¿Eliminar el curso completo? Esta acción no se puede deshacer.')) return
    try {
      const response = await fetch(`/api/admin/courses/${course.id}`, { method: 'DELETE' })
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al eliminar')
      }
      router.push('/admin/courses')
    } catch (error) {
      toast.show(error.message || 'Error al eliminar', 'error')
    }
  }

  async function addModule() {
    setAddingModule(true)
    try {
      const response = await fetch('/api/admin/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: course.id, title: 'Nuevo módulo' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'Error al crear el módulo')
      const newModule = normalizeModule(data.module)
      updateCourse({ modules: [...course.modules, newModule] })
      toast.show('Módulo creado')
    } catch (error) {
      toast.show(error.message || 'Error al crear el módulo', 'error')
    } finally {
      setAddingModule(false)
    }
  }

  function updateModule(moduleId, next) {
    updateCourse({
      modules: course.modules.map((module) => (module.id === moduleId ? next : module)),
    })
  }

  function removeModule(moduleId) {
    updateCourse({ modules: course.modules.filter((module) => module.id !== moduleId) })
  }

  return (
    <>
      <section className="admin-card editor-section">
        <div className="section-heading">
          <h2>Datos del curso</h2>
          <div style={{ display: 'flex', gap: 8 }}>
            <button type="button" className="admin-button" onClick={saveCourse} disabled={savingCourse}>
              {savingCourse ? 'Guardando…' : 'Guardar curso'}
            </button>
            <button type="button" className="admin-button danger" onClick={deleteCourse}>Eliminar curso</button>
          </div>
        </div>

        <div className="editor-row">
          <div className="editor-field">
            <label>Título</label>
            <input value={course.title} onChange={(event) => updateCourse({ title: event.target.value })} />
          </div>
          <div className="editor-field">
            <label>Subtítulo</label>
            <input value={course.subtitle} onChange={(event) => updateCourse({ subtitle: event.target.value })} />
          </div>
          <div className="editor-field">
            <label>Categoría</label>
            <input value={course.category} onChange={(event) => updateCourse({ category: event.target.value })} />
          </div>
          <div className="editor-field">
            <label>Nivel</label>
            <input value={course.level} onChange={(event) => updateCourse({ level: event.target.value })} />
          </div>
          <div className="editor-field">
            <label>Duración</label>
            <input value={course.duration} onChange={(event) => updateCourse({ duration: event.target.value })} />
          </div>
          <div className="editor-field">
            <label>Imagen de portada (URL)</label>
            <input value={course.coverImageUrl} onChange={(event) => updateCourse({ coverImageUrl: event.target.value })} />
          </div>
          <div className="editor-field">
            <label>Precio (ARS)</label>
            <input type="number" min={0} value={course.price} onChange={(event) => updateCourse({ price: Number(event.target.value) || 0 })} />
          </div>
          <div className="editor-field">
            <label>Precio (USD)</label>
            <input type="number" min={0} step="0.01" value={course.priceUSD} onChange={(event) => updateCourse({ priceUSD: Number(event.target.value) || 0 })} />
          </div>
          <div className="editor-field">
            <label>Estado</label>
            <select value={course.status} onChange={(event) => updateCourse({ status: event.target.value })}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="archived">Archivado</option>
            </select>
          </div>
          <div className="editor-field">
            <label>Visibilidad</label>
            <select value={course.visibility} onChange={(event) => updateCourse({ visibility: event.target.value })}>
              <option value="private">Privado</option>
              <option value="catalog">Catálogo</option>
              <option value="public">Público</option>
            </select>
          </div>
          <div className="editor-field">
            <label>
              <input
                type="checkbox"
                checked={course.isMembership}
                onChange={(event) => updateCourse({ isMembership: event.target.checked })}
              />{' '}
              Incluido en membresía
            </label>
          </div>
        </div>

        <div className="editor-field">
          <label>Descripción</label>
          <textarea value={course.description} onChange={(event) => updateCourse({ description: event.target.value })} />
        </div>
      </section>

      <section className="admin-card">
        <div className="section-heading">
          <h2>Materiales del curso</h2>
        </div>
        <p className="file-meta" style={{ marginTop: 0 }}>
          Estos archivos están disponibles para todo el curso (programa general, recursos compartidos).
        </p>
        <MaterialsManager
          scope="course"
          parentId={course.id}
          materials={course.materials}
          onChange={(materials) => updateCourse({ materials })}
          toast={toast}
        />
      </section>

      <section className="admin-card">
        <div className="section-heading">
          <h2>Módulos y clases</h2>
          <button type="button" className="admin-button" onClick={addModule} disabled={addingModule}>
            {addingModule ? 'Creando…' : '+ Añadir módulo'}
          </button>
        </div>

        {course.modules.length === 0 ? (
          <div className="empty-state">Aún no hay módulos. Hacé clic en <strong>Añadir módulo</strong> para empezar.</div>
        ) : (
          course.modules.map((module) => (
            <ModuleCard
              key={module.id}
              module={module}
              onChange={(next) => updateModule(module.id, next)}
              onDelete={removeModule}
              toast={toast}
            />
          ))
        )}
      </section>

      {toast.toast ? (
        <div className={`toast ${toast.toast.type === 'error' ? 'error' : ''}`} key={toast.toast.key}>
          {toast.toast.msg}
        </div>
      ) : null}
    </>
  )
}
