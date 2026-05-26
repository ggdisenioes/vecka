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

function parseExternalReference(value) {
  try {
    const parsed = JSON.parse(String(value || '{}'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
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

  const { data: existingGrant } = await supabase
    .from('membership_grants')
    .select('id, payment_reference, access_status')
    .eq('tier_id', tierId)
    .eq('user_id', userId)
    .maybeSingle()

  if (
    existingGrant?.payment_reference
    && paymentReference
    && existingGrant.payment_reference === paymentReference
    && existingGrant.access_status === 'active'
  ) {
    return { alreadyApplied: true }
  }

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

  return { alreadyApplied: false }
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

    const activation = await activateMembership({
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

    if (!activation?.alreadyApplied) {
      await incrementCouponUsage(supabase, couponId)
    }
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

  const meta = parseExternalReference(preapproval.external_reference)
  const tierId = meta.tierId || preapproval.metadata?.tierId
  const userId = meta.userId || preapproval.metadata?.userId
  const status = normalizeMercadoPagoSubscriptionStatus(preapproval.status)

  if (!tierId || !userId) return

  if (['cancelled', 'paused', 'expired', 'failed'].includes(status)) {
    await supabase
      .from('membership_grants')
      .update({
        access_status: status === 'expired' ? 'expired' : 'revoked',
        cancelled_at: new Date().toISOString(),
        notes: `MercadoPago suscripción ${status}`,
      })
      .eq('tier_id', tierId)
      .eq('user_id', userId)

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

  const preapproval = await getMercadoPagoPreapproval(preapprovalId).catch((error) => {
    console.error('MercadoPago preapproval fetch error:', error)
    return null
  })
  if (!preapproval) return

  const meta = parseExternalReference(preapproval.external_reference)
  const tierId = meta.tierId || preapproval.metadata?.tierId
  const userId = meta.userId || preapproval.metadata?.userId
  const couponId = meta.couponId || preapproval.metadata?.couponId || null

  if (!tierId || !userId) return

  const { tier, profile } = await getTierAndProfile(supabase, tierId, userId)
  if (!tier) return

  const status = getPaymentStatus(authorizedPayment)
  const providerPaymentId = getAuthorizedPaymentId(authorizedPayment, paymentId)
  const amount = getAuthorizedPaymentAmount(authorizedPayment)

  const approved = APPROVED_STATUSES.has(status)
  const failed = FAILED_STATUSES.has(status)

  if (approved) {
    const approvedAt = getAuthorizedPaymentApprovedAt(authorizedPayment)
    const expiresAt = authorizedPayment.next_payment_date || addBillingPeriod(new Date(approvedAt), tier.billing_period)

    const activation = await activateMembership({
      supabase,
      tier,
      profile,
      userId,
      tierId,
      couponId,
      amount,
      paymentReference: `mp-sub:${preapprovalId}:${providerPaymentId}`,
      expiresAt,
      paymentNotes: [
        'MercadoPago suscripción recurrente',
        `Preapproval: ${preapprovalId}`,
        `Pago autorizado: ${providerPaymentId}`,
        `Evento: ${eventType}`,
      ].join(' · '),
    })

    if (!activation?.alreadyApplied) {
      await incrementCouponUsage(supabase, couponId)
    }
  } else if (failed) {
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
