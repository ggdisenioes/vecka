import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, requireText, revalidateCourses } from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const quizId = requireText(payload.quizId, 'Quiz id')
    const supabase = getSupabaseAdmin()

    const { data: existing } = await supabase
      .from('quiz_questions')
      .select('id')
      .eq('quiz_id', quizId)

    const { data: question, error: qError } = await supabase
      .from('quiz_questions')
      .insert({
        quiz_id: quizId,
        question_text: String(payload.questionText || '').trim(),
        question_type: 'multiple_choice',
        points: 1,
        sort_order: (existing?.length || 0) * 100,
      })
      .select('*')
      .single()

    if (qError) throw qError

    const { data: answers, error: aError } = await supabase
      .from('quiz_answers')
      .insert([
        { question_id: question.id, answer_text: '', is_correct: false, sort_order: 0 },
        { question_id: question.id, answer_text: '', is_correct: false, sort_order: 100 },
        { question_id: question.id, answer_text: '', is_correct: false, sort_order: 200 },
        { question_id: question.id, answer_text: '', is_correct: false, sort_order: 300 },
      ])
      .select('*')

    if (aError) throw aError

    revalidateCourses()
    return NextResponse.json({ question: { ...question, answers: answers || [] } })
  } catch (error) {
    return jsonError(error.message || 'Could not create question')
  }
}
