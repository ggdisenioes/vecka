import Link from 'next/link'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Talleres — VeCKA',
  description: 'Talleres online de costura y moldería de VeCKA.',
}

export default async function CoursesPage() {
  const { user, profile } = await getCurrentAuth()

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/talleres">
      <main className="lovable-soon">
        <p>Próximamente</p>
        <h1>Talleres online</h1>
        <p>
          Estamos preparando este apartado. Mientras tanto, accedé a todos los talleres del mes con el Club VeCKA.
        </p>
        <Link href="/membresias" className="lovable-button" style={{ width: 'auto', paddingInline: 22 }}>
          Ver membresías
        </Link>
      </main>
    </PublicSiteShell>
  )
}
