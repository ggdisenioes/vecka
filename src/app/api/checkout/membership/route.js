import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { ensureMembershipCheckoutUser } from '@/lib/membership-accounts'
import { getPublicMembershipPaymentPlan } from '@/lib/membership-pricing'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { createMercadoPagoPaymentPreference, createMercadoPagoPreapproval } from '@/lib/mercadopago-subscriptions'

async function upsertPendingSubscription({
  supabase,
  providerSubscriptionId,
  tier,
  userId,
  couponId,
  amount,
  paymentPlan,
  metadata,
}) {
  if (!providerSubscriptionId || !tier?.id || !userId) return

  await supabase
    .from('membership_subscriptions')
    .upsert({
      provider: 'mercadopago',
      provider_subscription_id: providerSubscriptionId,
      tier_id: tier.id,
      user_id: userId,
      status: 'pending',
      amount: Number(amount || 0),
      currency: 'ARS',
      billing_period: paymentPlan?.billingPeriod || tier.billing_period || 'monthly',
      coupon_id: couponId || null,
      metadata: metadata || {},
    }, { onConflict: 'provider,tier_id,user_id' })
}

export async function POST(request) {
  const { user } = await getCurrentAuth()
  const payload = await request.json().catch(() => ({}))
  if (!payload.tierId) {
    return NextResponse.json({ error: 'tierId es requerido' }, { status: 400 })
  }
  const notes = typeof payload.notes === 'string' ? payload.notes.slice(0, 500) : null
  const submittedEmail = String(payload.customerEmail || '').trim().toLowerCase()
  const submittedName = String(payload.customerName || '').trim().slice(0, 120)

  const supabase = getSupabaseAdmin()

  const [{ data: tier }, { data: settings }] = await Promise.all([
    supabase
      .from('membership_tiers')
      .select('id, slug, name, description, price_ars, billing_period, status')
      .eq('id', payload.tierId)
      .eq('status', 'published')
      .maybeSingle(),
    supabase
      .from('platform_settings')
      .select('public_membership_monthly_price_ars, public_membership_annual_price_ars')
      .maybeSingle(),
  ])

  const paymentPlan = getPublicMembershipPaymentPlan(payload.paymentPlanId, { tier, settings: settings || {} })

  if (!tier) {
    return NextResponse.json({ error: 'Membresía no encontrada.' }, { status: 404 })
  }

  if (!paymentPlan.priceArs || paymentPlan.priceArs <= 0) {
    return NextResponse.json({ error: 'Esta membresía no tiene precio configurado.' }, { status: 400 })
  }

  if (paymentPlan.paymentMode === 'subscription' && !['monthly', 'annual'].includes(paymentPlan.billingPeriod)) {
    return NextResponse.json(
      { error: 'MercadoPago recurrente solo está disponible para membresías mensuales o anuales.' },
      { status: 400 },
    )
  }

  // Validate and apply coupon
  let finalPrice = Number(paymentPlan.priceArs)
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

  const { data: profile } = user
    ? await supabase
        .from('profiles')
        .select('email, full_name, display_name')
        .eq('id', user.id)
        .maybeSingle()
    : { data: null }

  const customerEmail = (profile?.email || user?.email || submittedEmail).trim().toLowerCase()
  const customerName = profile?.full_name || profile?.display_name || submittedName

  if (!customerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customerEmail)) {
    return NextResponse.json({ error: 'Ingresá un email válido para continuar.' }, { status: 400 })
  }

  const checkoutProfile = {
    email: customerEmail,
    full_name: customerName,
    display_name: customerName,
  }

  let checkoutUserId = user?.id || null
  if (!checkoutUserId && paymentPlan.paymentMode === 'subscription') {
    try {
      const checkoutAccount = await ensureMembershipCheckoutUser(supabase, {
        userId: null,
        email: customerEmail,
        fullName: customerName,
      })
      checkoutUserId = checkoutAccount.userId
    } catch (error) {
      console.error('MercadoPago checkout user bootstrap error:', error)
      return NextResponse.json({ error: 'No se pudo preparar el acceso de la alumna.' }, { status: 500 })
    }
  }

  const externalReference = JSON.stringify({
    f: paymentPlan.paymentMode === 'subscription' ? 'membership_preapproval' : 'membership_payment',
    t: tier.id,
    u: checkoutUserId,
    e: customerEmail,
    n: customerName || null,
    c: couponId,
    a: finalPrice,
    p: paymentPlan.id,
    m: paymentPlan.paymentMode,
    b: paymentPlan.billingPeriod,
  })

  let mpData
  try {
    if (paymentPlan.paymentMode === 'subscription') {
      mpData = await createMercadoPagoPreapproval({
        externalReference,
        tier,
        profile: checkoutProfile,
        amount: finalPrice,
        paymentPlan,
        notes,
      })

      await upsertPendingSubscription({
        supabase,
        providerSubscriptionId: mpData.id,
        tier,
        userId: checkoutUserId,
        couponId,
        amount: finalPrice,
        paymentPlan,
        metadata: {
          customer_email: customerEmail,
          customer_name: customerName || null,
          payment_plan_id: paymentPlan.id,
          notes,
        },
      })
    } else {
      mpData = await createMercadoPagoPaymentPreference({
        externalReference,
        tier,
        profile: checkoutProfile,
        amount: finalPrice,
        paymentPlan,
        notes,
      })
    }
  } catch (err) {
    console.error('MercadoPago checkout error:', err)
    return NextResponse.json({ error: 'No se pudo iniciar el pago en MercadoPago.' }, { status: 502 })
  }

  if (!mpData?.id || !mpData?.init_point) {
    console.error('MercadoPago checkout missing init point:', mpData)
    return NextResponse.json({ error: 'MercadoPago no devolvió el link de pago.' }, { status: 502 })
  }

  return NextResponse.json({
    initPoint: mpData.init_point,
    sandboxInitPoint: mpData.sandbox_init_point,
    subscriptionId: null,
    providerSubscriptionId: mpData.id,
    finalPrice,
    couponApplied: !!couponId,
    paymentPlanId: paymentPlan.id,
    paymentMode: paymentPlan.paymentMode,
  })
}
