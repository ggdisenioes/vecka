import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendPaymentConfirmationEmail, sendPaymentFailedEmail } from '@/lib/email'
import { revalidateMemberships } from '@/lib/admin-api'
import {
  addBillingPeriod,
  getMercadoPagoAuthorizedPayment,
  getMercadoPagoPayment,
  getMercadoPagoPreapproval,
  normalizeMercadoPagoSubscriptionStatus,
  normalizeMercadoPagoWebhookTopic,
  verifyMercadoPagoWebhookSignature,
} from '@/lib/mercadopago-subscriptions'

const APPROVED_STATUSES = new Set(['approved', 'authorized', 'processed'])
const FAILED_STATUSES = new Set(['rejected', 'cancelled', 'canceled', 'failed'])

function getWebhookDataId(url, body) {
  return (
    url.searchParams.get('data.id')
    || url.searchParams.get('id')
    || body?.data?.id
    || body?.id
    || null
  )
}

function getWebhookTopic(url, body) {
  return normalizeMercadoPagoWebhookTopic(
    body?.type
    || body?.action
    || url.searchParams.get('type')
    || url.searchParams.get('topic'),
  )
}

function getPaymentStatus(payload) {
  return String(
    payload?.payment?.status
    || payload?.payment_status
    || payload?.status
    || payload?.status_detail
    || 'pending',
  ).toLowerCase()
}

function getAuthorizedPaymentId(payload, fallbackId) {
  return String(payload?.payment?.id || payload?.payment_id || payload?.id || fallbackId || '')
}

function getAuthorizedPaymentAmount(payload) {
  return Number(
    payload?.payment?.transaction_amount
    || payload?.transaction_amount
    || payload?.amount
    || 0,
  )
}

function getAuthorizedPaymentCurrency(payload) {
  return payload?.payment?.currency_id || payload?.currency_id || 'ARS'
}

function getAuthorizedPaymentApprovedAt(payload) {
  return (
    payload?.payment?.date_approved
    || payload?.date_approved
    || payload?.created_date
    || new Date().toISOString()
  )
}

function getPreapprovalIdFromAuthorizedPayment(payload) {
  return (
    payload?.preapproval_id
    || payload?.preapproval?.id
    || payload?.subscription_id
    || null
  )
}

async function getTierAndProfile(supabase, tierId, userId) {
  const [{ data: tier }, { data: profile }] = await Promise.all([
    supabase
      .from('membership_tiers')
      .select('id, slug, name, billing_period, price_ars')
      .eq('id', tierId)
      .maybeSingle(),
    supabase
      .from('profiles')
      .select('email, full_name, display_name')
      .eq('id', userId)
      .maybeSingle(),
  ])

  return { tier, profile }
}

async function incrementCouponUsage(supabase, couponId) {
  if (!couponId) return

  const { data: coupon } = await supabase
    .from('membership_coupons')
    .select('uses_count')
    .eq('id', couponId)
    .maybeSingle()

  if (!coupon) return

  await supabase
    .from('membership_coupons')
    .update({ uses_count: (coupon.uses_count || 0) + 1 })
    .eq('id', couponId)
}

async function recordPaymentEvent(supabase, event) {
  if (!event.provider_event_id) return { alreadyApproved: false }

  const { data: existing } = await supabase
    .from('membership_payment_events')
    .select('id, status')
    .eq('provider', 'mercadopago')
    .eq('provider_event_id', event.provider_event_id)
    .maybeSingle()

  if (existing) {
    await supabase
      .from('membership_payment_events')
      .update(event)
      .eq('id', existing.id)

    return { alreadyApproved: APPROVED_STATUSES.has(String(existing.status || '').toLowerCase()) }
  }

  const { error } = await supabase
    .from('membership_payment_events')
    .insert(event)

  if (error) {
    console.error('MercadoPago payment event insert error:', error)
  }

  return { alreadyApproved: false }
}

