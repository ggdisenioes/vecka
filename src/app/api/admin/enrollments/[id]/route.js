import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('course_enrollments').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo eliminar la inscripción')
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    const patch = {}
    if (payload.accessStatus) patch.access_status = payload.accessStatus
    if (payload.expiresAt !== undefined) {
      patch.expires_at = payload.expiresAt ? new Date(payload.expiresAt).toISOString() : null
    }

    const { error } = await supabase.from('course_enrollments').update(patch).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo actualizar la inscripción')
  }
}
