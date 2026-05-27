import Link from 'next/link'

const ADMIN_NAV = [
  { href: '/admin', label: 'Panel' },
  { href: '/admin/courses', label: 'Cursos' },
  { href: '/admin/membresias', label: 'Membresías' },
  { href: '/admin/membresias/miembros', label: 'Miembros' },
  { href: '/admin/membresias/cupones', label: 'Cupones' },
  { href: '/admin/usuarios', label: 'Usuarios' },
  { href: '/admin/ajustes', label: 'Ajustes' },
]

function displayName(profile, user) {
  return profile?.display_name || profile?.full_name || user?.email?.split('@')[0] || 'VeCKA'
}

export default function AdminShell({ children, user, profile }) {
  const name = displayName(profile, user)
  const roleLabel = profile?.role === 'admin' ? 'Admin' : 'Editorial'

  return (
    <div className="admin-app-shell">
      <aside className="admin-app-sidebar">
        <Link href="/admin" className="admin-app-brand">
          <span>V</span>
          <strong>VeCKA</strong>
          <small>Panel de control</small>
        </Link>

        <nav className="admin-app-nav" aria-label="Administración">
          {ADMIN_NAV.map((item) => (
            <Link key={item.href} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="admin-app-sidebar-footer">
          <Link href="/" className="admin-app-secondary-link">Ver sitio</Link>
          <Link href="/cuenta" className="admin-app-secondary-link">Mi cuenta</Link>
          <Link href="/logout" className="admin-app-secondary-link">Cerrar sesión</Link>
        </div>
      </aside>

      <div className="admin-app-main">
        <header className="admin-app-topbar">
          <div>
            <p>Panel admin</p>
            <strong>{name}</strong>
          </div>
          <div className="admin-app-topbar-actions">
            <span className="vk-pill neutral">{roleLabel}</span>
            <Link href="/cuenta" className="vk-button secondary">Mi cuenta</Link>
            <Link href="/" className="vk-button subtle">Ver sitio</Link>
          </div>
          <details className="admin-app-mobile-menu">
            <summary aria-label="Abrir navegación admin">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Administración móvil">
              {ADMIN_NAV.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href="/">Ver sitio</Link>
              <Link href="/cuenta">Mi cuenta</Link>
              <Link href="/logout">Cerrar sesión</Link>
            </nav>
          </details>
        </header>

        <div className="admin-app-content">
          {children}
        </div>
      </div>
    </div>
  )
}
