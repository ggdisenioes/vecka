import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  pickVideoFields,
  requireStaff,
  requireText,
  revalidateCourses,
  toInteger,
} from '@/lib/admin-api'

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const title = requireText(payload.title, 'Module title')
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('course_modules')
      .update({
        title,
        description: String(payload.description || '').trim() || null,
        position: toInteger(payload.position, 1),
        ...pickVideoFields(payload),
      })
      .eq('id', id)

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not update module')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('course_modules').delete().eq('id', id)
    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete module')
  }
}
