import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import NewCourseButton from './NewCourseButton'
import './admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminCoursesListPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/courses')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, slug, title, status, visibility, updated_at, is_membership')
    .order('updated_at', { ascending: false })

  if (error) {
    return (
      <main className="admin-shell">
        <div className="admin-container">
          <h1>Editor de cursos</h1>
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
              <Link href="/admin">← Volver al panel</Link>
            </div>
            <h1>Editor de cursos</h1>
          </div>
          <NewCourseButton />
        </header>

        {(!courses || courses.length === 0) ? (
          <div className="empty-state">
            Todavía no hay cursos. Hacé clic en <strong>Nuevo curso</strong> para crear el primero.
          </div>
        ) : (
          <div className="admin-grid">
            {courses.map((course) => (
              <Link
                key={course.id}
                href={`/admin/courses/${course.id}`}
                className="course-card"
              >
                <div className="title">{course.title}</div>
                <div className="meta">
                  <span className={`status-pill ${course.status}`}>{course.status}</span>
                  <span className={`status-pill ${course.visibility}`}>{course.visibility}</span>
                  {course.is_membership ? <span className="status-pill catalog">membresía</span> : null}
                </div>
                <div className="meta">
                  Actualizado {course.updated_at ? new Date(course.updated_at).toLocaleDateString('es-AR') : '—'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
