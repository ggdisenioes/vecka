import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendPaymentConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email'
import { revalidateMemberships } from '@/lib/admin-api'

async function getMPPayment(paymentId) {
  const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
    headers: { Authorization: `Bearer ${process.env.MERCADOPAGO_ACCESS_TOKEN}` },
  })
  if (!res.ok) return null
  return res.json()
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const { type, data } = body

    // Only handle payment notifications
    if (type !== 'payment' || !data?.id) {
      return NextResponse.json({ ok: true })
    }

    const payment = await getMPPayment(data.id)
    if (!payment) return NextResponse.json({ ok: true })

    let meta = {}
    try { meta = JSON.parse(payment.external_reference || '{}') } catch {}
    const tierId = meta.tierId || payment.metadata?.tierId
    const userId = meta.userId || payment.metadata?.userId

    if (!tierId || !userId) return NextResponse.json({ ok: true })

    const supabase = getSupabaseAdmin()
    const { data: tier } = await supabase
      .from('membership_tiers')
      .select('id, slug, name, billing_period, price_ars')
      .eq('id', tierId)
      .maybeSingle()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, display_name')
      .eq('id', userId)
      .maybeSingle()

    const email = profile?.email
    const name = profile?.display_name || profile?.full_name || ''

    if (payment.status === 'approved') {
      // Calculate expiry based on billing period
      let expiresAt = null
      if (tier?.billing_period === 'monthly') {
        expiresAt = new Date(Date.now() + 31 * 86400000).toISOString()
      } else if (tier?.billing_period === 'annual') {
        expiresAt = new Date(Date.now() + 366 * 86400000).toISOString()
      }

      const now = new Date().toISOString()
      await supabase
        .from('membership_grants')
        .upsert({
          tier_id: tierId,
          user_id: userId,
          access_status: 'active',
          granted_at: now,
          starts_at: now,
          expires_at: expiresAt,
          payment_reference: String(data.id),
          notes: `MercadoPago · ${payment.payment_method_id || ''} · ${payment.status_detail || ''}`,
        }, { onConflict: 'tier_id,user_id' })

      revalidateMemberships()

      if (email && tier) {
        sendPaymentConfirmationEmail({
          to: email, name,
          tierName: tier.name,
          billingPeriod: tier.billing_period,
          amountArs: payment.transaction_amount,
          paymentReference: String(data.id),
          expiresAt,
          tierSlug: tier.slug,
        }).catch(() => {})

        sendWelcomeEmail({
          to: email, name,
          tierName: tier.name,
          billingPeriod: tier.billing_period,
          expiresAt,
          tierSlug: tier.slug,
        }).catch(() => {})
      }
    } else if (['rejected', 'cancelled'].includes(payment.status)) {
      if (email && tier) {
        sendPaymentFailedEmail({
          to: email, name,
          tierName: tier.name,
          tierSlug: tier.slug,
        }).catch(() => {})
      }
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('MercadoPago webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
