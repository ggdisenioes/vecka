import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import QuizEditor from './QuizEditor'
import '../../../admin-courses.css'

export const dynamic = 'force-dynamic'

async function loadQuiz(quizId) {
  const supabase = getSupabaseAdmin()
  const { data: quiz, error: qError } = await supabase
    .from('course_quizzes')
    .select('*')
    .eq('id', quizId)
    .maybeSingle()
  if (qError) throw new Error(qError.message)
  if (!quiz) return null

  const { data: questions } = await supabase
    .from('quiz_questions')
    .select('*, answers:quiz_answers(*)')
    .eq('quiz_id', quizId)
    .order('sort_order')

  return { ...quiz, questions: questions || [] }
}

export default async function QuizEditorPage({ params }) {
  const { id, quizId } = await params
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login')
  if (!isStaff(profile)) redirect('/cuenta')

  const quiz = await loadQuiz(quizId)
  if (!quiz) notFound()

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href={`/admin/courses/${id}`}>← Volver al curso</Link>
            </div>
            <h1>Quiz: {quiz.title}</h1>
          </div>
        </header>
        <QuizEditor quiz={quiz} courseId={id} />
      </div>
    </main>
  )
}
