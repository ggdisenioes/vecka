import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, requireText, revalidateCourses } from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const courseId = requireText(payload.courseId, 'Course id')
    const title = requireText(payload.title || 'Nuevo módulo', 'Module title')
    const supabase = getSupabaseAdmin()

    const { data: existing, error: countError } = await supabase
      .from('course_modules')
      .select('id')
      .eq('course_id', courseId)

    if (countError) throw countError

    const { data, error } = await supabase
      .from('course_modules')
      .insert({
        course_id: courseId,
        title,
        position: (existing?.length || 0) + 1,
      })
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ module: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create module')
  }
}
