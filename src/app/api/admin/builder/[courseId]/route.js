import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, revalidateCourses } from '@/lib/admin-api'

export async function GET(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { courseId } = await params
    const supabase = getSupabaseAdmin()

    const [sectionsRes, lessonsRes, topicsRes, quizzesRes] = await Promise.all([
      supabase
        .from('course_sections')
        .select('id, title, sort_order')
        .eq('course_id', courseId)
        .order('sort_order'),
      supabase
        .from('course_lessons')
        .select('id, title, status, section_id, sort_order, lesson_type, is_preview')
        .eq('course_id', courseId)
        .order('sort_order'),
      supabase
        .from('course_topics')
        .select('id, lesson_id, title, status, sort_order, lesson_type, is_preview')
        .eq('course_id', courseId)
        .order('sort_order'),
      supabase
        .from('course_quizzes')
        .select('id, lesson_id, topic_id, title, status, sort_order')
        .eq('course_id', courseId)
        .order('sort_order'),
    ])

    for (const res of [sectionsRes, lessonsRes, topicsRes, quizzesRes]) {
      if (res.error) throw res.error
    }

    return NextResponse.json({
      sections: sectionsRes.data || [],
      lessons: lessonsRes.data || [],
      topics: topicsRes.data || [],
      quizzes: quizzesRes.data || [],
    })
  } catch (error) {
    return jsonError(error.message || 'Could not load builder data')
  }
}

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { courseId } = await params
    const { items } = await request.json()
    if (!Array.isArray(items)) return jsonError('items must be an array')

    const supabase = getSupabaseAdmin()

    await Promise.all(
      items.map((item) => {
        if (item.type === 'section') {
          return supabase
            .from('course_sections')
            .update({ sort_order: item.sortOrder })
            .eq('id', item.id)
            .eq('course_id', courseId)
        }
        if (item.type === 'lesson') {
          return supabase
            .from('course_lessons')
            .update({ sort_order: item.sortOrder, section_id: item.sectionId ?? null })
            .eq('id', item.id)
            .eq('course_id', courseId)
        }
        if (item.type === 'topic') {
          return supabase
            .from('course_topics')
            .update({ sort_order: item.sortOrder })
            .eq('id', item.id)
            .eq('course_id', courseId)
        }
        if (item.type === 'quiz') {
          return supabase
            .from('course_quizzes')
            .update({ sort_order: item.sortOrder })
            .eq('id', item.id)
            .eq('course_id', courseId)
        }
        return Promise.resolve()
      })
    )

    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not save order')
  }
}
