import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  LESSON_TYPES,
  requireStaff,
  requireText,
  revalidateCourses,
  uniqueLessonSlug,
  uniqueLessonSlugByCourse,
} from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const title = String(payload.title || 'Nueva lección').trim() || 'Nueva lección'
    const lessonType = LESSON_TYPES.includes(payload.lessonType) ? payload.lessonType : 'video'
    const supabase = getSupabaseAdmin()

    // New-style: lesson linked to course + optional section
    if (payload.courseId) {
      const courseId = requireText(payload.courseId, 'Course id')
      const { data: existing } = await supabase
        .from('course_lessons')
        .select('id')
        .eq('course_id', courseId)

      const slug = await uniqueLessonSlugByCourse(courseId, title)
      const { data, error } = await supabase
        .from('course_lessons')
        .insert({
          course_id: courseId,
          section_id: payload.sectionId || null,
          slug,
          title,
          sort_order: (existing?.length || 0) * 100,
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
    }

    // Legacy: lesson linked to module
    const moduleId = requireText(payload.moduleId, 'Module id')
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
