import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth } from '@/lib/auth'
import { PUBLIC_MEMBERSHIP_NAME, isPublicMembershipSlug } from '@/lib/memberships'
import PaymentPendingRedirect from './PaymentPendingRedirect'
import '../../../membresia/membership.css'

export const dynamic = 'force-dynamic'

function statusCopy(status) {
  if (status === 'failure') {
    return {
      title: 'El pago no pudo procesarse',
      text: 'Mercado Pago no aprobó la operación. Podés volver a intentar desde la membresía.',
      className: 'error',
    }
  }

  return {
    title: 'Tu pago está siendo procesado',
    text: 'Cuando Mercado Pago acredite el pago, el acceso a la membresía se activa automáticamente.',
    className: 'pending',
  }
}

export default async function PaymentPendingPage({ params, searchParams }) {
  const { slug } = await params
  const sp = await searchParams
  if (!isPublicMembershipSlug(slug)) notFound()

  const { user } = await getCurrentAuth()
  const status = typeof sp?.payment === 'string' ? sp.payment : 'pending'
  const copy = statusCopy(status)

  return (
    <PublicSiteShell user={user} loginHref={`/login?next=/checkout/${slug}/pendiente`}>
      <main className="payment-pending-shell">
        <section className={`payment-pending-card ${copy.className}`}>
          <p className="summary-kicker">Mercado Pago</p>
          <h1>{copy.title}</h1>
          <p>{copy.text}</p>
          <div className="membership-status pending">
            {PUBLIC_MEMBERSHIP_NAME}: acceso automático al acreditarse.
          </div>
          <PaymentPendingRedirect seconds={10} />
          <Link className="membership-cta secondary" href="/">
            Ir al inicio ahora
          </Link>
        </section>
      </main>
    </PublicSiteShell>
  )
}
