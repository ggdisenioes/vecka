import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, requireText, revalidateCourses, uniqueQuizSlug } from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const courseId = requireText(payload.courseId, 'Course id')
    const title = String(payload.title || 'Nuevo quiz').trim() || 'Nuevo quiz'
    const supabase = getSupabaseAdmin()

    const { data: existing } = await supabase
      .from('course_quizzes')
      .select('id')
      .eq('course_id', courseId)

    const slug = await uniqueQuizSlug(courseId, title)

    const insert = {
      course_id: courseId,
      slug,
      title,
      status: 'draft',
      sort_order: (existing?.length || 0) * 100,
    }
    if (payload.lessonId) insert.lesson_id = payload.lessonId
    if (payload.topicId) insert.topic_id = payload.topicId

    const { data, error } = await supabase
      .from('course_quizzes')
      .insert(insert)
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ quiz: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create quiz')
  }
}
