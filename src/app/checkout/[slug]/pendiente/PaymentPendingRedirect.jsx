'use client'

import { useEffect, useState } from 'react'

export default function PaymentPendingRedirect({ seconds = 10 }) {
  const [remaining, setRemaining] = useState(seconds)

  useEffect(() => {
    const startedAt = Date.now()
    const interval = window.setInterval(() => {
      const elapsed = Math.floor((Date.now() - startedAt) / 1000)
      setRemaining(Math.max(0, seconds - elapsed))
    }, 250)

    const timeout = window.setTimeout(() => {
      window.location.assign('/')
    }, seconds * 1000)

    return () => {
      window.clearInterval(interval)
      window.clearTimeout(timeout)
    }
  }, [seconds])

  return (
    <p className="payment-pending-countdown">
      Te llevamos al inicio en {remaining} segundo{remaining === 1 ? '' : 's'}.
    </p>
  )
}
