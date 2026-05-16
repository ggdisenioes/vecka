import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request) {
  const { user } = await getCurrentAuth()
  if (!user) {
    return NextResponse.json({ error: 'Debés iniciar sesión para continuar.' }, { status: 401 })
  }

  const payload = await request.json().catch(() => ({}))
  if (!payload.tierId) {
    return NextResponse.json({ error: 'tierId es requerido' }, { status: 400 })
  }

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

  if (!tier.price_ars || tier.price_ars <= 0) {
    return NextResponse.json({ error: 'Esta membresía no tiene precio configurado.' }, { status: 400 })
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

  const { data: profile } = await (await getSupabaseServer())
    .from('profiles')
    .select('email, full_name, display_name')
    .eq('id', user.id)
    .maybeSingle()

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vecka.com.ar'

  const preference = {
    items: [
      {
        id: tier.id,
        title: tier.name,
        description: tier.description || `Membresía ${tier.name}`,
        quantity: 1,
        currency_id: 'ARS',
        unit_price: Math.max(1, Math.round(finalPrice)),
      },
    ],
    payer: {
      email: profile?.email || user.email || '',
      name: profile?.display_name || profile?.full_name || '',
    },
    back_urls: {
      success: `${baseUrl}/membresia/${tier.slug}?payment=success`,
      failure: `${baseUrl}/membresia/${tier.slug}?payment=failure`,
      pending: `${baseUrl}/membresia/${tier.slug}?payment=pending`,
    },
    auto_return: 'approved',
    notification_url: `${baseUrl}/api/webhooks/mercadopago`,
    external_reference: JSON.stringify({ tierId: tier.id, userId: user.id, couponId }),
    metadata: { tierId: tier.id, userId: user.id, couponId },
  }

  const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}`,
    },
    body: JSON.stringify(preference),
  })

  if (!mpResponse.ok) {
    const err = await mpResponse.text()
    console.error('MercadoPago preference error:', err)
    return NextResponse.json({ error: 'No se pudo crear la preferencia de pago.' }, { status: 502 })
  }

  const mpData = await mpResponse.json()

  return NextResponse.json({
    initPoint: mpData.init_point,
    sandboxInitPoint: mpData.sandbox_init_point,
    preferenceId: mpData.id,
    finalPrice,
    couponApplied: !!couponId,
  })
}
