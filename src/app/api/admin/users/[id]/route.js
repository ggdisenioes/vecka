import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'

export async function GET(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const [profileResult, enrollmentsResult, grantsResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('course_enrollments')
      .select('id, course_id, access_status, granted_at, expires_at, courses(id, slug, title, status)')
      .eq('user_id', id)
      .order('granted_at', { ascending: false }),
    supabase
      .from('membership_grants')
      .select('id, tier_id, access_status, grant_type, granted_at, expires_at, notes, membership_tiers(id, slug, name, billing_period, price_ars)')
      .eq('user_id', id)
      .order('granted_at', { ascending: false }),
  ])

  if (!profileResult.data) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

  return NextResponse.json({
    profile: profileResult.data,
    enrollments: enrollmentsResult.data || [],
    grants: grantsResult.data || [],
  })
}

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    const patch = { updated_at: new Date().toISOString() }
    if (payload.fullName !== undefined) patch.full_name = String(payload.fullName || '').trim() || null
    if (payload.displayName !== undefined) patch.display_name = String(payload.displayName || '').trim() || null
    if (payload.email !== undefined) patch.email = String(payload.email || '').trim().toLowerCase() || null
    if (payload.phone !== undefined) patch.phone = String(payload.phone || '').trim() || null
    if (payload.bio !== undefined) patch.bio = String(payload.bio || '').trim() || null
    if (payload.role !== undefined) {
      const allowed = ['student', 'editorial', 'admin']
      patch.role = allowed.includes(payload.role) ? payload.role : 'student'
    }

    const { error } = await supabase.from('profiles').update(patch).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo actualizar el usuario')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    // Delete from auth too
    await supabase.auth.admin.deleteUser(id)
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo eliminar el usuario')
  }
}
