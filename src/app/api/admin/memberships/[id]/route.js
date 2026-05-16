import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, revalidateMemberships } from '@/lib/admin-api'

const GRANT_STATUSES = ['active', 'expired', 'revoked']

function parseExpiry(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    const patch = {}
    if (payload.accessStatus !== undefined) {
      patch.access_status = GRANT_STATUSES.includes(payload.accessStatus) ? payload.accessStatus : 'active'
      if (patch.access_status === 'revoked') patch.cancelled_at = new Date().toISOString()
    }
    if (payload.expiresAt !== undefined) patch.expires_at = parseExpiry(payload.expiresAt)
    if (payload.tierId !== undefined) patch.tier_id = payload.tierId
    if (payload.notes !== undefined) patch.notes = String(payload.notes || '').trim() || null
    if (payload.startsAt !== undefined) patch.starts_at = parseExpiry(payload.startsAt)

    const { error } = await supabase.from('membership_grants').update(patch).eq('id', id)
    if (error) throw error

    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not update membership')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('membership_grants').delete().eq('id', id)
    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete membership')
  }
}
