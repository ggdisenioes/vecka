import PublicSiteShell from '@/components/site/PublicSiteShell'
import { ButtonLink, Card, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Checkout - VeCKA',
  description: 'Elegí cómo continuar tu compra en VeCKA.',
}

export default async function CheckoutPage() {
  const { user, profile } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/checkout">
      <main className="vk-page">
        <div className="vk-container">
          <PageHeader
            kicker="Checkout"
            title="Elegí cómo continuar"
            lede="El checkout principal de VeCKA ahora prioriza membresías y accesos nativos. La tienda completa se habilitará en una próxima etapa."
            actions={<ButtonLink href="/membresias">Ver membresías</ButtonLink>}
          />

          <section className="vk-action-grid">
            <Card className="vk-stack">
              <span className="vk-pill">Club VeCKA</span>
              <h2 style={{ margin: 0, fontSize: 30 }}>Membresía mensual o anual</h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                Acceso a talleres, contenido exclusivo y comunidad desde el flujo nativo de Mercado Pago.
              </p>
              <ButtonLink href="/membresias">Sumarme al Club</ButtonLink>
            </Card>
            <Card className="vk-stack">
              <span className="vk-pill warm">Tienda</span>
              <h2 style={{ margin: 0, fontSize: 30 }}>Moldes y productos</h2>
              <p style={{ margin: 0, color: 'var(--muted)' }}>
                La tienda está en migración visual para integrarse con la nueva cuenta y navegación.
              </p>
              <ButtonLink href="/tienda" variant="secondary">Ir a tienda</ButtonLink>
            </Card>
          </section>
        </div>
      </main>
    </PublicSiteShell>
  )
}
