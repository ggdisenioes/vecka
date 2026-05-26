import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { isPublicMembershipSlug } from '@/lib/memberships'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createMercadoPagoPreapproval } from '@/lib/mercadopago-subscriptions'

export async function POST(request) {
  const { user } = await getCurrentAuth()
  if (!user) {
    return NextResponse.json({ error: 'Debés iniciar sesión para continuar.' }, { status: 401 })
  }

  const payload = await request.json().catch(() => ({}))
  if (!payload.tierId) {
    return NextResponse.json({ error: 'tierId es requerido' }, { status: 400 })
  }
  const notes = typeof payload.notes === 'string' ? payload.notes.slice(0, 500) : null

  const supabase = getSupabaseAdmin()

  const { data: tier } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, price_ars, billing_period, status')
    .eq('id', payload.tierId)
    .eq('status', 'published')
    .maybeSingle()

  if (!tier) {
    return NextResponse.json({ error: 'Membresía no encontrada.' }, { status: 404 })
  }

  if (!isPublicMembershipSlug(tier.slug)) {
    return NextResponse.json({ error: 'Membresía no encontrada.' }, { status: 404 })
  }

  if (!tier.price_ars || tier.price_ars <= 0) {
    return NextResponse.json({ error: 'Esta membresía no tiene precio configurado.' }, { status: 400 })
  }

  if (!['monthly', 'annual'].includes(tier.billing_period)) {
    return NextResponse.json(
      { error: 'MercadoPago recurrente solo está disponible para membresías mensuales o anuales.' },
      { status: 400 },
    )
  }

  // Validate and apply coupon
  let finalPrice = Number(tier.price_ars)
  let couponId = null
  if (payload.couponId) {
    const { data: coupon } = await supabase
      .from('membership_coupons')
      .select('id, discount_type, discount_value, max_uses, uses_count, valid_until, active, tier_ids')
      .eq('id', payload.couponId)
      .eq('active', true)
      .maybeSingle()

    if (coupon) {
      const now = new Date()
      const expired = coupon.valid_until && new Date(coupon.valid_until) < now
      const maxed = coupon.max_uses !== null && coupon.uses_count >= coupon.max_uses
      const wrongTier = coupon.tier_ids?.length && !coupon.tier_ids.includes(tier.id)

      if (!expired && !maxed && !wrongTier) {
        if (coupon.discount_type === 'percent') {
          finalPrice = Math.max(0, finalPrice * (1 - coupon.discount_value / 100))
        } else {
          finalPrice = Math.max(0, finalPrice - coupon.discount_value)
        }
        couponId = coupon.id
      }
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('email, full_name, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const checkoutProfile = {
    email: profile?.email || user.email,
    full_name: profile?.full_name,
    display_name: profile?.display_name,
  }

  const externalReference = JSON.stringify({
    flow: 'membership_preapproval',
    tierId: tier.id,
    userId: user.id,
    couponId,
    amount: finalPrice,
  })

  let mpData
  try {
    mpData = await createMercadoPagoPreapproval({
      externalReference,
      tier,
      profile: checkoutProfile,
      amount: finalPrice,
      notes,
    })
  } catch (err) {
    console.error('MercadoPago preapproval error:', err)
    return NextResponse.json({ error: 'No se pudo iniciar la suscripción en MercadoPago.' }, { status: 502 })
  }

  if (!mpData?.id || !mpData?.init_point) {
    console.error('MercadoPago preapproval missing init point:', mpData)
    return NextResponse.json({ error: 'MercadoPago no devolvió el link de suscripción.' }, { status: 502 })
  }

  return NextResponse.json({
    initPoint: mpData.init_point,
    sandboxInitPoint: mpData.sandbox_init_point,
    subscriptionId: null,
    providerSubscriptionId: mpData.id,
    finalPrice,
    couponApplied: !!couponId,
  })
}
