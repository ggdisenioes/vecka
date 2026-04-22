import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';

/* ── Social icon SVGs ── */
const YT = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/></svg>;
const IG = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/></svg>;
const TK = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 3h-3.2v11.4a2.4 2.4 0 11-2.4-2.4c.2 0 .5 0 .7.1V8.8a5.7 5.7 0 105.7 5.7V8.1a8.7 8.7 0 005.1 1.6V6.4A5.2 5.2 0 0119.6 3z"/></svg>;
const FB = () => <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/></svg>;

function SocialBtn({ children, label }) {
  const [hov, setHov] = useState(false);
  return (
    <a href="#" aria-label={label}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 44, height: 44, borderRadius: '50%', background: hov ? '#5e9e8a' : 'rgba(255,255,255,.1)', border: `1.5px solid ${hov ? '#5e9e8a' : 'rgba(255,255,255,.18)'}`, color: hov ? '#fff' : '#97ceb8', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .22s cubic-bezier(.22,1,.36,1)', textDecoration: 'none', transform: hov ? 'translateY(-3px) scale(1.08)' : 'none' }}>
      {children}
    </a>
  );
}

function FooterLink({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '5px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: hov ? '#97ceb8' : 'rgba(255,255,255,.55)', transition: 'color .15s', display: 'flex', alignItems: 'center', gap: 6 }}>
      {hov && <span style={{ display: 'inline-block', width: 5, height: 5, borderRadius: '50%', background: '#97ceb8', animation: 'bounceIn .2s' }} />}
      {children}
    </button>
  );
}

/* Floating decorative leaf SVG */
function Leaf({ style }) {
  return (
    <svg viewBox="0 0 60 80" fill="none" style={style}>
      <path d="M30 75 C10 60 2 40 8 20 C14 5 30 2 30 2 C30 2 46 5 52 20 C58 40 50 60 30 75Z" fill="rgba(151,206,184,.18)" stroke="rgba(151,206,184,.25)" strokeWidth="1"/>
    </svg>
  );
}

