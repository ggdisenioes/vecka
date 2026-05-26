import { redirect } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth } from '@/lib/auth'
import { getSafeInternalPath } from '@/lib/auth-redirects'
import ChangePasswordForm from './ChangePasswordForm'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Cambiar contraseña - VeCKA',
}

export default async function ChangePasswordPage({ searchParams }) {
  const sp = await searchParams
  const nextPath = getSafeInternalPath(sp?.next, '/cuenta')
  const { user } = await getCurrentAuth()

  if (!user) {
    redirect(`/login?next=${encodeURIComponent('/cambiar-contrasena')}`)
  }

  return (
    <PublicSiteShell user={user} loginHref="/login?next=/cambiar-contrasena">
      <main className="lovable-login">
        <h1>Cambiá tu contraseña</h1>
        <p className="lovable-login-subtitle">
          Por seguridad, reemplazá la contraseña temporal por una propia antes de entrar a tu cuenta.
        </p>
        <ChangePasswordForm nextPath={nextPath} />
      </main>
    </PublicSiteShell>
  )
}
