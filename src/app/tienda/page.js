import Link from 'next/link'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Tienda — VeCKA',
  description: 'Moldes digitales, moldes impresos y mercería seleccionada por VeCKA.',
}

export default async function TiendaPage() {
  const { user, profile } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/tienda">
      <main className="lovable-soon">
        <p>Próximamente</p>
        <h1>Tienda VeCKA</h1>
        <p>
          Moldes digitales, moldes en papel y mercería seleccionada. Lo lanzamos en la próxima fase.
        </p>
        <Link href="/" className="lovable-button outline" style={{ width: 'auto', paddingInline: 22 }}>
          Volver al inicio
        </Link>
      </main>
    </PublicSiteShell>
  )
}
