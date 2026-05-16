'use client'

import { useState } from 'react'

function periodLabel(period) {
  return period === 'monthly' ? 'mes' : period === 'annual' ? 'año' : period === 'lifetime' ? 'pago único' : ''
}

export default function CheckoutButton({ tierId, tierName, priceArs, billingPeriod }) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo iniciar el pago.')
        return
      }
      window.location.href = data.initPoint
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  const period = periodLabel(billingPeriod)

  return (
    <div>
      <button
        onClick={handleCheckout}
        disabled={loading}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 10,
          padding: '14px 32px', background: loading ? '#8ab8ab' : '#5e9e8a',
          color: '#fff', border: 'none', borderRadius: 12, cursor: loading ? 'not-allowed' : 'pointer',
          fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700,
          transition: 'background .15s',
        }}
      >
        {loading ? (
          <>
            <span style={{ display: 'inline-block', width: 16, height: 16, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
            Procesando…
          </>
        ) : (
          <>
            Pagar ${Number(priceArs).toLocaleString('es-AR')} ARS{period ? ` / ${period}` : ''}
          </>
        )}
      </button>
      {error && (
        <div style={{ marginTop: 10, color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          {error}
        </div>
      )}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
