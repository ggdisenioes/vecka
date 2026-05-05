import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  LESSON_TYPES,
  requireStaff,
  requireText,
  revalidateCourses,
  uniqueLessonSlug,
} from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const moduleId = requireText(payload.moduleId, 'Module id')
    const title = requireText(payload.title || 'Nueva clase', 'Lesson title')
    const lessonType = LESSON_TYPES.includes(payload.lessonType) ? payload.lessonType : 'video'
    const supabase = getSupabaseAdmin()

    const { data: existing, error: countError } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('module_id', moduleId)

    if (countError) throw countError

    const slug = await uniqueLessonSlug(moduleId, title)
    const { data, error } = await supabase
      .from('course_lessons')
      .insert({
        module_id: moduleId,
        slug,
        title,
        position: (existing?.length || 0) + 1,
        status: 'draft',
        is_preview: false,
        video_provider: 'none',
        lesson_type: lessonType,
      })
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ lesson: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create lesson')
  }
}
