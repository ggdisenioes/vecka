import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import NewCourseButton from './NewCourseButton'
import './admin-courses.css'

export const dynamic = 'force-dynamic'

const STATUS_LABELS = { draft: 'Borrador', published: 'Publicado', archived: 'Archivado' }
const VIS_LABELS = { private: 'Privado', catalog: 'Catálogo', public: 'Público' }

export default async function AdminCoursesListPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/courses')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, slug, title, subtitle, status, visibility, updated_at, is_membership, cover_image_url, category')
    .order('updated_at', { ascending: false })

  if (error) {
    return (
      <main className="admin-shell">
        <div className="admin-container">
          <h1>Cursos</h1>
          <p style={{ color: '#b85c5c' }}>Error al cargar: {error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">← Panel de administración</Link>
            </div>
            <h1>Cursos</h1>
          </div>
          <NewCourseButton />
        </header>

        <div className="admin-grid">
          {(courses || []).map((course) => (
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

        {(!courses || courses.length === 0) && (
          <div className="empty-state" style={{ marginTop: 24 }}>
            Todavía no hay cursos. Hacé clic en <strong>+ Nuevo curso</strong> para crear el primero.
          </div>
        )}
      </div>
    </main>
  )
}
