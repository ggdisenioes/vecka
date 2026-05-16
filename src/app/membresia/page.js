import Link from 'next/link'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServer } from '@/lib/supabase/server'
import './membership.css'

export const dynamic = 'force-dynamic'

function periodLabel(period) {
  return period === 'monthly' ? 'mes' : period === 'annual' ? 'año' : period === 'lifetime' ? 'pago único' : ''
}

export default async function MembresiaLandingPage() {
  const { user } = await getCurrentAuth()

  const { data: tiers } = await getSupabaseAdmin()
    .from('membership_tiers')
    .select('id, slug, name, description, cover_image_url, sort_order, status, price_ars, price_usd, billing_period, features, is_featured, trial_days')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

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

  const hasFeatured = tiers?.some((t) => t.is_featured)

  return (
    <main className="membership-shell">
      <div className="membership-container">
        <header className="membership-hero">
          <h1>Membresías</h1>
          <p>
            Accedé a contenido exclusivo: clases en video, artículos, materiales descargables y
            sesiones en vivo. Elegí el nivel que mejor se ajuste a tu camino.
          </p>
        </header>

        {(!tiers || tiers.length === 0) ? (
          <div className="membership-locked">
            Próximamente vamos a abrir las membresías. ¡Quedate atenta!
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 22, alignItems: 'start' }}>
            {tiers.map((tier) => {
              const active = activeTierIds.has(tier.id)
              const features = Array.isArray(tier.features) ? tier.features : []
              const period = periodLabel(tier.billing_period)
              return (
                <div
                  key={tier.id}
                  style={{
                    background: '#fff',
                    borderRadius: 18,
                    border: tier.is_featured ? '2px solid #5e9e8a' : '1px solid oklch(88% 0.012 60)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    position: 'relative',
                    boxShadow: tier.is_featured ? '0 4px 24px rgba(94,158,138,.15)' : 'none',
                  }}
                >
                  {tier.is_featured && (
                    <div style={{ background: '#5e9e8a', color: '#fff', textAlign: 'center', padding: '6px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      Más popular
                    </div>
                  )}

                  <div style={{ padding: '26px 26px 0' }}>
                    {active && (
                      <div style={{ marginBottom: 10 }}>
                        <span style={{ fontSize: 11, background: '#d4f0e6', color: '#2e7d6a', borderRadius: 20, padding: '3px 10px', fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>Tu membresía activa</span>
                      </div>
                    )}

                    <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, margin: '0 0 8px' }}>{tier.name}</h2>
                    {tier.description && (
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)', margin: '0 0 16px', lineHeight: 1.5 }}>{tier.description}</p>
                    )}

                    {tier.price_ars > 0 ? (
                      <div style={{ margin: '16px 0', display: 'flex', alignItems: 'baseline', gap: 6 }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 38, fontWeight: 700, color: '#1a3a6e', lineHeight: 1 }}>
                          ${Number(tier.price_ars).toLocaleString('es-AR')}
                        </span>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)' }}>
                          ARS{period ? ` / ${period}` : ''}
                        </span>
                      </div>
                    ) : (
                      <div style={{ margin: '16px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a' }}>Gratis</div>
                    )}

                    {tier.trial_days > 0 && !active && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#5e9e8a', fontWeight: 600, marginBottom: 14 }}>
                        ✓ {tier.trial_days} días de prueba gratuita
                      </div>
                    )}

                    {features.length > 0 && (
                      <ul style={{ listStyle: 'none', margin: '0 0 20px', padding: 0 }}>
                        {features.map((f, i) => (
                          <li key={i} style={{ display: 'flex', gap: 8, alignItems: 'flex-start', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(40% 0.018 50)', lineHeight: 1.6, marginBottom: 4 }}>
                            <span style={{ color: '#5e9e8a', flexShrink: 0, fontWeight: 700 }}>✓</span>
                            {f}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>

                  <div style={{ padding: '0 26px 26px', marginTop: 'auto' }}>
                    <Link
                      href={`/membresia/${tier.slug}`}
                      style={{
                        display: 'block', textAlign: 'center',
                        padding: '13px 24px',
                        background: tier.is_featured ? '#5e9e8a' : '#fff',
                        color: tier.is_featured ? '#fff' : '#5e9e8a',
                        border: `2px solid #5e9e8a`,
                        borderRadius: 10,
                        fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700,
                        textDecoration: 'none',
                        transition: 'all .15s',
                      }}
                    >
                      {active ? 'Ver mi membresía →' : tier.trial_days > 0 ? 'Probar gratis →' : 'Suscribirme →'}
                    </Link>
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
            <Link href="/login?next=/membresia" className="membership-cta secondary">
              Iniciar sesión
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  )
}
