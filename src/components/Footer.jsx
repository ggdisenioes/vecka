import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';

const YT = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.5 6.2a3 3 0 00-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 00.5 6.2 31.5 31.5 0 000 12a31.5 31.5 0 00.5 5.8 3 3 0 002.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 002.1-2.1A31.5 31.5 0 0024 12a31.5 31.5 0 00-.5-5.8zM9.75 15.5V8.5l6.25 3.5-6.25 3.5z"/>
  </svg>
);
const IG = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="2" width="20" height="20" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none"/>
  </svg>
);
const TK = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M19.6 3h-3.2v11.4a2.4 2.4 0 11-2.4-2.4c.2 0 .5 0 .7.1V8.8a5.7 5.7 0 105.7 5.7V8.1a8.7 8.7 0 005.1 1.6V6.4A5.2 5.2 0 0119.6 3z"/>
  </svg>
);
const FB = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
    <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z"/>
  </svg>
);

function SocialBtn({ children, href }) {
  const [hov, setHov] = useState(false);
  return (
    <a href={href || '#'} target="_blank" rel="noopener noreferrer"
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ width: 42, height: 42, borderRadius: '50%', background: hov ? '#5e9e8a' : 'oklch(22% 0.018 50)', border: `1px solid ${hov ? '#5e9e8a' : 'oklch(28% 0.015 50)'}`, color: hov ? '#fff' : 'oklch(65% 0.01 60)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .2s', textDecoration: 'none' }}>
      {children}
    </a>
  );
}

function FooterLink({ children, onClick }) {
  const [hov, setHov] = useState(false);
  return (
    <button onClick={onClick}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', padding: '5px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: hov ? '#97ceb8' : 'oklch(62% 0.01 60)', transition: 'color .15s' }}>
      {children}
    </button>
  );
}

