export const PUBLIC_MEMBERSHIP_PAYMENT_PLAN_IDS = {
  MONTHLY: 'monthly',
}

function sanitizePrice(value) {
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed) : 0
}

export function formatPriceArs(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function resolvePublicMembershipPlanPrices({ tier = {}, settings = {} } = {}) {
  const safeTier = tier && typeof tier === 'object' ? tier : {}
  const safeSettings = settings && typeof settings === 'object' ? settings : {}

  const tierMonthly = sanitizePrice(safeTier.price_ars)
  const monthlyPriceArs = sanitizePrice(safeSettings.public_membership_monthly_price_ars ?? tierMonthly)
  const annualPriceArs = sanitizePrice(
    safeSettings.public_membership_annual_price_ars ?? (monthlyPriceArs > 0 ? monthlyPriceArs * 12 : 0),
  )

  return {
    monthlyPriceArs,
    annualPriceArs,
  }
}

export function getPublicMembershipPaymentPlans(input = {}) {
  const { monthlyPriceArs } = resolvePublicMembershipPlanPrices(input)

  return [
    {
      id: PUBLIC_MEMBERSHIP_PAYMENT_PLAN_IDS.MONTHLY,
      label: 'Mensual',
      checkoutLabel: 'Pago mensual',
      ctaLabel: 'Activar suscripción mensual',
      description: 'Pago recurrente mensual por Mercado Pago.',
      priceArs: monthlyPriceArs,
      billingPeriod: 'monthly',
      paymentMode: 'subscription',
      intervalLabel: 'mes',
      totalLabel: 'Total mensual',
      accessLabel: 'Acceso mensual renovable',
    },
  ]
}

export function getPublicMembershipPaymentPlan(planId, input = {}) {
  const plans = getPublicMembershipPaymentPlans(input)
  return plans.find((plan) => plan.id === planId) || null
}
