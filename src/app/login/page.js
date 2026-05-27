import { redirect } from 'next/navigation'
import LoginScreen from './LoginScreen'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getPostLoginPath, getSafeInternalPath } from '@/lib/auth-redirects'
import { getCurrentAuth } from '@/lib/auth'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Iniciar sesión — VeCKA',
  description: 'Ingresá a tu cuenta de VeCKA.',
}

export default async function LoginPage({ searchParams }) {
  const sp = await searchParams
  const requestedPath = sp?.next || sp?.redirect
  const nextPath = getSafeInternalPath(requestedPath, '/')
  const { user, profile } = await getCurrentAuth()

  if (user) {
    redirect(getPostLoginPath(profile?.role || 'student', nextPath))
  }

  return (
    <PublicSiteShell user={user} loginHref={`/login?next=${encodeURIComponent(nextPath)}`}>
      <LoginScreen
        nextPath={nextPath}
        initialError={typeof sp?.error === 'string' ? sp.error : null}
        initialSuccess={typeof sp?.success === 'string' ? sp.success : null}
        initialMode={typeof sp?.mode === 'string' ? sp.mode : 'login'}
      />
    </PublicSiteShell>
  )
}
