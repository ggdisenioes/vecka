export const PUBLIC_MEMBERSHIP_PAYMENT_PLAN_IDS = {
  MONTHLY: 'monthly',
  ANNUAL: 'annual',
}

const DEFAULT_MONTHLY_PRICE_ARS = 22000
const DEFAULT_ANNUAL_PRICE_ARS = 498000

function envPrice(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10)
  return Number.isFinite(value) && value > 0 ? value : fallback
}

export function formatPriceArs(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

export function getPublicMembershipPaymentPlans() {
  return [
    {
      id: PUBLIC_MEMBERSHIP_PAYMENT_PLAN_IDS.MONTHLY,
      label: 'Mensual',
      checkoutLabel: 'Pago mensual',
      ctaLabel: 'Activar suscripción mensual',
      description: 'Pago recurrente mensual por Mercado Pago.',
      priceArs: envPrice('PUBLIC_MEMBERSHIP_MONTHLY_PRICE_ARS', DEFAULT_MONTHLY_PRICE_ARS),
      billingPeriod: 'monthly',
      paymentMode: 'subscription',
      intervalLabel: 'mes',
      totalLabel: 'Total mensual',
      accessLabel: 'Acceso mensual renovable',
    },
    {
      id: PUBLIC_MEMBERSHIP_PAYMENT_PLAN_IDS.ANNUAL,
      label: 'Anual',
      checkoutLabel: 'Pago anual',
      ctaLabel: 'Pagar anual',
      description: 'Pago único por 12 meses de acceso.',
      priceArs: envPrice('PUBLIC_MEMBERSHIP_ANNUAL_PRICE_ARS', DEFAULT_ANNUAL_PRICE_ARS),
      billingPeriod: 'annual',
      paymentMode: 'one_time',
      intervalLabel: 'pago único',
      totalLabel: 'Total anual',
      accessLabel: '12 meses de acceso',
    },
  ]
}

export function getPublicMembershipPaymentPlan(planId) {
  const plans = getPublicMembershipPaymentPlans()
  return plans.find((plan) => plan.id === planId) || plans[0]
}
