import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import LessonEditor from './LessonEditor'
import '../../../admin-courses.css'

export const dynamic = 'force-dynamic'

async function loadLesson(lessonId) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('course_lessons')
    .select('*, materials:course_materials!course_materials_lesson_id_fkey(*)')
    .eq('id', lessonId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export default async function LessonEditorPage({ params }) {
  const { id, lessonId } = await params
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect(`/login`)
  if (!isStaff(profile)) redirect('/cuenta')

  const lesson = await loadLesson(lessonId)
  if (!lesson) notFound()

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href={`/admin/courses/${id}`}>← Volver al curso</Link>
            </div>
            <h1>Editar lección: {lesson.title}</h1>
          </div>
        </header>
        <section className="admin-card">
          <LessonEditor lesson={lesson} courseId={id} />
        </section>
      </div>
    </main>
  )
}
