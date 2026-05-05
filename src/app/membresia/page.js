import Link from 'next/link'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase/server'
import './membership.css'

export const dynamic = 'force-dynamic'

export default async function MembresiaLandingPage() {
  const supabase = await getSupabaseServer()
  const { user } = await getCurrentAuth()

  const { data: tiers } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, cover_image_url, sort_order, status')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  let activeTierIds = new Set()
  if (user && tiers?.length) {
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
          <div className="membership-grid">
            {tiers.map((tier) => {
              const active = activeTierIds.has(tier.id)
              return (
                <Link key={tier.id} href={`/membresia/${tier.slug}`} className="membership-card">
                  <div className="pill-row">
                    {active ? (
                      <span className="membership-pill active">Tu membresía</span>
                    ) : (
                      <span className="membership-pill">Disponible</span>
                    )}
                  </div>
                  <h2>{tier.name}</h2>
                  {tier.description ? <p>{tier.description}</p> : null}
                  <div style={{ marginTop: 'auto' }}>
                    <span className="membership-cta secondary">
                      {active ? 'Entrar' : 'Ver detalles'}
                    </span>
                  </div>
                </Link>
              )
            })}
          </div>
        )}

        {!user ? (
          <div style={{ textAlign: 'center', marginTop: 32, color: 'var(--muted)' }}>
            <Link href="/login?next=/membresia" className="membership-cta secondary">
              Iniciar sesión
            </Link>
          </div>
        ) : null}
      </div>
    </main>
  )
}
