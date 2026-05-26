import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendWelcomeEmail, sendPaymentConfirmationEmail, sendPaymentFailedEmail, sendCheckoutAccountCreatedEmail } from '@/lib/email'
import { revalidateMemberships } from '@/lib/admin-api'
import { ensureMembershipCheckoutUser, findMembershipCheckoutUser } from '@/lib/membership-accounts'
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

async function getTier(supabase, tierId) {
  const { data: tier } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, billing_period, price_ars')
    .eq('id', tierId)
    .maybeSingle()

  return tier || null
}

function parseExternalReference(value) {
  try {
    const parsed = JSON.parse(String(value || '{}'))
    return parsed && typeof parsed === 'object' ? parsed : {}
  } catch {
    return {}
  }
}

function getCheckoutMeta(meta = {}, metadata = {}) {
  return {
    tierId: meta.tierId || meta.t || metadata?.tierId || metadata?.tier_id || null,
    userId: meta.userId || meta.u || metadata?.userId || metadata?.user_id || null,
    email: meta.customerEmail || meta.email || meta.e || metadata?.customerEmail || metadata?.customer_email || null,
    fullName: meta.customerName || meta.name || meta.n || metadata?.customerName || metadata?.customer_name || null,
    couponId: meta.couponId || meta.c || metadata?.couponId || metadata?.coupon_id || null,
    amount: meta.amount || meta.a || metadata?.amount || null,
    paymentPlanId: meta.paymentPlanId || meta.p || metadata?.paymentPlanId || metadata?.payment_plan_id || null,
    paymentMode: meta.paymentMode || meta.m || metadata?.paymentMode || metadata?.payment_mode || null,
    billingPeriod: meta.billingPeriod || meta.b || metadata?.billingPeriod || metadata?.billing_period || null,
    notes: meta.notes || metadata?.notes || null,
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
  billingPeriod,
  temporaryPassword,
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

  if (temporaryPassword) {
    sendCheckoutAccountCreatedEmail({
      to: profile.email,
      name,
      temporaryPassword,
      tierName: tier.name,
    }).catch(() => {})
  }

  sendPaymentConfirmationEmail({
    to: profile.email,
    name,
    tierName: tier.name,
    billingPeriod: billingPeriod || tier.billing_period,
    amountArs: amount,
    paymentReference,
    expiresAt,
    tierSlug: tier.slug,
  }).catch(() => {})

  sendWelcomeEmail({
    to: profile.email,
    name,
    tierName: tier.name,
    billingPeriod: billingPeriod || tier.billing_period,
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

  const checkout = getCheckoutMeta(meta, payment.metadata)
  const tierId = checkout.tierId

  if (!tierId || (!checkout.userId && !checkout.email)) return

  if (payment.status === 'approved') {
    const account = await ensureMembershipCheckoutUser(supabase, {
      userId: checkout.userId,
      email: checkout.email,
      fullName: checkout.fullName,
    })
    const { tier, profile } = await getTierAndProfile(supabase, tierId, account.userId)
    if (!tier || !account.userId) return

    const billingPeriod = checkout.billingPeriod || tier.billing_period || 'monthly'
    const amount = Number(payment.transaction_amount || checkout.amount || 0)
    const expiresAt = addBillingPeriod(new Date(), billingPeriod)

    const activation = await activateMembership({
      supabase,
      tier,
      profile: account.profile || profile,
      userId: account.userId,
      tierId,
      couponId: checkout.couponId,
      amount,
      paymentReference: `mp-pay:${payment.id}`,
      expiresAt,
      billingPeriod,
      temporaryPassword: account.temporaryPassword,
      paymentNotes: [
        `MercadoPago · ${payment.payment_method_id || ''} · ${payment.status_detail || ''}`,
        amount ? `Monto acreditado: ARS ${amount}` : null,
        checkout.paymentPlanId ? `Plan: ${checkout.paymentPlanId}` : null,
        billingPeriod ? `Periodo de acceso: ${billingPeriod}` : null,
        checkout.notes ? `Comentario: ${checkout.notes}` : null,
      ].filter(Boolean).join(' · '),
    })

    if (!activation?.alreadyApplied) {
      await incrementCouponUsage(supabase, checkout.couponId)
    }
  } else if (FAILED_STATUSES.has(String(payment.status || '').toLowerCase())) {
    const tier = await getTier(supabase, tierId)
    const email = checkout.email
    if (email) {
      sendPaymentFailedEmail({
        to: email,
        name: checkout.fullName || '',
        tierName: tier?.name || 'El Club VeCKA',
        tierSlug: tier?.slug,
      }).catch(() => {})
    }
  }
}

async function handlePreapprovalNotification(supabase, preapprovalId) {
  const preapproval = await getMercadoPagoPreapproval(preapprovalId).catch((error) => {
    console.error('MercadoPago preapproval fetch error:', error)
    return null
  })
  if (!preapproval) return

  const meta = parseExternalReference(preapproval.external_reference)
  const checkout = getCheckoutMeta(meta, preapproval.metadata)
  const tierId = checkout.tierId
  let userId = checkout.userId
  const status = normalizeMercadoPagoSubscriptionStatus(preapproval.status)

  if (!tierId || (!userId && !checkout.email)) return

  if (!userId && checkout.email) {
    const account = await findMembershipCheckoutUser(supabase, checkout.email)
    userId = account.userId
  }

  if (!userId) return

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
  const checkout = getCheckoutMeta(meta, preapproval.metadata)
  const tierId = checkout.tierId

  if (!tierId || (!checkout.userId && !checkout.email)) return

  const tier = await getTier(supabase, tierId)
  if (!tier) return

  const status = getPaymentStatus(authorizedPayment)
  const providerPaymentId = getAuthorizedPaymentId(authorizedPayment, paymentId)
  const amount = getAuthorizedPaymentAmount(authorizedPayment)

  const approved = APPROVED_STATUSES.has(status)
  const failed = FAILED_STATUSES.has(status)

  if (approved) {
    const account = await ensureMembershipCheckoutUser(supabase, {
      userId: checkout.userId,
      email: checkout.email,
      fullName: checkout.fullName,
    })
    const { profile } = await getTierAndProfile(supabase, tierId, account.userId)
    const approvedAt = getAuthorizedPaymentApprovedAt(authorizedPayment)
    const expiresAt = authorizedPayment.next_payment_date || addBillingPeriod(new Date(approvedAt), checkout.billingPeriod || tier.billing_period)

    const activation = await activateMembership({
      supabase,
      tier,
      profile: account.profile || profile,
      userId: account.userId,
      tierId,
      couponId: checkout.couponId,
      amount,
      paymentReference: `mp-sub:${preapprovalId}:${providerPaymentId}`,
      expiresAt,
      billingPeriod: checkout.billingPeriod || tier.billing_period,
      temporaryPassword: account.temporaryPassword,
      paymentNotes: [
        'MercadoPago suscripción recurrente',
        amount ? `Monto acreditado: ARS ${amount}` : null,
        `Preapproval: ${preapprovalId}`,
        `Pago autorizado: ${providerPaymentId}`,
        checkout.paymentPlanId ? `Plan: ${checkout.paymentPlanId}` : null,
        `Evento: ${eventType}`,
      ].filter(Boolean).join(' · '),
    })

    if (!activation?.alreadyApplied) {
      await incrementCouponUsage(supabase, checkout.couponId)
    }
  } else if (failed) {
    const account = checkout.email ? await findMembershipCheckoutUser(supabase, checkout.email) : { profile: null }
    const email = account.profile?.email || checkout.email
    if (email) {
      sendPaymentFailedEmail({
        to: email,
        name: account.profile?.display_name || account.profile?.full_name || checkout.fullName || '',
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