async function activateMembership({
  supabase,
  tier,
  profile,
  userId,
  tierId,
  couponId,
  amount,
  paymentReference,
  paymentNotes,
  expiresAt,
}) {
  const now = new Date().toISOString()

  await supabase
    .from('membership_grants')
    .upsert({
      tier_id: tierId,
      user_id: userId,
      access_status: 'active',
      grant_type: 'payment',
      granted_at: now,
      starts_at: now,
      expires_at: expiresAt,
      payment_reference: paymentReference,
      coupon_id: couponId || null,
      notes: paymentNotes,
    }, { onConflict: 'tier_id,user_id' })

  revalidateMemberships()

  if (!profile?.email || !tier) return

  const name = profile.display_name || profile.full_name || ''
  sendPaymentConfirmationEmail({
    to: profile.email,
    name,
    tierName: tier.name,
    billingPeriod: tier.billing_period,
    amountArs: amount,
    paymentReference,
    expiresAt,
    tierSlug: tier.slug,
  }).catch(() => {})

  sendWelcomeEmail({
    to: profile.email,
    name,
    tierName: tier.name,
    billingPeriod: tier.billing_period,
    expiresAt,
    tierSlug: tier.slug,
  }).catch(() => {})
}

async function handleLegacyPaymentNotification(supabase, paymentId) {
  const payment = await getMercadoPagoPayment(paymentId).catch(() => null)
  if (!payment) return

  let meta = {}
  try {
    meta = JSON.parse(payment.external_reference || '{}')
  } catch {
    // MercadoPago may send a non-JSON external reference.
  }

  const tierId = meta.tierId || payment.metadata?.tierId
  const userId = meta.userId || payment.metadata?.userId
  const couponId = meta.couponId || payment.metadata?.couponId || null
  const selectedMethod = meta.paymentMethod || payment.metadata?.paymentMethod || payment.metadata?.payment_method || null
  const checkoutNotes = payment.metadata?.notes || null

  if (!tierId || !userId) return

  const { tier, profile } = await getTierAndProfile(supabase, tierId, userId)
  const email = profile?.email
  const name = profile?.display_name || profile?.full_name || ''

  if (payment.status === 'approved') {
    const expiresAt = tier?.billing_period === 'annual'
      ? addBillingPeriod(new Date(), 'annual')
      : addBillingPeriod(new Date(), 'monthly')

    await activateMembership({
      supabase,
      tier,
      profile,
      userId,
      tierId,
      couponId,
      amount: payment.transaction_amount,
      paymentReference: String(payment.id),
      expiresAt,
      paymentNotes: [
        `MercadoPago · ${payment.payment_method_id || ''} · ${payment.status_detail || ''}`,
        selectedMethod ? `Elegido en checkout: ${selectedMethod}` : null,
        checkoutNotes ? `Comentario: ${checkoutNotes}` : null,
      ].filter(Boolean).join(' · '),
    })

    await incrementCouponUsage(supabase, couponId)
  } else if (FAILED_STATUSES.has(String(payment.status || '').toLowerCase()) && email && tier) {
    sendPaymentFailedEmail({
      to: email,
      name,
      tierName: tier.name,
      tierSlug: tier.slug,
    }).catch(() => {})
  }
}

async function handlePreapprovalNotification(supabase, preapprovalId) {
  const preapproval = await getMercadoPagoPreapproval(preapprovalId).catch((error) => {
    console.error('MercadoPago preapproval fetch error:', error)
    return null
  })
  if (!preapproval) return

  const localSubscriptionId = preapproval.external_reference || preapproval.metadata?.subscription_id || null
  const status = normalizeMercadoPagoSubscriptionStatus(preapproval.status)
  const patch = {
    provider_subscription_id: preapproval.id,
    status,
    next_payment_at: preapproval.next_payment_date || null,
    metadata: { mercadopago_preapproval: preapproval },
  }

  if (status === 'authorized') {
    patch.started_at = preapproval.date_created || new Date().toISOString()
  }

  if (status === 'cancelled') {
    patch.cancelled_at = new Date().toISOString()
  }

  let query = supabase.from('membership_subscriptions')

  if (localSubscriptionId) {
    query = query.update(patch).eq('id', localSubscriptionId)
  } else {
    query = query.update(patch).eq('provider', 'mercadopago').eq('provider_subscription_id', preapproval.id)
  }

  const { data: updated } = await query.select('id, tier_id, user_id').maybeSingle()

  if (updated && ['cancelled', 'paused', 'expired', 'failed'].includes(status)) {
    await supabase
      .from('membership_grants')
      .update({
        access_status: status === 'expired' ? 'expired' : 'revoked',
        cancelled_at: new Date().toISOString(),
        notes: `MercadoPago suscripción ${status}`,
      })
      .eq('tier_id', updated.tier_id)
      .eq('user_id', updated.user_id)

    revalidateMemberships()
  }
}

