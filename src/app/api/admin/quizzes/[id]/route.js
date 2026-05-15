import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, requireText, revalidateCourses, toInteger, uniqueQuizSlug } from '@/lib/admin-api'

export async function GET(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: quiz, error: quizError } = await supabase
      .from('course_quizzes')
      .select('*')
      .eq('id', id)
      .maybeSingle()

    if (quizError) throw quizError
    if (!quiz) return jsonError('Quiz not found', 404)

    const { data: questions, error: qError } = await supabase
      .from('quiz_questions')
      .select('*, answers:quiz_answers(*)' )
      .eq('quiz_id', id)
      .order('sort_order')

    if (qError) throw qError

    return NextResponse.json({ quiz: { ...quiz, questions: questions || [] } })
  } catch (error) {
    return jsonError(error.message || 'Could not load quiz')
  }
}

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const title = requireText(payload.title, 'Quiz title')
    const supabase = getSupabaseAdmin()

    const { data: current } = await supabase
      .from('course_quizzes')
      .select('course_id')
      .eq('id', id)
      .maybeSingle()

    if (!current) throw new Error('Quiz not found')

    const slug = await uniqueQuizSlug(current.course_id, title, id)
    const status = ['draft', 'published'].includes(payload.status) ? payload.status : 'draft'

    const { data, error } = await supabase
      .from('course_quizzes')
      .update({
        slug,
        title,
        description: String(payload.description || '').trim() || null,
        pass_percentage: toInteger(payload.passPercentage, 80),
        time_limit_minutes: payload.timeLimitMinutes ? toInteger(payload.timeLimitMinutes, null) : null,
        show_correct_answers: payload.showCorrectAnswers !== false,
        randomize_questions: Boolean(payload.randomizeQuestions),
        status,
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ quiz: data })
  } catch (error) {
    return jsonError(error.message || 'Could not update quiz')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('course_quizzes').delete().eq('id', id)
    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete quiz')
  }
}
