import Link from 'next/link'

const NAV_ITEMS = [
  { href: '/', label: 'Inicio' },
  { href: '/membresias', label: 'Membresías' },
  { href: '/talleres', label: 'Talleres' },
  { href: '/tienda', label: 'Tienda' },
]

function HeaderCta({ user, loginHref }) {
  if (user) {
    return (
      <Link href="/cuenta" className="site-shell-button ghost">
        Mi cuenta
      </Link>
    )
  }

  return (
    <Link href={loginHref} className="site-shell-button ghost">
      Iniciar sesión
    </Link>
  )
}

export default function PublicSiteShell({ children, user = null, loginHref = '/login' }) {
  return (
    <div className="site-shell">
      <header className="site-shell-header">
        <div className="site-shell-header-inner">
          <Link href="/" className="site-shell-brand">
            <span className="site-shell-brand-mark">V</span>
            <span className="site-shell-brand-name">VeCKA</span>
          </Link>

          <nav className="site-shell-nav" aria-label="Secciones principales">
            {NAV_ITEMS.map((item) => (
              <Link key={item.href} href={item.href}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="site-shell-actions">
            <HeaderCta user={user} loginHref={loginHref} />
            <Link href="/membresias" className="site-shell-button primary">
              Sumarme al Club
            </Link>
          </div>

          <details className="site-shell-mobile-menu">
            <summary aria-label="Abrir menú">
              <span />
              <span />
              <span />
            </summary>
            <nav aria-label="Menú móvil">
              {NAV_ITEMS.map((item) => (
                <Link key={item.href} href={item.href}>
                  {item.label}
                </Link>
              ))}
              <Link href={user ? '/cuenta' : loginHref}>{user ? 'Mi cuenta' : 'Iniciar sesión'}</Link>
              <Link href="/membresias" className="mobile-primary">Sumarme al Club</Link>
            </nav>
          </details>
        </div>
      </header>

      <main className="site-shell-main">{children}</main>

      <footer className="site-shell-footer">
        <div className="site-shell-footer-inner">
          <div className="site-shell-footer-brand">
            <strong>VeCKA</strong>
            <span>Talleres online, moldes digitales y una comunidad de costureras que aprenden juntas.</span>
          </div>

          <div className="site-shell-footer-column">
            <h4>Escuela</h4>
            <nav aria-label="Escuela">
              <Link href="/membresias">Club VeCKA</Link>
              <Link href="/talleres">Talleres</Link>
              <Link href="/tienda">Moldes digitales</Link>
            </nav>
          </div>

          <div className="site-shell-footer-column">
            <h4>VeCKA</h4>
            <nav aria-label="VeCKA">
              <Link href="/">Sobre mí</Link>
              <Link href="/contacto">Contacto</Link>
              <Link href="/membresias">Preguntas frecuentes</Link>
            </nav>
          </div>
        </div>
        <div className="site-shell-footer-bottom">
          © {new Date().getFullYear()} VeCKA Talleres. Cosé con propósito.
        </div>
      </footer>
    </div>
  )
}
