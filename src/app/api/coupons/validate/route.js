import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request) {
  const { user } = await getCurrentAuth()
  if (!user) return NextResponse.json({ error: 'No autenticada' }, { status: 401 })

  const { code, tierId } = await request.json().catch(() => ({}))
  if (!code) return NextResponse.json({ error: 'Código requerido' }, { status: 400 })

  const supabase = getSupabaseAdmin()
  const { data: coupon } = await supabase
    .from('membership_coupons')
    .select('*')
    .eq('code', String(code).toUpperCase().trim())
    .eq('active', true)
    .maybeSingle()

  if (!coupon) return NextResponse.json({ error: 'Cupón no válido o inexistente.' }, { status: 404 })

  const now = new Date()
  if (coupon.valid_from && new Date(coupon.valid_from) > now) {
    return NextResponse.json({ error: 'El cupón aún no es válido.' }, { status: 400 })
  }
  if (coupon.valid_until && new Date(coupon.valid_until) < now) {
    return NextResponse.json({ error: 'El cupón ya expiró.' }, { status: 400 })
  }
  if (coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses) {
    return NextResponse.json({ error: 'El cupón ya alcanzó el límite de usos.' }, { status: 400 })
  }
  if (tierId && coupon.tier_ids && coupon.tier_ids.length > 0 && !coupon.tier_ids.includes(tierId)) {
    return NextResponse.json({ error: 'Este cupón no aplica para esta membresía.' }, { status: 400 })
  }

  return NextResponse.json({
    valid: true,
    couponId: coupon.id,
    discountType: coupon.discount_type,
    discountValue: Number(coupon.discount_value),
    description: coupon.description || null,
  })
}
