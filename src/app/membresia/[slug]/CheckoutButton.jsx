'use client'

import { useState } from 'react'

function periodLabel(period) {
  return period === 'monthly' ? 'mes' : period === 'annual' ? 'año' : period === 'lifetime' ? 'pago único' : ''
}

export default function CheckoutButton({ tierId, priceArs, billingPeriod, trialDays, hasUsedTrial }) {
  const [loading, setLoading] = useState(false)
  const [trialLoading, setTrialLoading] = useState(false)
  const [error, setError] = useState(null)
  const [couponCode, setCouponCode] = useState('')
  const [couponState, setCouponState] = useState(null) // { valid, couponId, discountType, discountValue, description }
  const [couponLoading, setCouponLoading] = useState(false)

  const canTrial = trialDays > 0 && !hasUsedTrial

  const discountedPrice = couponState?.valid
    ? couponState.discountType === 'percent'
      ? Math.max(0, priceArs * (1 - couponState.discountValue / 100))
      : Math.max(0, priceArs - couponState.discountValue)
    : priceArs

  async function validateCoupon() {
    if (!couponCode.trim()) return
    setCouponLoading(true)
    setCouponState(null)
    setError(null)
    try {
      const res = await fetch('/api/coupons/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: couponCode.trim(), tierId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Cupón inválido')
        return
      }
      setCouponState(data)
    } catch {
      setError('Error al validar el cupón.')
    } finally {
      setCouponLoading(false)
    }
  }

  async function handleCheckout() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/membership', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId, couponId: couponState?.couponId || null }),
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

  async function handleTrial() {
    setTrialLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/checkout/trial', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tierId }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'No se pudo activar la prueba.')
        return
      }
      window.location.reload()
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setTrialLoading(false)
    }
  }

  const period = periodLabel(billingPeriod)
  const btnStyle = (disabled) => ({
    display: 'inline-flex', alignItems: 'center', gap: 10,
    padding: '14px 32px',
    background: disabled ? '#8ab8ab' : '#5e9e8a',
    color: '#fff', border: 'none', borderRadius: 12,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontFamily: "'DM Sans', sans-serif", fontSize: 16, fontWeight: 700,
    transition: 'background .15s',
  })

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start' }}>
      {/* Coupon input */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          type="text"
          placeholder="Código de descuento"
          value={couponCode}
          onChange={(e) => { setCouponCode(e.target.value.toUpperCase()); setCouponState(null); setError(null) }}
          onKeyDown={(e) => e.key === 'Enter' && validateCoupon()}
          style={{ padding: '10px 14px', border: '1px solid #d0c8c0', borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 14, width: 200, background: '#fff' }}
        />
        <button
          onClick={validateCoupon}
          disabled={!couponCode.trim() || couponLoading}
          style={{ padding: '10px 16px', background: '#f0ece8', color: '#3a2e28', border: '1px solid #d0c8c0', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}
        >
          {couponLoading ? '…' : 'Aplicar'}
        </button>
        {couponState?.valid && (
          <span style={{ color: '#2e7d6a', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700 }}>
            ✓ {couponState.discountType === 'percent' ? `${couponState.discountValue}% de descuento` : `$${Number(couponState.discountValue).toLocaleString('es-AR')} de descuento`}
            {couponState.description ? ` · ${couponState.description}` : ''}
          </span>
        )}
      </div>

      {/* Price display */}
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15 }}>
        {couponState?.valid && discountedPrice !== priceArs ? (
          <span>
            <span style={{ textDecoration: 'line-through', color: '#8a7a6e', marginRight: 8 }}>
              ${Number(priceArs).toLocaleString('es-AR')}
            </span>
            <strong style={{ color: '#2e7d6a', fontSize: 18 }}>
              ${Math.round(discountedPrice).toLocaleString('es-AR')} ARS
            </strong>
            {period ? <span style={{ color: '#8a7a6e' }}> / {period}</span> : null}
          </span>
        ) : null}
      </div>

      {/* Pay button */}
      <button onClick={handleCheckout} disabled={loading} style={btnStyle(loading)}>
        {loading ? (
          <>
            <Spinner />
            Procesando…
          </>
        ) : (
          <>
            Pagar ${Math.round(discountedPrice).toLocaleString('es-AR')} ARS{period ? ` / ${period}` : ''}
          </>
        )}
      </button>

      {/* Trial button */}
      {canTrial && (
        <button onClick={handleTrial} disabled={trialLoading} style={{ ...btnStyle(trialLoading), background: trialLoading ? '#b8c8e0' : '#1a3a6e', fontSize: 14 }}>
          {trialLoading ? <><Spinner /> Activando…</> : `Probar gratis ${trialDays} días →`}
        </button>
      )}

      {error && (
        <div style={{ color: '#c0392b', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
          {error}
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}

function Spinner() {
  return (
    <span style={{ display: 'inline-block', width: 15, height: 15, border: '2px solid rgba(255,255,255,.4)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />
  )
}
