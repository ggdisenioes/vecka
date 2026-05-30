'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const STATUS_LABELS = { draft: 'Borrador', published: 'Publicado', archived: 'Archivado' }
const VIS_LABELS = { private: 'Privado', catalog: 'Catálogo', public: 'Público' }

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borradores' },
  { value: 'published', label: 'Publicados' },
  { value: 'archived', label: 'Archivados' },
]

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export default function CoursesListClient({ courses }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return (courses || []).filter((course) => {
      if (statusFilter !== 'all' && course.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${normalize(course.title)} ${normalize(course.subtitle)} ${normalize(course.category)} ${normalize(course.slug)}`
      return haystack.includes(q)
    })
  }, [courses, query, statusFilter])

  const hasResults = filtered.length > 0
  const hasCourses = (courses || []).length > 0

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Buscar por título, categoría o slug…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {(query || statusFilter !== 'all') && (
          <button
            type="button"
            className="admin-button ghost"
            onClick={() => { setQuery(''); setStatusFilter('all') }}
          >
            Limpiar
          </button>
        )}
        <span className="admin-toolbar-count">
          {filtered.length} de {courses?.length || 0}
        </span>
      </div>

      <div className="admin-grid">
        {filtered.map((course) => (
          <Link key={course.id} href={`/admin/courses/${course.id}`} className="course-card">
            {course.cover_image_url && (
              <div style={{
                width: '100%',
                height: 120,
                borderRadius: 10,
                overflow: 'hidden',
                background: '#f0e5dc',
                marginBottom: 4,
              }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={course.cover_image_url}
                  alt={course.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
              </div>
            )}
            <div className="title">{course.title || 'Sin título'}</div>
            {course.subtitle && <div className="subtitle">{course.subtitle}</div>}
            <div className="meta">
              <span className={`status-pill ${course.status}`}>{STATUS_LABELS[course.status] || course.status}</span>
              <span className={`status-pill ${course.visibility}`}>{VIS_LABELS[course.visibility] || course.visibility}</span>
              {course.is_membership && <span className="status-pill catalog">Membresía</span>}
              {course.category && <span className="status-pill" style={{ background: '#f0e5dc', color: '#6f5b4d' }}>{course.category}</span>}
            </div>
            <div className="card-footer">
              Editado {course.updated_at ? new Date(course.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </Link>
        ))}
      </div>

      {!hasCourses && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          Todavía no hay cursos. Hacé clic en <strong>+ Nuevo curso</strong> para crear el primero.
        </div>
      )}

      {hasCourses && !hasResults && (
        <div className="empty-state" style={{ marginTop: 24 }}>
          No hay cursos que coincidan con tu búsqueda.
        </div>
      )}
    </>
  )
}
