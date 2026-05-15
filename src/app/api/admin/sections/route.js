import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, requireText, revalidateCourses } from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const courseId = requireText(payload.courseId, 'Course id')
    const title = String(payload.title || 'Nueva sección').trim() || 'Nueva sección'
    const supabase = getSupabaseAdmin()

    const { data: existing } = await supabase
      .from('course_sections')
      .select('id')
      .eq('course_id', courseId)

    const { data, error } = await supabase
      .from('course_sections')
      .insert({ course_id: courseId, title, sort_order: (existing?.length || 0) * 100 })
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ section: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create section')
  }
}
