import PublicSiteShell from '@/components/site/PublicSiteShell'
import { ButtonLink, Card, EmptyState, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Blog - VeCKA',
  description: 'Ideas, recursos y novedades de VeCKA Talleres.',
}

const sections = [
  ['Novedades del Club', 'Aperturas, contenidos mensuales y beneficios para socias.'],
  ['Guías de costura', 'Consejos prácticos para preparar materiales, moldes y terminaciones.'],
  ['Inspiración VeCKA', 'Ideas para transformar cada taller en prendas con identidad propia.'],
]

export default async function BlogPage() {
  const { user, profile } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/blog">
      <main className="vk-page">
        <div className="vk-container">
          <PageHeader
            kicker="Blog"
            title="Recursos y novedades"
            lede="Este espacio va a reunir contenidos editoriales de VeCKA sin salir de la nueva experiencia."
            actions={<ButtonLink href="/membresias" variant="secondary">Ver membresías</ButtonLink>}
          />

          <section className="vk-action-grid">
            {sections.map(([title, text]) => (
              <Card key={title} className="vk-stack">
                <span className="vk-pill neutral">Próximamente</span>
                <h2 style={{ margin: 0, fontSize: 28 }}>{title}</h2>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{text}</p>
              </Card>
            ))}
          </section>

          <EmptyState style={{ marginTop: 22 }}>
            El blog se habilitará en una próxima etapa. Mientras tanto, las novedades principales estarán en membresías.
          </EmptyState>
        </div>
      </main>
    </PublicSiteShell>
  )
}
