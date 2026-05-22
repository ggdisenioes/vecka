import LoginScreen from './LoginScreen'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Iniciar sesión — VeCKA',
  description: 'Ingresá a tu cuenta de VeCKA.',
}

export default async function LoginPage({ searchParams }) {
  const nextPath = typeof searchParams?.next === 'string' && searchParams.next.startsWith('/')
    ? searchParams.next
    : '/'

  return (
    <LoginScreen
      nextPath={nextPath}
      initialError={typeof searchParams?.error === 'string' ? searchParams.error : null}
      initialSuccess={typeof searchParams?.success === 'string' ? searchParams.success : null}
    />
  )
}
