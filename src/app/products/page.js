import PublicSiteShell from '@/components/site/PublicSiteShell'
import { ButtonLink, Card, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Productos - VeCKA',
  description: 'Moldes digitales, moldes impresos y recursos de mercería de VeCKA.',
}

const categories = [
  ['Moldes digitales', 'PDFs descargables listos para imprimir y coser desde casa.'],
  ['Moldes en papel', 'Piezas físicas para quienes prefieren trabajar directo sobre el molde.'],
  ['Mercería curada', 'Materiales seleccionados para acompañar los talleres y proyectos.'],
]

export default async function ProductsPage() {
  const { user, profile } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/products">
      <main className="vk-page">
        <div className="vk-container">
          <PageHeader
            kicker="Tienda"
            title="Productos VeCKA"
            lede="La tienda se está consolidando dentro de la nueva plataforma para que conviva con membresías, talleres y cuenta personal."
            actions={<ButtonLink href="/tienda">Ir a tienda</ButtonLink>}
          />

          <section className="vk-action-grid">
            {categories.map(([title, text]) => (
              <Card key={title} className="vk-stack">
                <span className="vk-pill warm">Catálogo</span>
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
