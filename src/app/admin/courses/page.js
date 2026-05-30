import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import NewCourseButton from './NewCourseButton'
import CoursesListClient from './CoursesListClient'
import './admin-courses.css'

export const dynamic = 'force-dynamic'

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

        <CoursesListClient courses={courses || []} />
      </div>
    </main>
  )
}
