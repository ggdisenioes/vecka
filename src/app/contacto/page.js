import PublicSiteShell from '@/components/site/PublicSiteShell'
import { ButtonLink, Card, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Contacto - VeCKA',
  description: 'Canales de contacto y soporte de VeCKA Talleres.',
}

const contactCards = [
  {
    title: 'Soporte de alumnas',
    text: 'Consultas sobre acceso, compras, membresías y clases disponibles en tu cuenta.',
  },
  {
    title: 'Talleres y contenidos',
    text: 'Dudas sobre cursos, materiales, moldes y próximos lanzamientos de VeCKA.',
  },
  {
    title: 'Pagos y facturación',
    text: 'Ayuda con Mercado Pago, transferencias, cupones y confirmación de accesos.',
  },
]

const faqs = [
  ['¿Cuándo se activa mi membresía?', 'Los pagos por Mercado Pago se acreditan automáticamente. Las transferencias se revisan de forma manual.'],
  ['¿Dónde veo mis cursos?', 'Ingresá a Mi cuenta con el mismo email de compra para ver talleres, membresías y materiales disponibles.'],
  ['¿Puedo recuperar mi contraseña?', 'Sí. Desde iniciar sesión podés volver a entrar con Google o pedir ayuda si tu cuenta viene de la plataforma anterior.'],
]

export default async function ContactPage() {
  const { user, profile } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/contacto">
      <main className="vk-page">
        <div className="vk-container">
          <PageHeader
            kicker="Estamos para ayudarte"
            title="Contacto"
            lede="Centralizamos las consultas para que cada alumna encuentre rápido el camino correcto."
            actions={<ButtonLink href="/cuenta" variant="secondary">Ir a mi cuenta</ButtonLink>}
          />

          <section className="vk-action-grid">
            {contactCards.map((card) => (
              <Card key={card.title} className="vk-stack">
                <span className="vk-pill warm">VeCKA</span>
                <h2 style={{ margin: 0, fontSize: 28 }}>{card.title}</h2>
                <p style={{ margin: 0, color: 'var(--muted)' }}>{card.text}</p>
              </Card>
            ))}
          </section>

          <section className="vk-card vk-card-padded" style={{ marginTop: 22 }}>
            <div className="vk-section-heading">
              <h2>Preguntas frecuentes</h2>
            </div>
            <div className="lovable-faq-list">
              {faqs.map(([question, answer]) => (
                <details key={question}>
                  <summary><span>+</span>{question}</summary>
                  <p>{answer}</p>
                </details>
              ))}
            </div>
          </section>
        </div>
      </main>
    </PublicSiteShell>
  )
}
