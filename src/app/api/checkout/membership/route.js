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
        unit_price: Number(tier.price_ars),
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
    external_reference: JSON.stringify({ tierId: tier.id, userId: user.id }),
    metadata: { tierId: tier.id, userId: user.id },
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
  })
}