async function handleAuthorizedPaymentNotification(supabase, paymentId, eventType) {
  const authorizedPayment = await getMercadoPagoAuthorizedPayment(paymentId).catch((error) => {
    console.error('MercadoPago authorized payment fetch error:', error)
    return null
  })
  if (!authorizedPayment) return

  const preapprovalId = getPreapprovalIdFromAuthorizedPayment(authorizedPayment)
  if (!preapprovalId) return

  const { data: subscription } = await supabase
    .from('membership_subscriptions')
    .select('id, tier_id, user_id, coupon_id, billing_period, started_at, provider_subscription_id')
    .eq('provider', 'mercadopago')
    .eq('provider_subscription_id', preapprovalId)
    .maybeSingle()

  if (!subscription) return

  const { tier, profile } = await getTierAndProfile(supabase, subscription.tier_id, subscription.user_id)
  if (!tier) return

  const status = getPaymentStatus(authorizedPayment)
  const providerPaymentId = getAuthorizedPaymentId(authorizedPayment, paymentId)
  const eventReference = `${eventType}:${paymentId}`
  const amount = getAuthorizedPaymentAmount(authorizedPayment)
  const currency = getAuthorizedPaymentCurrency(authorizedPayment)

  const { alreadyApproved } = await recordPaymentEvent(supabase, {
    provider: 'mercadopago',
    provider_event_id: eventReference,
    provider_payment_id: providerPaymentId,
    provider_subscription_id: preapprovalId,
    subscription_id: subscription.id,
    tier_id: subscription.tier_id,
    user_id: subscription.user_id,
    amount,
    currency,
    status,
    event_type: eventType,
    raw_payload: authorizedPayment,
  })

  const approved = APPROVED_STATUSES.has(status)
  const failed = FAILED_STATUSES.has(status)

  if (approved) {
    const approvedAt = getAuthorizedPaymentApprovedAt(authorizedPayment)
    const expiresAt = authorizedPayment.next_payment_date || addBillingPeriod(new Date(approvedAt), tier.billing_period)

    if (!alreadyApproved) {
      await activateMembership({
        supabase,
        tier,
        profile,
        userId: subscription.user_id,
        tierId: subscription.tier_id,
        couponId: subscription.coupon_id,
        amount,
        paymentReference: `mp-sub:${preapprovalId}:${providerPaymentId}`,
        expiresAt,
        paymentNotes: [
          'MercadoPago suscripción recurrente',
          `Preapproval: ${preapprovalId}`,
          `Pago autorizado: ${providerPaymentId}`,
        ].join(' · '),
      })

      await incrementCouponUsage(supabase, subscription.coupon_id)
    }

    await supabase
      .from('membership_subscriptions')
      .update({
        status: 'authorized',
        last_payment_at: approvedAt,
        next_payment_at: expiresAt,
        started_at: subscription.started_at || approvedAt,
        metadata: {
          mercadopago_authorized_payment: authorizedPayment,
        },
      })
      .eq('id', subscription.id)
  } else if (failed) {
    await supabase
      .from('membership_subscriptions')
      .update({
        status: 'failed',
        metadata: {
          mercadopago_authorized_payment: authorizedPayment,
        },
      })
      .eq('id', subscription.id)

    if (profile?.email) {
      sendPaymentFailedEmail({
        to: profile.email,
        name: profile.display_name || profile.full_name || '',
        tierName: tier.name,
        tierSlug: tier.slug,
      }).catch(() => {})
    }
  }
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}))
    const url = new URL(request.url)
    const dataId = getWebhookDataId(url, body)

    if (!verifyMercadoPagoWebhookSignature({ request, dataId })) {
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const eventType = getWebhookTopic(url, body)
    if (!eventType || !dataId) {
      return NextResponse.json({ ok: true })
    }

    const supabase = getSupabaseAdmin()

    if (eventType === 'subscription_preapproval') {
      await handlePreapprovalNotification(supabase, dataId)
    } else if (eventType === 'subscription_authorized_payment') {
      await handleAuthorizedPaymentNotification(supabase, dataId, eventType)
    } else if (eventType === 'payment') {
      await handleLegacyPaymentNotification(supabase, dataId)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('MercadoPago webhook error:', err)
    return NextResponse.json({ ok: true })
  }
}
