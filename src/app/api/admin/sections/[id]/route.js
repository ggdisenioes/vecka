import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, revalidateCourses } from '@/lib/admin-api'

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const title = String(payload.title || '').trim() || 'Nueva sección'
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('course_sections')
      .update({ title })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ section: data })
  } catch (error) {
    return jsonError(error.message || 'Could not update section')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    await supabase.from('course_lessons').update({ section_id: null }).eq('section_id', id)

    const { error } = await supabase.from('course_sections').delete().eq('id', id)
    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete section')
  }
}
