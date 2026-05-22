import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServer } from '@/lib/supabase/server'
import MembershipCheckoutForm from './MembershipCheckoutForm'
import '../../membresia/membership.css'

export const dynamic = 'force-dynamic'

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function periodLabel(period) {
  if (period === 'annual') return 'año'
  if (period === 'lifetime') return 'pago único'
  return 'mes'
}

export default async function MembershipCheckoutPage({ params }) {
  const { slug } = await params
  const { user } = await getCurrentAuth()

  if (!user) {
    redirect(`/login?next=/checkout/${slug}`)
  }

  const admin = getSupabaseAdmin()
  const { data: tier } = await admin
    .from('membership_tiers')
    .select('id, slug, name, description, price_ars, price_usd, billing_period, status, features')
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle()

  if (!tier) notFound()

  const supabase = await getSupabaseServer()
  const { data: grant } = await supabase
    .from('membership_grants')
    .select('access_status, expires_at')
    .eq('tier_id', tier.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const hasAccess = grant?.access_status === 'active' && (!grant.expires_at || new Date(grant.expires_at) > new Date())
  if (hasAccess) {
    redirect(`/membresias/${tier.slug}`)
  }

  const features = Array.isArray(tier.features) ? tier.features : []

  return (
    <PublicSiteShell user={user} loginHref={`/login?next=/checkout/${slug}`}>
      <main className="lovable-checkout">
        <Link href="/membresias" className="lovable-back-link">← Volver a membresías</Link>

        <div className="lovable-checkout-grid">
          <section>
            <h1>Finalizar inscripción</h1>
            <p className="lovable-checkout-subtitle">
              Elegí tu método de pago. Confirmamos tu acceso por mail apenas registremos el pago.
            </p>
            <MembershipCheckoutForm tier={tier} />
          </section>

          <aside className="lovable-order-summary">
            <p className="summary-kicker">Tu pedido</p>
            <h2>{tier.name}</h2>
            {tier.description ? <p className="lovable-checkout-subtitle">{tier.description}</p> : null}

            <div className="lovable-summary-divider" />

            <div className="lovable-summary-line">
              <span>Inicio</span>
              <strong>Inmediato</strong>
            </div>
            <div className="lovable-summary-line">
              <span>Duración</span>
              <strong>{periodLabel(tier.billing_period)}</strong>
            </div>

            {features.length > 0 ? (
              <ul className="lovable-summary-benefits">
                {features.map((feature, index) => (
                  <li key={`${feature}-${index}`}>
                    <span className="lovable-check">✓</span>
                    {feature}
                  </li>
                ))}
              </ul>
            ) : null}

            <div className="lovable-summary-divider" />

            <div className="lovable-summary-total">
              <span>Total</span>
              <strong>{formatPrice(tier.price_ars)}</strong>
            </div>
            {Number(tier.price_usd || 0) > 0 ? (
              <p className="lovable-tier-usd" style={{ textAlign: 'right' }}>
                USD {Number(tier.price_usd).toLocaleString('es-AR')} para tarjeta internacional
              </p>
            ) : null}
          </aside>
        </div>
      </main>
    </PublicSiteShell>
  )
}
