'use client'

import { useState } from 'react'
import { createCourseWithStructure } from '@/app/admin/actions'

function createLesson(index = 0) {
  return {
    key: `lesson-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    summary: '',
    body: '',
    status: index === 0 ? 'published' : 'draft',
    isPreview: index === 0,
    videoProvider: 'none',
    vimeoUrl: '',
    externalVideoUrl: '',
  }
}

function createModule(index = 0) {
  return {
    key: `module-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: '',
    description: '',
    videoProvider: 'none',
    vimeoUrl: '',
    externalVideoUrl: '',
    lessons: [createLesson(index)],
  }
}

export default function CourseStructureBuilder({ canUploadToVimeo }) {
  const [modules, setModules] = useState([createModule(0)])

  function updateModule(moduleKey, patch) {
    setModules((current) => current.map((module) => (
      module.key === moduleKey ? { ...module, ...patch } : module
    )))
  }

  function updateLesson(moduleKey, lessonKey, patch) {
    setModules((current) => current.map((module) => {
      if (module.key !== moduleKey) return module

      return {
        ...module,
        lessons: module.lessons.map((lesson) => (
          lesson.key === lessonKey ? { ...lesson, ...patch } : lesson
        )),
      }
    }))
  }

  function addModule() {
    setModules((current) => [...current, createModule(current.length)])
  }

  function removeModule(moduleKey) {
    setModules((current) => current.length === 1 ? current : current.filter((module) => module.key !== moduleKey))
  }

  function addLesson(moduleKey) {
    setModules((current) => current.map((module) => (
      module.key === moduleKey
        ? { ...module, lessons: [...module.lessons, createLesson(module.lessons.length)] }
        : module
    )))
  }

  function removeLesson(moduleKey, lessonKey) {
    setModules((current) => current.map((module) => {
      if (module.key !== moduleKey || module.lessons.length === 1) {
        return module
      }

      return {
        ...module,
        lessons: module.lessons.filter((lesson) => lesson.key !== lessonKey),
      }
    }))
  }

  return (
    <form action={createCourseWithStructure} className="editor" encType="multipart/form-data">
      <h3>Nuevo curso con estructura completa</h3>
      <div className="editor-grid">
        <div className="field">
          <label>Título</label>
          <input name="title" required />
        </div>
        <div className="field">
          <label>Subtítulo</label>
          <input name="subtitle" />
        </div>
        <div className="field">
          <label>Categoría</label>
          <input name="category" />
        </div>
        <div className="field">
          <label>Nivel</label>
          <input name="level" />
        </div>
        <div className="field">
          <label>Duración</label>
          <input name="duration_label" />
        </div>
        <div className="field">
          <label>Cover URL</label>
          <input name="cover_image_url" />
        </div>
        <div className="field">
          <label>ARS</label>
          <input min="0" name="price_ars" type="number" />
        </div>
        <div className="field">
          <label>USD</label>
          <input min="0" name="price_usd" step="0.01" type="number" />
        </div>
        <div className="field">
          <label>Status</label>
          <select defaultValue="draft" name="status">
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
        <div className="field">
          <label>Visibilidad</label>
          <select defaultValue="private" name="visibility">
            <option value="private">Private</option>
            <option value="public">Public</option>
            <option value="catalog">Catalog</option>
          </select>
        </div>
        <div className="field field-full">
          <label>Descripción</label>
          <textarea name="description" />
        </div>
      </div>

      <label className="attachment-item" style={{ justifyContent: 'flex-start', margin: '12px 0 18px' }}>
        <input name="is_membership" type="checkbox" />
        Curso membresía
      </label>

      <input name="modules_json" type="hidden" value={JSON.stringify(modules)} />

      <div className="stack" style={{ marginTop: 10 }}>
        {modules.map((module, moduleIndex) => (
          <div className="panel" key={module.key} style={{ padding: 18 }}>
            <div className="section-head" style={{ marginBottom: 16 }}>
              <div>
                <div className="eyebrow">Módulo {moduleIndex + 1}</div>
                <h4 className="section-title" style={{ fontSize: 24 }}>Contenido del módulo</h4>
              </div>
              <button className="btn btn-secondary" onClick={() => removeModule(module.key)} type="button">
                Eliminar módulo
              </button>
            </div>

            <div className="editor-grid">
              <div className="field">
                <label>Título del módulo</label>
                <input
                  onChange={(event) => updateModule(module.key, { title: event.target.value })}
                  required
                  value={module.title}
                />
              </div>
              <div className="field">
                <label>Video del módulo</label>
                <select
                  onChange={(event) => updateModule(module.key, { videoProvider: event.target.value })}
                  value={module.videoProvider}
                >
                  <option value="none">Sin video</option>
                  <option value="vimeo">Link de Vimeo</option>
                  <option value="external">Video externo</option>
                </select>
              </div>
              <div className="field field-full">
                <label>Descripción del módulo</label>
                <textarea
                  onChange={(event) => updateModule(module.key, { description: event.target.value })}
                  value={module.description}
                />
              </div>
              {module.videoProvider === 'vimeo' ? (
                <div className="field field-full">
                  <label>Link de Vimeo del módulo</label>
                  <input
                    onChange={(event) => updateModule(module.key, { vimeoUrl: event.target.value })}
                    placeholder="https://player.vimeo.com/video/..."
                    value={module.vimeoUrl}
                  />
                </div>
              ) : null}
              {module.videoProvider === 'external' ? (
                <div className="field field-full">
                  <label>Link externo del módulo</label>
                  <input
                    onChange={(event) => updateModule(module.key, { externalVideoUrl: event.target.value })}
                    placeholder="https://..."
                    value={module.externalVideoUrl}
                  />
                </div>
              ) : null}
              <div className="field field-full">
                <label>Subir video del módulo a Vimeo</label>
                <input accept="video/*" disabled={!canUploadToVimeo} name={`module_video_${module.key}`} type="file" />
                <div className="muted" style={{ marginTop: 6 }}>
                  {canUploadToVimeo
                    ? 'Si cargás un archivo, reemplaza el link manual del módulo.'
                    : 'La subida directa se habilita cuando exista VIMEO_ACCESS_TOKEN.'}
                </div>
              </div>
            </div>

            <div className="stack" style={{ marginTop: 18 }}>
              {module.lessons.map((lesson, lessonIndex) => (
                <div className="editor" key={lesson.key}>
                  <div className="section-head" style={{ marginBottom: 12 }}>
                    <div>
                      <div className="eyebrow">Clase {lessonIndex + 1}</div>
                      <h5 className="section-title" style={{ fontSize: 20 }}>Contenido de la clase</h5>
                    </div>
                    <button className="btn btn-secondary" onClick={() => removeLesson(module.key, lesson.key)} type="button">
                      Eliminar clase
                    </button>
                  </div>

                  <div className="editor-grid">
                    <div className="field">
                      <label>Título de la clase</label>
                      <input
                        onChange={(event) => updateLesson(module.key, lesson.key, { title: event.target.value })}
                        required
                        value={lesson.title}
                      />
                    </div>
                    <div className="field">
                      <label>Status</label>
                      <select
                        onChange={(event) => updateLesson(module.key, lesson.key, { status: event.target.value })}
                        value={lesson.status}
                      >
                        <option value="draft">Draft</option>
                        <option value="published">Published</option>
                        <option value="archived">Archived</option>
                      </select>
                    </div>
                    <div className="field field-full">
                      <label>Resumen</label>
                      <textarea
                        onChange={(event) => updateLesson(module.key, lesson.key, { summary: event.target.value })}
                        value={lesson.summary}
                      />
                    </div>
                    <div className="field field-full">
                      <label>Texto de la clase</label>
                      <textarea
                        onChange={(event) => updateLesson(module.key, lesson.key, { body: event.target.value })}
                        value={lesson.body}
                      />
                    </div>
                    <div className="field">
                      <label>Video de la clase</label>
                      <select
                        onChange={(event) => updateLesson(module.key, lesson.key, { videoProvider: event.target.value })}
                        value={lesson.videoProvider}
                      >
                        <option value="none">Sin video</option>
                        <option value="vimeo">Link de Vimeo</option>
                        <option value="external">Video externo</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Clase preview</label>
                      <select
                        onChange={(event) => updateLesson(module.key, lesson.key, { isPreview: event.target.value === 'true' })}
                        value={lesson.isPreview ? 'true' : 'false'}
                      >
                        <option value="false">No</option>
                        <option value="true">Sí</option>
                      </select>
                    </div>
                    {lesson.videoProvider === 'vimeo' ? (
                      <div className="field field-full">
                        <label>Link de Vimeo de la clase</label>
                        <input
                          onChange={(event) => updateLesson(module.key, lesson.key, { vimeoUrl: event.target.value })}
                          placeholder="https://player.vimeo.com/video/..."
                          value={lesson.vimeoUrl}
                        />
                      </div>
                    ) : null}
                    {lesson.videoProvider === 'external' ? (
                      <div className="field field-full">
                        <label>Link externo de la clase</label>
                        <input
                          onChange={(event) => updateLesson(module.key, lesson.key, { externalVideoUrl: event.target.value })}
                          placeholder="https://..."
                          value={lesson.externalVideoUrl}
                        />
                      </div>
                    ) : null}
                    <div className="field field-full">
                      <label>Subir video de la clase a Vimeo</label>
                      <input accept="video/*" disabled={!canUploadToVimeo} name={`lesson_video_${lesson.key}`} type="file" />
                    </div>
                    <div className="field field-full">
                      <label>Material PDF de la clase</label>
                      <input accept=".pdf,application/pdf" multiple name={`lesson_attachments_${lesson.key}`} type="file" />
                    </div>
                  </div>
                </div>
              ))}

              <button className="btn btn-secondary" onClick={() => addLesson(module.key)} type="button">
                Agregar clase
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="row-actions" style={{ marginTop: 20 }}>
        <button className="btn btn-secondary" onClick={addModule} type="button">
          Agregar módulo
        </button>
        <button className="btn btn-primary" type="submit">
          Crear curso completo
        </button>
      </div>
    </form>
  )
}