export default function Footer() {
  const { navigate } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const px = isMobile ? '20px' : isTablet ? '32px' : '64px';

  /* Marquee items */
  const marqueeItems = ['🌿 5.400 alumnas', '✂️ 48 talleres', '⭐ 4.9 calificación', '🧵 200+ moldes', '💚 8 años de experiencia', '📍 Buenos Aires', '🌿 5.400 alumnas', '✂️ 48 talleres', '⭐ 4.9 calificación', '🧵 200+ moldes', '💚 8 años de experiencia', '📍 Buenos Aires'];

  return (
    <footer ref={ref} style={{ background: 'linear-gradient(160deg, #1a3d2e 0%, #152e24 60%, #1e3830 100%)', color: '#fff', overflow: 'hidden', position: 'relative' }}>

      {/* Decorative floating leaves */}
      <Leaf style={{ position: 'absolute', top: 60, right: 80, width: 90, height: 120, animation: 'float 7s ease-in-out infinite', opacity: .6, pointerEvents: 'none' }} />
      <Leaf style={{ position: 'absolute', bottom: 120, left: 40, width: 60, height: 80, animation: 'floatB 9s ease-in-out infinite', opacity: .4, pointerEvents: 'none', transform: 'rotate(-30deg)' }} />
      <Leaf style={{ position: 'absolute', top: 200, left: '45%', width: 40, height: 55, animation: 'float 11s ease-in-out infinite 2s', opacity: .25, pointerEvents: 'none', transform: 'rotate(15deg)' }} />

      {/* Top wave border */}
      <div style={{ height: 6, background: 'linear-gradient(90deg, #5e9e8a, #97ceb8, #c5dfce, #5e9e8a, #97ceb8)', backgroundSize: '300% 100%', animation: 'waveMove 4s linear infinite' }} />

      {/* Newsletter strip */}
      <div style={{ background: 'rgba(255,255,255,.06)', borderBottom: '1px solid rgba(255,255,255,.08)', padding: isMobile ? '32px 20px' : '44px 64px', ...fadeUpStyle(visible, 0) }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: isTablet ? 'column' : 'row', alignItems: isTablet ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 18, animation: 'heartbeat 2.5s ease-in-out infinite' }}>🌿</span>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#97ceb8' }}>NEWSLETTER</div>
            </div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, fontWeight: 600, color: '#fff', margin: 0, lineHeight: 1.2 }}>
              Novedades, tutoriales y ofertas exclusivas
            </h3>
          </div>
          {subscribed ? (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#97ceb8', background: 'rgba(151,206,184,.12)', border: '1px solid rgba(151,206,184,.3)', borderRadius: 12, padding: '14px 22px', animation: 'bounceIn .4s' }}>
              ¡Gracias! 🌿 Te avisamos con las novedades
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 0, width: isTablet ? '100%' : 380, maxWidth: '100%' }}>
              <input placeholder="tu@email.com" value={email} onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, padding: '13px 18px', border: '1.5px solid rgba(151,206,184,.3)', borderRight: 'none', borderRadius: '10px 0 0 10px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: 'none', background: 'rgba(255,255,255,.08)', color: '#fff' }} />
              <button onClick={() => { if (email) setSubscribed(true); }}
                style={{ padding: '13px 22px', border: 'none', background: '#5e9e8a', color: '#fff', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, transition: 'background .2s', whiteSpace: 'nowrap' }}
                onMouseEnter={e => e.currentTarget.style.background = '#4a7d6e'}
                onMouseLeave={e => e.currentTarget.style.background = '#5e9e8a'}>
                Suscribirme →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Marquee ticker */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,.07)', overflow: 'hidden', padding: '12px 0', background: 'rgba(0,0,0,.08)' }}>
        <div style={{ display: 'flex', gap: 56, animation: 'marquee 22s linear infinite', whiteSpace: 'nowrap', width: 'max-content' }}>
          {marqueeItems.map((item, i) => (
            <span key={i} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'rgba(151,206,184,.8)', letterSpacing: '0.06em' }}>{item}</span>
          ))}
        </div>
      </div>

      {/* Main footer content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 20px 32px' : `52px ${px} 36px` }}>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '2.2fr 1fr 1fr 1.4fr', gap: isMobile ? 36 : 40, ...fadeUpStyle(visible, 0.1) }}>

          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <div style={{ position: 'relative' }}>
                <img src="/logo-VeCKA.jpg" alt="VeCKA" style={{ height: 54, width: 54, objectFit: 'cover', borderRadius: 12, display: 'block' }} />
                <div style={{ position: 'absolute', inset: -2, borderRadius: 14, border: '1.5px solid rgba(151,206,184,.35)', pointerEvents: 'none' }} />
              </div>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, color: '#fff', lineHeight: 1 }}>VeCKA</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(151,206,184,.7)', letterSpacing: '0.1em', marginTop: 2 }}>TALLERES DE COSTURA</div>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.75, color: 'rgba(255,255,255,.55)', maxWidth: 280, marginBottom: 22 }}>
              Talleres de costura y moldería para mujeres reales. Con propósito, con calidad, con amor por el oficio.
            </p>

            {/* Contact */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 22 }}>
              {[['✉', 'consultas@vecka.com.ar'], ['📞', '11 7363 2891'], ['📍', 'Belaustegui 411, Buenos Aires']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                  <span style={{ fontSize: 14, flexShrink: 0 }}>{icon}</span>{text}
                </div>
              ))}
            </div>

            {/* Social */}
            <div style={{ display: 'flex', gap: 10 }}>
              <SocialBtn label="YouTube"><YT /></SocialBtn>
              <SocialBtn label="Instagram"><IG /></SocialBtn>
              <SocialBtn label="TikTok"><TK /></SocialBtn>
              <SocialBtn label="Facebook"><FB /></SocialBtn>
            </div>
          </div>

          {/* Aprende */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#97ceb8', marginBottom: 18, marginTop: 0 }}>Aprende</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[['Escuela VeCKA', 'escuela'], ['Club VeCKA', 'escuela'], ['Talleres Online', 'escuela'], ['Sobre Mí', 'sobre'], ['Blog', 'blog']].map(([l, p]) => (
                <FooterLink key={l} onClick={() => navigate(p)}>{l}</FooterLink>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#97ceb8', marginBottom: 18, marginTop: 0 }}>Tienda</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[['Moldes Digitales', 'tienda'], ['Moldes en Papel', 'tienda'], ['Mercería VeCKA', 'tienda'], ['Novedades', 'tienda'], ['Contacto', 'contacto']].map(([l, p]) => (
                <FooterLink key={l} onClick={() => navigate(p)}>{l}</FooterLink>
              ))}
            </div>
          </div>

          {/* Legal + pagos */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#97ceb8', marginBottom: 18, marginTop: 0 }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {['Términos y condiciones de Venta', 'Política de privacidad', 'Política de cookies', 'Aviso Legal'].map(l => (
                <FooterLink key={l} onClick={() => {}}>{l}</FooterLink>
              ))}
            </div>
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(151,206,184,.6)', marginBottom: 10, fontWeight: 700, letterSpacing: '0.1em' }}>MÉTODOS DE PAGO</div>
              <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
                {['MercadoPago', 'MODO', 'PayPal'].map(p => (
                  <span key={p} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, background: 'rgba(255,255,255,.07)', border: '1px solid rgba(151,206,184,.2)', padding: '5px 10px', borderRadius: 6, color: 'rgba(151,206,184,.7)', fontWeight: 600 }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div style={{ borderTop: '1px solid rgba(255,255,255,.08)', marginTop: 44, paddingTop: 22, display: 'flex', flexDirection: isTablet ? 'column' : 'row', justifyContent: 'space-between', alignItems: isTablet ? 'flex-start' : 'center', gap: 10, ...fadeUpStyle(visible, 0.2) }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.35)' }}>
            © 2025 GG Diseño · Todos los derechos reservados
          </span>
          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'rgba(151,206,184,.5)', fontStyle: 'italic' }}>
            Hecho con 🧵 amor en Buenos Aires
          </span>
        </div>
      </div>
    </footer>
  );
}
