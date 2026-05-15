import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import TopicEditor from './TopicEditor'
import '../../../admin-courses.css'

export const dynamic = 'force-dynamic'

async function loadTopic(topicId) {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('course_topics')
    .select('*, materials:course_materials!course_materials_topic_id_fkey(*)')
    .eq('id', topicId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data
}

export default async function TopicEditorPage({ params }) {
  const { id, topicId } = await params
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login')
  if (!isStaff(profile)) redirect('/cuenta')

  const topic = await loadTopic(topicId)
  if (!topic) notFound()

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href={`/admin/courses/${id}`}>← Volver al curso</Link>
            </div>
            <h1>Editar tema: {topic.title}</h1>
          </div>
        </header>
        <section className="admin-card">
          <TopicEditor topic={topic} courseId={id} />
        </section>
      </div>
    </main>
  )
}
