import Link from 'next/link'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth } from '@/lib/auth'
import './membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'VeCKA — Cosé con propósito',
  description: 'Talleres online, moldes digitales y una comunidad de costureras que aprenden juntas.',
}

const features = [
  {
    title: 'Talleres Online',
    description: 'Aprendé a tu ritmo con clases en video.',
    meta: '24 talleres',
    href: '/talleres',
    icon: '✂',
  },
  {
    title: 'Moldes Digitales',
    description: 'PDFs listos para imprimir en casa.',
    meta: '200+ moldes',
    href: '/tienda',
    icon: '◇',
  },
  {
    title: 'Moldes en Papel',
    description: 'Tu biblioteca física lista para usar.',
    meta: '80+ modelos',
    href: '/tienda',
    icon: '□',
  },
  {
    title: 'Mercería VeCKA',
    description: 'Materiales seleccionados por Vero.',
    meta: 'Selección curada',
    href: '/tienda',
    icon: '•',
  },
]

export default async function HomePage() {
  const { user } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} loginHref="/login?next=/">
      <section className="home-hero">
        <div className="home-hero-bg" />
        <div className="home-hero-inner">
          <div className="home-hero-copy">
            <span className="home-kicker">✦ NUEVA PLATAFORMA · 2026</span>
            <h1>
              Cosé con propósito,
              <br />
              <em>transformá tu mundo</em>
            </h1>
            <p>
              Talleres online, moldes digitales y una comunidad de costureras que aprenden juntas.
              Descubrí la nueva plataforma VeCKA.
            </p>
            <div className="home-actions">
              <Link href="/membresias" className="lovable-button">
                Sumarme al Club →
              </Link>
              <Link href="/talleres" className="lovable-button outline">
                Ver talleres
              </Link>
            </div>
            <dl className="home-stats">
              {[
                ['5.400+', 'Alumnas activas'],
                ['48', 'Talleres online'],
                ['8', 'Años de experiencia'],
              ].map(([value, label]) => (
                <div key={label}>
                  <dt>{value}</dt>
                  <dd>{label}</dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="home-hero-media">
            <img src="/Portada-club-anual.png" alt="Vero, fundadora de VeCKA Talleres" />
            <div className="home-rating-card">
              <span>♡</span>
              <div>
                <strong>4.9 / 5.0</strong>
                <small>Calificación promedio</small>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="home-section">
        <div className="home-section-head">
          <p>Aprendé con VeCKA</p>
          <h2>Todo lo que necesitás para coser</h2>
          <span>Desde tus primeros pasos hasta técnicas profesionales.</span>
        </div>
        <div className="home-feature-grid">
          {features.map((feature) => (
            <Link href={feature.href} key={feature.title} className="home-feature-card">
              <span className="home-feature-icon">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
              <strong>{feature.meta} →</strong>
            </Link>
          ))}
        </div>
      </section>

      <section className="home-club">
        <div className="home-club-copy">
          <span>⭐ MEMBRESÍA MENSUAL</span>
          <h2>Club VeCKA — Cosé con propósito</h2>
          <p>
            Acceso ilimitado a todos los talleres del mes, molde digital exclusivo y comunidad privada.
            Un precio, todo incluido.
          </p>
          <ul>
            <li>Acceso ilimitado a talleres online</li>
            <li>Molde digital exclusivo mensual</li>
            <li>Comunidad privada + soporte</li>
          </ul>
          <Link href="/membresias" className="lovable-button">
            Ver membresías abiertas →
          </Link>
        </div>
        <div className="home-club-media">
          <img src="/Portada-club-anual.png" alt="Materiales del Club VeCKA" />
        </div>
      </section>
    </PublicSiteShell>
  )
}
