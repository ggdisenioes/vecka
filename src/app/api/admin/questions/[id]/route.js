import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, toInteger } from '@/lib/admin-api'

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const supabase = getSupabaseAdmin()

    const { error: qError } = await supabase
      .from('quiz_questions')
      .update({
        question_text: String(payload.questionText || '').trim(),
        points: toInteger(payload.points, 1),
      })
      .eq('id', id)

    if (qError) throw qError

    const incomingAnswers = Array.isArray(payload.answers) ? payload.answers : []
    const incomingIds = incomingAnswers.filter((a) => a.id).map((a) => a.id)

    if (incomingIds.length > 0) {
      await supabase.from('quiz_answers').delete().eq('question_id', id).not('id', 'in', `(${incomingIds.join(',')})`)
    } else {
      await supabase.from('quiz_answers').delete().eq('question_id', id)
    }

    for (const answer of incomingAnswers) {
      if (answer.id) {
        await supabase
          .from('quiz_answers')
          .update({
            answer_text: String(answer.answerText || '').trim(),
            is_correct: Boolean(answer.isCorrect),
            sort_order: toInteger(answer.sortOrder, 0),
          })
          .eq('id', answer.id)
      } else {
        await supabase.from('quiz_answers').insert({
          question_id: id,
          answer_text: String(answer.answerText || '').trim(),
          is_correct: Boolean(answer.isCorrect),
          sort_order: toInteger(answer.sortOrder, 0),
        })
      }
    }

    const { data: question, error: loadError } = await supabase
      .from('quiz_questions')
      .select('*, answers:quiz_answers(*)')
      .eq('id', id)
      .maybeSingle()

    if (loadError) throw loadError
    return NextResponse.json({ question })
  } catch (error) {
    return jsonError(error.message || 'Could not update question')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('quiz_questions').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete question')
  }
}
