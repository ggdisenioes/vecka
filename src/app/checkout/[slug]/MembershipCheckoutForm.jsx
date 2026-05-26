'use client'

import { useState } from 'react'

const PAYMENT_METHODS = [
  {
    id: 'mercadopago',
    label: 'Mercado Pago recurrente',
    desc: 'Se activa automáticamente cuando se acredita el primer pago',
    icon: 'wallet',
  },
]

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

export default function MembershipCheckoutForm({ tier }) {
  const [paymentMethod, setPaymentMethod] = useState('mercadopago')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tierId: tier.id,
          paymentMethod,
          notes: notes.trim() || undefined,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar la suscripción.')
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
        <legend>Método de pago</legend>
        {PAYMENT_METHODS.map((method) => {
          const selected = paymentMethod === method.id
          return (
            <label key={method.id} className={`lovable-payment-option${selected ? ' selected' : ''}`}>
              <input
                type="radio"
                name="paymentMethod"
                value={method.id}
                checked={selected}
                onChange={() => setPaymentMethod(method.id)}
              />
              <span className="lovable-payment-icon"><PaymentIcon type={method.icon} /></span>
              <span className="lovable-payment-copy">
                <strong>{method.label}</strong>
                <span>{method.desc}</span>
              </span>
              <span className="lovable-radio-dot" />
            </label>
          )
        })}
      </fieldset>

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
        {loading ? 'Procesando…' : 'Activar suscripción'}
      </button>
    </>
  )
}
