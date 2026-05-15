import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, requireText, revalidateCourses, uniqueTopicSlug } from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const lessonId = requireText(payload.lessonId, 'Lesson id')
    const title = String(payload.title || 'Nuevo tema').trim() || 'Nuevo tema'
    const supabase = getSupabaseAdmin()

    const { data: lesson, error: lessonError } = await supabase
      .from('course_lessons')
      .select('course_id')
      .eq('id', lessonId)
      .maybeSingle()

    if (lessonError) throw lessonError
    if (!lesson) throw new Error('Lesson not found')

    const { data: existing } = await supabase
      .from('course_topics')
      .select('id')
      .eq('lesson_id', lessonId)

    const slug = await uniqueTopicSlug(lessonId, title)

    const { data, error } = await supabase
      .from('course_topics')
      .insert({
        lesson_id: lessonId,
        course_id: lesson.course_id,
        slug,
        title,
        status: 'draft',
        sort_order: (existing?.length || 0) * 100,
        video_provider: 'none',
        lesson_type: 'video',
      })
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ topic: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create topic')
  }
}
