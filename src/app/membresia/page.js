import Link from 'next/link'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import {
  PUBLIC_MEMBERSHIP_NAME,
  PUBLIC_MEMBERSHIP_SLUGS,
  getClubAccessFromGrants,
} from '@/lib/memberships'
import { formatPriceArs, getPublicMembershipPaymentPlans } from '@/lib/membership-pricing'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServer } from '@/lib/supabase/server'
import './membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Membresías Club VeCKA — Cosé con propósito',
  description: 'Sumate al Club VeCKA. Membresías mensuales con acceso ilimitado a talleres, molde exclusivo y comunidad privada.',
}

function statusCopy(tier, userIsStaff) {
  if (userIsStaff && tier.status !== 'published') {
    return {
      label: tier.status === 'archived' ? 'Archivada' : 'Borrador',
      className: 'lovable-status admin',
    }
  }

  return {
    label: 'Inscripciones abiertas',
    className: 'lovable-status open',
  }
}

export default async function MembresiaLandingPage() {
  const { user, profile } = await getCurrentAuth()
  const userIsStaff = isStaff(profile)
  const paymentPlans = getPublicMembershipPaymentPlans()
  const monthlyPlan = paymentPlans.find((plan) => plan.id === 'monthly') || paymentPlans[0]
  const annualPlan = paymentPlans.find((plan) => plan.id === 'annual') || paymentPlans[1]

  const tiersQuery = getSupabaseAdmin()
    .from('membership_tiers')
    .select('id, slug, name, description, sort_order, status, price_ars, price_usd, billing_period, features, is_featured, trial_days, created_at')
    .in('slug', PUBLIC_MEMBERSHIP_SLUGS)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  const { data: rawTiers } = await tiersQuery
  const tiers = userIsStaff ? (rawTiers || []) : (rawTiers || []).filter((tier) => tier.status === 'published')

  let activeTierIds = new Set()
  let activeCounts = new Map()

  if (tiers?.length) {
    const { data: activeGrants } = await getSupabaseAdmin()
      .from('membership_grants')
      .select('tier_id, access_status, expires_at')
      .eq('access_status', 'active')

    const now = new Date()
    activeCounts = new Map()
    for (const grant of activeGrants || []) {
      if (grant.expires_at && new Date(grant.expires_at) <= now) continue
      activeCounts.set(grant.tier_id, (activeCounts.get(grant.tier_id) || 0) + 1)
    }
  }

  if (user && tiers?.length) {
    const supabase = await getSupabaseServer()
    const { data: grants } = await supabase
      .from('membership_grants')
      .select('tier_id, access_status, granted_at, starts_at, expires_at, membership_tiers(slug, billing_period, price_ars, features, description)')
      .eq('user_id', user.id)

    const access = getClubAccessFromGrants(grants || [])
    if (access.hasAccess) activeTierIds = new Set((tiers || []).map((tier) => tier.id))
  }

  return (
    <PublicSiteShell user={user} loginHref="/login?next=/membresias">
      <section className="membership-shell">
        <header className="lovable-hero">
          <div className="lovable-hero-inner">
            <span className="lovable-eyebrow">⭐ CLUB VECKA · MEMBRESÍAS</span>
            <h1>
              Una membresía que <em>empieza con vos</em>
            </h1>
            <p>
              La membresía nueva del Club abre a fines de mayo / principios de junio.
              Desde el alta, accedés al contenido habilitado para tu etapa de inscripción.
            </p>
            <ul className="lovable-benefits">
              {['Talleres online ilimitados', 'Molde digital exclusivo / mes', 'Comunidad privada + soporte'].map((benefit) => (
                <li key={benefit}>
                  <span className="lovable-check">✓</span>
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </header>

        <section className="lovable-section">
          <div className="lovable-section-head">
            <div>
              <p className="lovable-section-kicker">Cohortes disponibles</p>
              <h2>Sumate al Club</h2>
            </div>
            <p>
              Una sola opción pública, con pago mensual recurrente o pago anual único por Mercado Pago.
            </p>
          </div>

          {(!tiers || tiers.length === 0) ? (
            <div className="membership-locked" style={{ marginTop: 32 }}>
              Próximamente vamos a abrir las membresías. Quedate atenta.
            </div>
          ) : (
            <div className="lovable-tier-grid">
              {tiers.map((tier) => {
                const active = activeTierIds.has(tier.id)
                const features = Array.isArray(tier.features) ? tier.features : []
                const status = statusCopy(tier, userIsStaff)
                const ctaLabel = active
                  ? 'Ir a la membresía'
                  : tier.trial_days > 0
                    ? 'Probar gratis'
                    : 'Sumarme ahora'
                const ctaHref = active
                  ? `/membresias/${tier.slug}`
                  : `/checkout/${tier.slug}`

                return (
                  <article key={tier.id} className={`lovable-tier-card${tier.is_featured ? ' featured' : ''}`}>
                    {tier.is_featured ? <span className="lovable-featured-badge">Destacada</span> : null}
                    <span className={status.className}>{status.label}</span>
                    <h3>{PUBLIC_MEMBERSHIP_NAME}</h3>
                    {tier.description ? <p>{tier.description}</p> : null}

                    <div className="lovable-tier-meta">
                      <span>Inicia cuando quieras</span>
                      <span>{activeCounts.get(tier.id) || 0} socias activas</span>
                    </div>

                    {features.length > 0 ? (
                      <ul className="lovable-tier-benefits">
                        {features.map((feature) => (
                          <li key={feature}>
                            <span className="lovable-check">✓</span>
                            {feature}
                          </li>
                        ))}
                      </ul>
                    ) : null}

                    <div className="lovable-tier-footer">
                      <div className="lovable-tier-price">
                        <strong>{formatPriceArs(monthlyPlan.priceArs)}</strong>
                        <span>/ mes</span>
                      </div>
                      <p className="lovable-tier-usd">
                        O pago anual único: {formatPriceArs(annualPlan.priceArs)}
                      </p>
                      {Number(tier.price_usd || 0) > 0 ? (
                        <p className="lovable-tier-usd">o USD {Number(tier.price_usd).toLocaleString('es-AR')} para residentes fuera de Argentina</p>
                      ) : null}
                      <Link className={`lovable-button${active ? '' : tier.is_featured ? '' : ' outline'}`} href={ctaHref}>
                        {ctaLabel} →
                      </Link>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>

        <section className="lovable-faq">
          <h2>Preguntas frecuentes</h2>
          <div className="lovable-faq-list">
            {[
              ['¿Qué incluye la membresía?', 'Acceso ilimitado a todos los talleres del mes, un molde digital exclusivo cada mes y la comunidad privada con Vero.'],
              ['¿Puedo cancelar cuando quiera?', 'Sí. Las membresías son mes a mes. Cancelás cuando quieras sin costo.'],
              ['¿Necesito experiencia previa?', 'No. Hay contenido para todos los niveles, desde principiante a avanzado.'],
              ['¿Cómo accedo después de pagar?', 'Te creamos el usuario y recibís el acceso por mail apenas confirmamos el pago.'],
            ].map(([question, answer]) => (
              <details key={question}>
                <summary><span>+</span>{question}</summary>
                <p>{answer}</p>
              </details>
            ))}
          </div>
        </section>
      </section>
    </PublicSiteShell>
  )
}
