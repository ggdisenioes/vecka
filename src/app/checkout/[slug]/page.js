import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth } from '@/lib/auth'
import { PUBLIC_MEMBERSHIP_NAME, getClubAccessFromGrants, isPublicMembershipSlug } from '@/lib/memberships'
import { formatPriceArs, getPublicMembershipPaymentPlans } from '@/lib/membership-pricing'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import MembershipCheckoutForm from './MembershipCheckoutForm'
import '../../membresia/membership.css'

export const dynamic = 'force-dynamic'

export default async function MembershipCheckoutPage({ params }) {
  const { slug } = await params
  const { user } = await getCurrentAuth()

  if (!isPublicMembershipSlug(slug)) {
    notFound()
  }

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

  const { data: grants } = await admin
    .from('membership_grants')
    .select('tier_id, access_status, granted_at, starts_at, expires_at, membership_tiers(slug, billing_period, price_ars, features, description)')
    .eq('user_id', user.id)

  if (getClubAccessFromGrants(grants || []).hasAccess) {
    redirect(`/membresias/${tier.slug}`)
  }

  const features = Array.isArray(tier.features) ? tier.features : []
  const paymentPlans = getPublicMembershipPaymentPlans()

  return (
    <PublicSiteShell user={user} loginHref={`/login?next=/checkout/${slug}`}>
      <main className="lovable-checkout">
        <Link href="/membresias" className="lovable-back-link">← Volver a membresías</Link>

        <div className="lovable-checkout-grid">
          <section>
            <h1>Finalizar inscripción</h1>
            <p className="lovable-checkout-subtitle">
              Elegí cómo querés pagar el Club. El acceso se activa automáticamente cuando Mercado Pago acredita el pago.
            </p>
            <MembershipCheckoutForm tier={tier} paymentPlans={paymentPlans} />
          </section>

          <aside className="lovable-order-summary">
            <p className="summary-kicker">Tu pedido</p>
            <h2>{PUBLIC_MEMBERSHIP_NAME}</h2>
            {tier.description ? <p className="lovable-checkout-subtitle">{tier.description}</p> : null}

            <div className="lovable-summary-divider" />

            <div className="lovable-summary-line">
              <span>Inicio</span>
              <strong>Al acreditarse</strong>
            </div>
            {paymentPlans.map((plan) => (
              <div key={plan.id} className="lovable-summary-line">
                <span>{plan.checkoutLabel}</span>
                <strong>{formatPriceArs(plan.priceArs)} {plan.id === 'monthly' ? '/ mes' : ''}</strong>
              </div>
            ))}

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
              <span>Opciones</span>
              <strong>2</strong>
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
