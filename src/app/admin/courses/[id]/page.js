import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import CourseEditor from './CourseEditor'
import '../admin-courses.css'

export const dynamic = 'force-dynamic'

async function loadCourseTree(id) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('courses')
    .select(`
      *,
      materials:course_materials!course_materials_course_id_fkey(*),
      modules:course_modules(
        *,
        materials:course_materials!course_materials_module_id_fkey(*),
        lessons:course_lessons(
          *,
          materials:course_materials!course_materials_lesson_id_fkey(*)
        )
      )
    `)
    .eq('id', id)
    .maybeSingle()

  if (error) throw new Error(error.message)
  return data
}

export default async function AdminCourseEditPage({ params }) {
  const { id } = await params
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect(`/login?next=/admin/courses/${id}`)
  if (!isStaff(profile)) redirect('/cuenta')

  const course = await loadCourseTree(id)
  if (!course) notFound()

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">← Volver al panel</Link>
            </div>
            <h1>{course.title || 'Curso sin título'}</h1>
          </div>
          <Link className="admin-button ghost" href={`/courses/${course.slug}`} target="_blank">
            Ver en sitio público
          </Link>
        </header>

        <CourseEditor initialCourse={course} />
      </div>
    </main>
  )
}
