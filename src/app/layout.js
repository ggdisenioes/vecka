import './globals.css'
import Link from 'next/link'
import { signOut } from '@/app/auth/actions'
import { getCurrentAuth } from '@/lib/auth'

export const metadata = {
  title: 'Vecka Studio',
  description: 'Plataforma full-stack para cursos, clases y productos de Vecka.',
}

const navigation = [
  { href: '/', label: 'Inicio' },
  { href: '/courses', label: 'Cursos' },
  { href: '/products', label: 'Productos' },
  { href: '/admin', label: 'Admin' },
]

export default async function RootLayout({ children }) {
  const { user, profile } = await getCurrentAuth()

  return (
    <html lang="es">
      <body>
        <header className="topbar">
          <div className="topbar-inner">
            <Link className="brand" href="/">
              <span className="brand-mark">Vecka Studio</span>
              <span className="brand-copy">Next.js + Supabase LMS foundation</span>
            </Link>
            <nav className="nav">
              {navigation.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              {user ? (
                <form action={signOut}>
                  <button className="btn btn-secondary" type="submit">
                    {profile?.role || 'user'} · salir
                  </button>
                </form>
              ) : (
                <Link className="btn btn-secondary" href="/login">
                  Ingresar
                </Link>
              )}
            </nav>
          </div>
        </header>
        {children}
      </body>
    </html>
  )
}
