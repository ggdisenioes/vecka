'use client'

import { useState } from 'react'

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function PaymentIcon({ type }) {
  if (type === 'card') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <rect width="20" height="14" x="2" y="5" rx="2" />
        <path d="M2 10h20" />
      </svg>
    )
  }

  if (type === 'wallet') {
    return (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1" />
        <path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4" />
      </svg>
    )
  }

  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
      <path d="M10 12h4" />
      <path d="M10 8h4" />
      <path d="M14 21v-3a2 2 0 0 0-4 0v3" />
      <path d="M6 10H4a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-2" />
      <path d="M6 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16" />
    </svg>
  )
}

export default function MembershipCheckoutForm({ tier, paymentPlans = [] }) {
  const plans = paymentPlans.length ? paymentPlans : []
  const [paymentPlanId, setPaymentPlanId] = useState(plans[0]?.id || 'monthly')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const selectedPlan = plans.find((plan) => plan.id === paymentPlanId) || plans[0]

  async function handleSubmit() {
    if (!selectedPlan) {
      setError('No hay una opción de pago configurada.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tier.id,
          paymentPlanId: selectedPlan.id,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar el pago.')
        return
      }

      window.location.href = data.sandboxInitPoint || data.initPoint
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <fieldset className="lovable-payment-options">
        <legend>Forma de pago</legend>
        {plans.map((plan) => {
          const selected = paymentPlanId === plan.id
          const icon = plan.paymentMode === 'subscription' ? 'wallet' : 'card'
          return (
            <label key={plan.id} className={`lovable-payment-option${selected ? ' selected' : ''}`}>
              <input
                type="radio"
                name="paymentPlan"
                value={plan.id}
                checked={selected}
                onChange={() => setPaymentPlanId(plan.id)}
              />
              <span className="lovable-payment-icon"><PaymentIcon type={icon} /></span>
              <span className="lovable-payment-copy">
                <strong>{plan.checkoutLabel} · {formatPrice(plan.priceArs)}</strong>
                <span>{plan.description}</span>
              </span>
              <span className="lovable-radio-dot" />
            </label>
          )
        })}
      </fieldset>

      {selectedPlan ? (
        <div className="lovable-selected-plan">
          <span>{selectedPlan.totalLabel}</span>
          <strong>{formatPrice(selectedPlan.priceArs)} {selectedPlan.id === 'monthly' ? '/ mes' : ''}</strong>
          <small>{selectedPlan.accessLabel}</small>
        </div>
      ) : null}

      <label className="lovable-field" style={{ marginTop: 32 }}>
        <span>Comentarios para Vero (opcional)</span>
        <textarea
          className="lovable-textarea"
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          maxLength={500}
          placeholder="¿Algo que quieras contarnos?"
        />
      </label>

      {error ? <div className="lovable-message error">{error}</div> : null}

      <button type="button" className="lovable-button" style={{ width: 'auto', paddingInline: 28 }} onClick={handleSubmit} disabled={loading}>
        {loading ? 'Procesando…' : selectedPlan?.ctaLabel || 'Continuar a Mercado Pago'}
      </button>
    </>
  )
}
