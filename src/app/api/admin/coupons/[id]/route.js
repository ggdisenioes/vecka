import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    const patch = { updated_at: new Date().toISOString() }
    if (payload.description !== undefined) patch.description = payload.description || null
    if (payload.discountType !== undefined) patch.discount_type = ['percent', 'fixed_ars'].includes(payload.discountType) ? payload.discountType : 'percent'
    if (payload.discountValue !== undefined) patch.discount_value = Number(payload.discountValue || 0)
    if (payload.maxUses !== undefined) patch.max_uses = payload.maxUses ? Number(payload.maxUses) : null
    if (payload.validFrom !== undefined) patch.valid_from = payload.validFrom || null
    if (payload.validUntil !== undefined) patch.valid_until = payload.validUntil || null
    if (payload.active !== undefined) patch.active = Boolean(payload.active)
    if (payload.tierIds !== undefined) patch.tier_ids = Array.isArray(payload.tierIds) && payload.tierIds.length ? payload.tierIds : null

    const { error } = await supabase.from('membership_coupons').update(patch).eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo actualizar el cupón')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('membership_coupons').delete().eq('id', id)
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo eliminar el cupón')
  }
}
