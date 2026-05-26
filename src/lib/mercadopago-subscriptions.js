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

export async function createMercadoPagoPreapproval({ subscriptionId, externalReference, tier, profile, amount }) {
  const siteUrl = getPublicSiteUrl()
  const autoRecurring = billingPeriodToAutoRecurring(tier.billing_period)
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
      back_url: `${siteUrl}/membresias/${tier.slug}?subscription=pending`,
      status: 'pending',
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
