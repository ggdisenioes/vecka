import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'

export async function GET() {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('membership_coupons')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) return jsonError(error.message)
  return NextResponse.json({ coupons: data || [] })
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    if (!payload.code) return jsonError('El código es requerido')

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('membership_coupons')
      .insert({
        code: String(payload.code).toUpperCase().trim(),
        description: payload.description || null,
        discount_type: ['percent', 'fixed_ars'].includes(payload.discountType) ? payload.discountType : 'percent',
        discount_value: Number(payload.discountValue || 0),
        max_uses: payload.maxUses ? Number(payload.maxUses) : null,
        valid_from: payload.validFrom || null,
        valid_until: payload.validUntil || null,
        tier_ids: Array.isArray(payload.tierIds) && payload.tierIds.length ? payload.tierIds : null,
        active: payload.active !== false,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ coupon: data })
  } catch (err) {
    return jsonError(err.message || 'No se pudo crear el cupón')
  }
}
