import Link from 'next/link'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServer } from '@/lib/supabase/server'
import './membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Membresías Club VeCKA — Cosé con propósito',
  description: 'Sumate al Club VeCKA. Membresías mensuales con acceso a talleres, materiales y comunidad privada.',
}

function periodLabel(period) {
  return period === 'monthly' ? 'mes' : period === 'annual' ? 'año' : period === 'lifetime' ? 'pago único' : ''
}

export default async function MembresiaLandingPage() {
  const { user, profile } = await getCurrentAuth()
  const userIsStaff = isStaff(profile)
  const shouldUseDirectAccessLabel = Boolean(user) || userIsStaff

  let tiersQuery = getSupabaseAdmin()
    .from('membership_tiers')
    .select('id, slug, name, description, cover_image_url, sort_order, status, price_ars, price_usd, billing_period, features, is_featured, trial_days')
    .order('sort_order', { ascending: true })

  if (!userIsStaff) {
    tiersQuery = tiersQuery.eq('status', 'published')
  }

  const { data: tiers } = await tiersQuery

  let activeTierIds = new Set()
  if (user && tiers?.length) {
    const supabase = await getSupabaseServer()
    const { data: grants } = await supabase
      .from('membership_grants')
      .select('tier_id, access_status, expires_at')
      .eq('user_id', user.id)
    activeTierIds = new Set(
      (grants || [])
        .filter((g) => g.access_status === 'active' && (!g.expires_at || new Date(g.expires_at) > new Date()))
        .map((g) => g.tier_id),
    )
  }

  return (
    <PublicSiteShell user={user} loginHref="/login?next=/membresias">
      <section className="membership-shell">
        <div className="membership-container">
          <header
            className="membership-hero"
            style={{
              background: 'linear-gradient(135deg, #1e3d2e 0%, #2a5244 50%, #1a3530 100%)',
              borderRadius: 22,
              padding: '40px 32px',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
              marginBottom: 32,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -56,
                right: -30,
                width: 220,
                height: 220,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(151,206,184,.18) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />
            <div
              style={{
                position: 'absolute',
                bottom: -70,
                left: '22%',
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(224,168,187,.12) 0%, transparent 70%)',
                pointerEvents: 'none',
              }}
            />

            <div style={{ position: 'relative' }}>
              <span className="membership-kicker" style={{ color: '#97ceb8' }}>Club VeCKA</span>
              <h1 style={{ color: '#fff', marginBottom: 12 }}>Membresías</h1>
              <p style={{ color: 'oklch(88% 0.02 60)', maxWidth: 680 }}>
                Accedé a contenido exclusivo: clases en video, artículos, materiales descargables y
                sesiones en vivo. Elegí el nivel que mejor se ajuste a tu camino.
              </p>
            </div>
          </header>

          {userIsStaff ? (
            <div className="membership-admin-banner">
              Vista administradora: acá ves también membresías en borrador o archivadas.
            </div>
          ) : null}

          {(!tiers || tiers.length === 0) ? (
            <div className="membership-locked">
              Próximamente vamos a abrir las membresías. ¡Quedate atenta!
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24, alignItems: 'start' }}>
              {tiers.map((tier) => {
                const active = activeTierIds.has(tier.id)
                const features = Array.isArray(tier.features) ? tier.features : []
                const period = periodLabel(tier.billing_period)
                const ctaLabel = active || shouldUseDirectAccessLabel
                  ? 'Ir a la membresía →'
                  : tier.trial_days > 0
                    ? 'Probar gratis →'
                    : 'Suscribirme →'

                return (
                  <div
                    key={tier.id}
                    style={{
                      background: '#fff',
                      borderRadius: 16,
                      border: tier.is_featured ? '2px solid #5e9e8a' : '1px solid oklch(90% 0.012 60)',
                      overflow: 'hidden',
                      display: 'flex',
                      flexDirection: 'column',
                      position: 'relative',
                      boxShadow: tier.is_featured ? '0 20px 48px rgba(94,158,138,.14)' : '0 2px 8px rgba(0,0,0,.05)',
                      minHeight: 100,
                    }}
                  >
                    <div
                      style={{
                        height: 180,
                        background: tier.is_featured
                          ? 'linear-gradient(135deg, #5e9e8a 0%, #4a7d6e 100%)'
                          : 'linear-gradient(135deg, #dceae3 0%, #f0dee7 100%)',
                        position: 'relative',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,.26) 0%, transparent 60%)',
                        }}
                      />
                      <div
                        style={{
                          fontFamily: "'Cormorant Garamond', serif",
                          fontSize: 20,
                          fontWeight: 600,
                          color: tier.is_featured ? 'rgba(255,255,255,.46)' : 'rgba(0,0,0,.28)',
                          textAlign: 'center',
                          padding: '0 20px',
                          position: 'relative',
                        }}
                      >
                        {tier.name}
                      </div>
                      <div style={{ position: 'absolute', top: 12, right: 12 }}>
                        <span
                          className="membership-pill"
                          style={{
                            background: tier.is_featured ? 'rgba(255,255,255,.16)' : '#f0dee7',
                            color: tier.is_featured ? '#fff' : '#5e9e8a',
                          }}
                        >
                          Membresía
                        </span>
                      </div>
                      {active ? (
                        <div style={{ position: 'absolute', top: 12, left: 12 }}>
                          <span className="membership-pill active">Suscripta</span>
                        </div>
                      ) : null}
                    </div>

                    <div style={{ padding: '20px' }}>
                      {active && (
                        <div style={{ marginBottom: 10 }}>
                          <span style={{ fontSize: 11, background: '#d4f0e6', color: '#2e7d6a', borderRadius: 20, padding: '3px 10px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Tu membresía activa</span>
                        </div>
                      )}

                      {userIsStaff && tier.status !== 'published' ? (
                        <div style={{ marginBottom: 10 }}>
                          <span className="membership-pill expired">
                            {tier.status === 'draft' ? 'Borrador' : 'Archivada'}
                          </span>
                        </div>
                      ) : null}

                      <div style={{ fontSize: 11, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif", marginBottom: 6 }}>
                        Club VeCKA
                      </div>
                      <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, margin: '0 0 6px', color: 'oklch(18% 0.022 50)' }}>{tier.name}</h2>
                      {tier.description && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', margin: '0 0 12px', lineHeight: 1.5 }}>{tier.description}</p>
                      )}

                      {tier.price_ars > 0 ? (
                        <div style={{ margin: '14px 0 8px', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 30, fontWeight: 700, color: '#5e9e8a', lineHeight: 1 }}>
                            ${Number(tier.price_ars).toLocaleString('es-AR')}
                          </span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)' }}>
                            ARS{period ? ` / ${period}` : ''}
                          </span>
                        </div>
                      ) : (
                        <div style={{ margin: '14px 0 8px', fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#5e9e8a' }}>Gratis</div>
                      )}

                      {tier.trial_days > 0 && !active && (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#5e9e8a', fontWeight: 600, marginBottom: 14 }}>
                          ✓ {tier.trial_days} días de prueba gratuita
                        </div>
                      )}

                      {features.length > 0 && (
                        <ul style={{ listStyle: 'none', margin: '0 0 18px', padding: 0 }}>
                          {features.slice(0, 4).map((f, i) => (
                            <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(40% 0.018 50)', lineHeight: 1.6, marginBottom: 4 }}>
                              <span style={{ color: '#5e9e8a', flexShrink: 0, fontWeight: 700 }}>✓</span>
                              {f}
                            </li>
                          ))}
                        </ul>
                      )}

                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginTop: 16 }}>
                        <div style={{ fontSize: 12, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif" }}>
                          {features.length > 0 ? `${features.length} beneficios incluidos` : 'Acceso exclusivo'}
                        </div>
                        <Link
                          href={`/membresias/${tier.slug}`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            padding: '8px 16px',
                            background: shouldUseDirectAccessLabel || tier.is_featured ? '#5e9e8a' : '#fff',
                            color: shouldUseDirectAccessLabel || tier.is_featured ? '#fff' : '#5e9e8a',
                            border: '1.5px solid #5e9e8a',
                            borderRadius: 8,
                            fontFamily: "'DM Sans', sans-serif",
                            fontSize: 13,
                            fontWeight: 600,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {ctaLabel}
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {!user ? (
            <div style={{ textAlign: 'center', marginTop: 32 }}>
              <p style={{ fontFamily: "'DM Sans', sans-serif", color: 'oklch(52% 0.018 50)', marginBottom: 14 }}>
                Ya tenés cuenta? Iniciá sesión para ver tu membresía activa.
              </p>
                <Link href="/login?next=/membresias" className="membership-cta secondary">
                Iniciar sesión
              </Link>
            </div>
          ) : null}
        </div>
      </section>
    </PublicSiteShell>
  )
}
