import { useState, useEffect } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from './Icon';
import { Btn } from './Primitives';

function NavLink({ label, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', color: hov ? '#5e9e8a' : 'oklch(30% 0.018 50)', padding: '6px 12px', borderRadius: 6, transition: 'all .15s' }}
    >
      {label}
    </button>
  );
}

export default function Header() {
  const { navigate, user, cart, setCartOpen, openAuthModal, currency, setCurrency, logout } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const [scrolled, setScrolled] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navItems = [
    { label: 'INICIO', page: 'home' },
    { label: 'ESCUELA', page: 'escuela' },
    { label: 'TIENDA', page: 'tienda' },
    { label: 'BLOG', page: 'blog' },
    { label: 'SOBRE MÍ', page: 'sobre' },
    { label: 'CONTACTO', page: 'contacto' },
  ];

  return (
    <>
      <header style={{
        position: 'fixed', top: 0, left: 0, right: 0, zIndex: 1000,
        background: scrolled ? 'rgba(255,255,255,0.97)' : '#fff',
        backdropFilter: scrolled ? 'blur(12px)' : 'none',
        borderBottom: '1px solid oklch(90% 0.012 60)',
        boxShadow: scrolled ? '0 2px 20px rgba(0,0,0,.07)' : 'none',
        transition: 'all .3s',
      }}>
        {/* Promo bar */}
        {!isMobile && (
          <div style={{ background: '#c5dfce', color: '#2a4a3e', textAlign: 'center', padding: '7px 16px', fontSize: 12, fontFamily: "'DM Sans', sans-serif", letterSpacing: '0.03em', fontWeight: 500 }}>
            10% de descuento pagando por transferencia · 3 cuotas fijas a partir de $50.000
          </div>
        )}

        {/* Main nav */}
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '0 16px' : '0 24px', display: 'flex', alignItems: 'center', height: isMobile ? 60 : 68, gap: isMobile ? 12 : 32 }}>
          {/* Logo */}
          <div onClick={() => { navigate('home'); setMobileMenuOpen(false); }} style={{ cursor: 'pointer', flexShrink: 0 }}>
            <img src="/logo-VeCKA.jpg" alt="VeCKA Talleres" style={{ height: isMobile ? 40 : 50, width: isMobile ? 40 : 50, objectFit: 'cover', borderRadius: 8, display: 'block' }} />
          </div>

          {/* Desktop nav links */}
          {!isTablet && (
            <nav style={{ display: 'flex', gap: 4, flex: 1, justifyContent: 'center' }}>
              {navItems.map(({ label, page: p }) => (
                <NavLink key={p} label={label} onClick={() => navigate(p)} />
              ))}
            </nav>
          )}

          {/* Right actions */}
          <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? 8 : 12, marginLeft: 'auto' }}>
            {/* Currency toggle — hide on mobile */}
            {!isMobile && (
              <div style={{ display: 'flex', background: 'oklch(94% 0.012 60)', borderRadius: 6, overflow: 'hidden' }}>
                {['ARS', 'USD'].map(c => (
                  <button key={c} onClick={() => setCurrency(c)}
                    style={{ padding: '5px 10px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 11, fontFamily: "'DM Sans', sans-serif", background: currency === c ? '#5e9e8a' : 'transparent', color: currency === c ? '#fff' : 'oklch(52% 0.018 50)', transition: 'all .15s' }}>
                    {c}
                  </button>
                ))}
              </div>
            )}

            {/* Cart */}
            <button onClick={() => setCartOpen(true)}
              style={{ position: 'relative', background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: 'oklch(18% 0.022 50)' }}>
              <Icon name="cart" size={isMobile ? 20 : 22} />
              {cart.length > 0 && (
                <span style={{ position: 'absolute', top: 2, right: 2, background: '#5e9e8a', color: '#fff', borderRadius: '50%', width: 16, height: 16, fontSize: 9, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
                  {cart.length}
                </span>
              )}
            </button>

            {/* User — desktop */}
            {!isTablet && (
              <div style={{ position: 'relative' }}>
                {user ? (
                  <button onClick={() => setUserMenuOpen(!userMenuOpen)}
                    style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#f0dee7', border: 'none', cursor: 'pointer', padding: '7px 12px', borderRadius: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#5e9e8a', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, fontFamily: "'DM Sans', sans-serif" }}>
                      {user.avatar}
                    </div>
                    <Icon name="chevronDown" size={14} color="#5e9e8a" />
                  </button>
                ) : (
                  <Btn size="sm" onClick={() => openAuthModal('login')}>Iniciar sesión</Btn>
                )}
                {userMenuOpen && user && (
                  <div style={{ position: 'absolute', right: 0, top: '110%', background: '#fff', border: '1px solid oklch(90% 0.012 60)', borderRadius: 12, boxShadow: '0 12px 40px rgba(0,0,0,.12)', minWidth: 180, overflow: 'hidden', zIndex: 999 }}>
                    <div style={{ padding: '12px 16px', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
                      <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "'DM Sans', sans-serif" }}>{user.name}</div>
                      <div style={{ fontSize: 11, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif" }}>{user.role === 'admin' ? 'Administradora' : 'Alumna'}</div>
                    </div>
                    {user.role === 'admin'
                      ? <DropItem icon="settings" label="Panel Admin" onClick={() => { navigate('admin'); setUserMenuOpen(false); }} />
                      : <>
                          <DropItem icon="user" label="Mi Cuenta" onClick={() => { navigate('cuenta'); setUserMenuOpen(false); }} />
                          <DropItem icon="book" label="Mis Cursos" onClick={() => { navigate('cuenta'); setUserMenuOpen(false); }} />
                        </>
                    }
                    <DropItem icon="logout" label="Cerrar sesión" onClick={() => { logout(); setUserMenuOpen(false); }} danger />
                  </div>
                )}
              </div>
            )}

            {/* Hamburger — tablet/mobile */}
            {isTablet && (
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 8, borderRadius: 8, color: 'oklch(18% 0.022 50)' }}>
                <Icon name={mobileMenuOpen ? 'x' : 'menu'} size={22} />
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {isTablet && mobileMenuOpen && (
        <>
          <div onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 998 }} />
          <div style={{ position: 'fixed', top: isMobile ? 60 : 68, left: 0, right: 0, background: '#fff', zIndex: 999, borderBottom: '1px solid oklch(90% 0.012 60)', boxShadow: '0 8px 32px rgba(0,0,0,.1)', padding: '8px 0 20px' }}>
            {navItems.map(({ label, page: p }) => (
              <button key={p} onClick={() => { navigate(p); setMobileMenuOpen(false); }}
                style={{ display: 'block', width: '100%', padding: '14px 24px', border: 'none', background: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, letterSpacing: '0.06em', color: 'oklch(22% 0.022 50)', textAlign: 'left', borderBottom: '1px solid oklch(95% 0.01 60)' }}>
                {label}
              </button>
            ))}
            <div style={{ padding: '16px 24px 4px', display: 'flex', gap: 12, alignItems: 'center' }}>
              {/* Currency */}
              <div style={{ display: 'flex', background: 'oklch(94% 0.012 60)', borderRadius: 6, overflow: 'hidden' }}>
                {['ARS', 'USD'].map(c => (
                  <button key={c} onClick={() => setCurrency(c)}
                    style={{ padding: '7px 14px', border: 'none', cursor: 'pointer', fontWeight: 600, fontSize: 12, fontFamily: "'DM Sans', sans-serif", background: currency === c ? '#5e9e8a' : 'transparent', color: currency === c ? '#fff' : 'oklch(52% 0.018 50)', transition: 'all .15s' }}>
                    {c}
                  </button>
                ))}
              </div>
              {user ? (
                <div style={{ display: 'flex', gap: 8, flex: 1 }}>
                  <Btn
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      navigate(user.role === 'admin' ? 'admin' : 'cuenta');
                      setMobileMenuOpen(false);
                    }}
                  >
                    {user.role === 'admin' ? 'Panel admin' : 'Mi cuenta'}
                  </Btn>
                  <Btn size="sm" variant="ghost" onClick={() => { logout(); setMobileMenuOpen(false); }}>Salir</Btn>
                </div>
              ) : (
                <Btn size="sm" onClick={() => { openAuthModal('login'); setMobileMenuOpen(false); }}>Iniciar sesión</Btn>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}

function DropItem({ icon, label, onClick, danger }) {
  const [hov, setHov] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 16px', background: hov ? 'oklch(96% 0.012 60)' : 'transparent', border: 'none', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: danger ? '#ef4444' : 'oklch(18% 0.022 50)', textAlign: 'left', transition: 'background .15s' }}
    >
      <Icon name={icon} size={15} color={danger ? '#ef4444' : 'oklch(52% 0.018 50)'} />
      {label}
    </button>
  );
}
