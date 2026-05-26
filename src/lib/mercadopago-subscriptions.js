import crypto from 'node:crypto'

const MERCADOPAGO_API_URL = 'https://api.mercadopago.com'

export function getMercadoPagoAccessToken() {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN
  if (!token) throw new Error('MERCADOPAGO_ACCESS_TOKEN no configurado')
  return token
}

export function getPublicSiteUrl() {
  return (process.env.NEXT_PUBLIC_SITE_URL || 'https://nuevo.vecka.com.ar').replace(/\/$/, '')
}

export function billingPeriodToAutoRecurring(period) {
  if (period === 'annual') {
    return { frequency: 12, frequency_type: 'months' }
  }

  if (period === 'monthly') {
    return { frequency: 1, frequency_type: 'months' }
  }

  throw new Error('MercadoPago recurrente solo admite membresías mensuales o anuales.')
}

export function getPaymentPendingUrl(tierSlug, params = {}) {
  const siteUrl = getPublicSiteUrl()
  const url = new URL(`${siteUrl}/checkout/${tierSlug}/pendiente`)
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.set(key, String(value))
    }
  }
  return url.toString()
}

export function normalizeMercadoPagoSubscriptionStatus(status) {
  if (status === 'cancelled' || status === 'canceled') return 'cancelled'
  if (status === 'authorized') return 'authorized'
  if (status === 'paused') return 'paused'
  if (status === 'expired') return 'expired'
  if (status === 'failed' || status === 'rejected') return 'failed'
  return 'pending'
}

export function normalizeMercadoPagoWebhookTopic(value) {
  const topic = String(value || '').toLowerCase()

  if (topic.includes('authorized_payment')) return 'subscription_authorized_payment'
  if (topic.includes('preapproval')) return 'subscription_preapproval'
  if (topic.includes('payment')) return 'payment'

  return topic
}

export function addBillingPeriod(date, billingPeriod) {
  const next = new Date(date)
  if (billingPeriod === 'annual') {
    next.setFullYear(next.getFullYear() + 1)
    return next.toISOString()
  }

  next.setMonth(next.getMonth() + 1)
  return next.toISOString()
}

async function mercadoPagoFetch(path, options = {}) {
  const response = await fetch(`${MERCADOPAGO_API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${getMercadoPagoAccessToken()}`,
      ...(options.headers || {}),
    },
  })

  if (!response.ok) {
    const details = await response.text().catch(() => '')
    throw new Error(`MercadoPago ${path} error ${response.status}: ${details}`)
  }

  return response.json()
}

export async function createMercadoPagoPreapproval({ subscriptionId, externalReference, tier, profile, amount, paymentPlan }) {
  const autoRecurring = billingPeriodToAutoRecurring(paymentPlan?.billingPeriod || tier.billing_period)
  const payerEmail = profile?.email

  if (!payerEmail) {
    throw new Error('La cuenta no tiene email para crear la suscripción.')
  }

  return mercadoPagoFetch('/preapproval', {
    method: 'POST',
    body: JSON.stringify({
      reason: tier.name,
      external_reference: externalReference || subscriptionId,
      payer_email: payerEmail,
      auto_recurring: {
        ...autoRecurring,
        transaction_amount: Math.max(1, Math.round(Number(amount || 0))),
        currency_id: 'ARS',
      },
      back_url: getPaymentPendingUrl(tier.slug, {
        payment: 'pending',
        mode: paymentPlan?.paymentMode || 'subscription',
        plan: paymentPlan?.id || tier.billing_period,
      }),
      status: 'pending',
    }),
  })
}

export async function createMercadoPagoPaymentPreference({ externalReference, tier, profile, amount, paymentPlan, notes }) {
  const siteUrl = getPublicSiteUrl()
  const payerEmail = profile?.email

  if (!payerEmail) {
    throw new Error('La cuenta no tiene email para crear el pago.')
  }

  const pendingBase = {
    mode: paymentPlan?.paymentMode || 'one_time',
    plan: paymentPlan?.id || 'annual',
  }

  return mercadoPagoFetch('/checkout/preferences', {
    method: 'POST',
    body: JSON.stringify({
      items: [
        {
          id: `${tier.id}:${paymentPlan?.id || 'one_time'}`,
          title: `${tier.name} - ${paymentPlan?.label || 'Pago único'}`,
          description: paymentPlan?.description || tier.description || undefined,
          quantity: 1,
          unit_price: Math.max(1, Math.round(Number(amount || 0))),
          currency_id: 'ARS',
        },
      ],
      payer: {
        email: payerEmail,
        name: profile?.display_name || profile?.full_name || undefined,
      },
      back_urls: {
        success: getPaymentPendingUrl(tier.slug, { ...pendingBase, payment: 'success' }),
        failure: getPaymentPendingUrl(tier.slug, { ...pendingBase, payment: 'failure' }),
        pending: getPaymentPendingUrl(tier.slug, { ...pendingBase, payment: 'pending' }),
      },
      auto_return: 'approved',
      notification_url: `${siteUrl}/api/webhooks/mercadopago`,
      external_reference: externalReference,
      metadata: {
        notes: notes || undefined,
        tier_id: tier.id,
        payment_plan_id: paymentPlan?.id || 'one_time',
        payment_mode: paymentPlan?.paymentMode || 'one_time',
        billing_period: paymentPlan?.billingPeriod || 'annual',
      },
    }),
  })
}

export async function getMercadoPagoPreapproval(id) {
  return mercadoPagoFetch(`/preapproval/${encodeURIComponent(id)}`, { method: 'GET' })
}

export async function getMercadoPagoAuthorizedPayment(id) {
  return mercadoPagoFetch(`/authorized_payments/${encodeURIComponent(id)}`, { method: 'GET' })
}

export async function getMercadoPagoPayment(id) {
  return mercadoPagoFetch(`/v1/payments/${encodeURIComponent(id)}`, { method: 'GET' })
}

export function verifyMercadoPagoWebhookSignature({ request, dataId }) {
  const secret = process.env.MERCADOPAGO_WEBHOOK_SECRET
  if (!secret) return true

  const xSignature = request.headers.get('x-signature')
  const xRequestId = request.headers.get('x-request-id')
  if (!xSignature || !xRequestId || !dataId) return false

  const parts = Object.fromEntries(
    xSignature.split(',').map((part) => {
      const [key, value] = part.split('=')
      return [key?.trim(), value?.trim()]
    }),
  )

  if (!parts.ts || !parts.v1) return false

  const manifest = `id:${dataId};request-id:${xRequestId};ts:${parts.ts};`
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex')

  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(parts.v1))
  } catch {
    return false
  }
}
