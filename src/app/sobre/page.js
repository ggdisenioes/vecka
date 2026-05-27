import PublicSiteShell from '@/components/site/PublicSiteShell'
import { ButtonLink, Card, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Sobre VeCKA - Costura y talleres online',
  description: 'Conocé la propuesta de VeCKA Talleres, una escuela cálida para aprender costura con propósito.',
}

const principles = [
  ['Aprendizaje claro', 'Clases online, materiales y recorridos pensados para avanzar sin ruido.'],
  ['Oficio compartido', 'Una comunidad donde coser también es encontrarse con otras alumnas.'],
  ['Diseño aplicable', 'Moldes, recursos y técnicas para llevar cada aprendizaje a prendas reales.'],
]

export default async function AboutPage() {
  const { user, profile } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/sobre">
      <main className="vk-page">
        <div className="vk-container">
          <PageHeader
            kicker="La escuela"
            title="VeCKA es costura con propósito"
            lede="Una plataforma para aprender a coser con una guía cercana, recursos concretos y una estética que sigue siendo artesanal y cálida."
            actions={<ButtonLink href="/membresias">Sumarme al Club</ButtonLink>}
          />

          <section className="membership-detail-hero">
            <div className="membership-detail-hero-copy">
              <span className="vk-pill">VeCKA Talleres</span>
              <h2>Una forma más ordenada de aprender, sin perder cercanía.</h2>
              <p>
                La nueva plataforma reúne talleres, membresías, moldes y cuenta personal en un mismo lugar.
                El objetivo es que cada alumna pueda entrar, seguir su recorrido y encontrar sus materiales con menos fricción.
              </p>
            </div>
            <div className="home-hero-media">
              <img src="/Portada-club-anual.png" alt="VeCKA Talleres" />
            </div>
          </section>

          <section className="vk-action-grid" style={{ marginTop: 22 }}>
            {principles.map(([title, text]) => (
              <Card key={title} className="vk-stack">
                <span className="vk-pill warm">Principio</span>
                <h2 style={{ margin: 0, fontSize: 28 }}>{title}</h2>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{text}</p>
              </Card>
            ))}
          </section>
        </div>
      </main>
    </PublicSiteShell>
  )
}