export default function Footer() {
  const { navigate } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const px = isMobile ? '20px' : isTablet ? '32px' : '64px';

  return (
    <footer ref={ref} style={{ background: 'oklch(13% 0.02 50)', color: '#fff', overflow: 'hidden' }}>
      {/* Newsletter strip */}
      <div style={{
        background: 'linear-gradient(135deg, #5e9e8a, #3d7a68)',
        padding: isMobile ? '32px 20px' : '44px 64px',
        ...fadeUpStyle(visible, 0),
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'flex', flexDirection: isTablet ? 'column' : 'row', alignItems: isTablet ? 'flex-start' : 'center', justifyContent: 'space-between', gap: 24 }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.18em', color: '#c5dfce', marginBottom: 8 }}>★ NEWSLETTER</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, fontWeight: 600, color: '#fff', margin: 0 }}>
              Recibí novedades, tutoriales y ofertas
            </h3>
          </div>
          {subscribed ? (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#c5dfce', background: 'rgba(255,255,255,.15)', borderRadius: 10, padding: '12px 22px' }}>
              ¡Gracias! Te avisamos con las novedades 🌿
            </div>
          ) : (
            <div style={{ display: 'flex', gap: 0, flexShrink: 0, width: isTablet ? '100%' : 400, maxWidth: '100%' }}>
              <input
                placeholder="tu@email.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ flex: 1, padding: '13px 18px', border: 'none', borderRadius: '10px 0 0 10px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, outline: 'none', background: 'rgba(255,255,255,.15)', color: '#fff', '::placeholder': { color: 'rgba(255,255,255,.5)' } }}
              />
              <button
                onClick={() => { if (email) setSubscribed(true); }}
                style={{ padding: '13px 22px', border: 'none', background: 'oklch(13% 0.02 50)', color: '#fff', borderRadius: '0 10px 10px 0', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, whiteSpace: 'nowrap' }}>
                Suscribirme
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main footer */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '48px 20px 32px' : `56px ${px} 40px` }}>
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr 1fr' : '2.2fr 1fr 1fr 1.4fr',
          gap: isMobile ? 36 : 40,
          ...fadeUpStyle(visible, 0.1),
        }}>
          {/* Brand column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
              <img src="/logo-VeCKA.jpg" alt="VeCKA Talleres" style={{ height: 52, width: 52, objectFit: 'cover', borderRadius: 10 }} />
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 600, color: '#fff', lineHeight: 1 }}>VeCKA</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.01 60)', letterSpacing: '0.08em' }}>Talleres de Costura</div>
              </div>
            </div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.75, color: 'oklch(60% 0.01 60)', maxWidth: 280, marginBottom: 24 }}>
              Talleres de costura y moldería para mujeres reales. Con propósito, con calidad, con amor por el oficio.
            </p>
            {/* Contact info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
              {[
                ['✉', 'consultas@vecka.com.ar'],
                ['📞', '11 7363 2891'],
                ['📍', 'Belaustegui 411, Buenos Aires'],
              ].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(60% 0.01 60)' }}>
                  <span style={{ fontSize: 14 }}>{icon}</span> {text}
                </div>
              ))}
            </div>
            {/* Social icons */}
            <div style={{ display: 'flex', gap: 10 }}>
              <SocialBtn><YT /></SocialBtn>
              <SocialBtn><IG /></SocialBtn>
              <SocialBtn><TK /></SocialBtn>
              <SocialBtn><FB /></SocialBtn>
            </div>
          </div>

          {/* Aprende */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'oklch(50% 0.01 60)', marginBottom: 18, marginTop: 0 }}>Aprende</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[['Escuela VeCKA', 'escuela'], ['Club VeCKA', 'escuela'], ['Talleres Online', 'escuela'], ['Sobre Mí', 'sobre']].map(([label, p]) => (
                <FooterLink key={label} onClick={() => navigate(p)}>{label}</FooterLink>
              ))}
            </div>
          </div>

          {/* Tienda */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'oklch(50% 0.01 60)', marginBottom: 18, marginTop: 0 }}>Tienda</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {[['Moldes Digitales', 'tienda'], ['Moldes en Papel', 'tienda'], ['Mercería', 'tienda'], ['Blog', 'blog'], ['Contacto', 'contacto']].map(([label, p]) => (
                <FooterLink key={label} onClick={() => navigate(p)}>{label}</FooterLink>
              ))}
            </div>
          </div>

          {/* Legal */}
          <div>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'oklch(50% 0.01 60)', marginBottom: 18, marginTop: 0 }}>Legal</h4>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {['Términos y condiciones de Venta', 'Política de privacidad', 'Política de cookies', 'Aviso Legal'].map(label => (
                <FooterLink key={label} onClick={() => {}}>{label}</FooterLink>
              ))}
            </div>
            {/* Payment methods */}
            <div style={{ marginTop: 24 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(42% 0.01 60)', marginBottom: 10, fontWeight: 600, letterSpacing: '0.06em' }}>MÉTODOS DE PAGO</div>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                {['MercadoPago', 'MODO', 'PayPal'].map(p => (
                  <span key={p} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, background: 'oklch(20% 0.01 50)', border: '1px solid oklch(26% 0.01 50)', padding: '5px 10px', borderRadius: 6, color: 'oklch(58% 0.01 60)', fontWeight: 500 }}>{p}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Divider + copyright */}
        <div style={{ borderTop: '1px solid oklch(20% 0.012 50)', marginTop: 48, paddingTop: 24, display: 'flex', flexDirection: isTablet ? 'column' : 'row', justifyContent: 'space-between', alignItems: isTablet ? 'flex-start' : 'center', gap: 12, ...fadeUpStyle(visible, 0.2) }}>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(42% 0.01 60)' }}>
            © 2025 GG Diseño · Todos los derechos reservados
          </span>
          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(36% 0.01 60)', fontStyle: 'italic' }}>
            Hecho con amor en Buenos Aires, Argentina 🧵
          </span>
        </div>
      </div>
    </footer>
  );
}
