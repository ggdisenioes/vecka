import Link from 'next/link'

function HeaderCta({ user, loginHref }) {
  if (user) {
    return (
      <Link href="/cuenta" className="site-shell-cta">
        Mi cuenta
      </Link>
    )
  }

  return (
    <Link href={loginHref} className="site-shell-cta">
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
            <img src="/logo-VeCKA.jpg" alt="VeCKA" className="site-shell-brand-mark" />
            <div className="site-shell-brand-copy">
              <strong>VeCKA</strong>
              <span>Talleres de costura</span>
            </div>
          </Link>

          <HeaderCta user={user} loginHref={loginHref} />
        </div>
      </header>

      <main className="site-shell-main">{children}</main>

      <footer className="site-shell-footer">
        <div className="site-shell-footer-inner">
          <div className="site-shell-footer-brand">
            <strong>VeCKA</strong>
            <span>Talleres, membresías y recursos de costura.</span>
          </div>

          <nav className="site-shell-footer-nav" aria-label="Secciones principales">
            <Link href="/">Inicio</Link>
            <Link href="/talleres">Talleres</Link>
            <Link href="/tienda">Tienda</Link>
            <Link href="/membresias">Membresías</Link>
            <Link href="/contacto">Contacto</Link>
          </nav>
        </div>
      </footer>
    </div>
  )
}
