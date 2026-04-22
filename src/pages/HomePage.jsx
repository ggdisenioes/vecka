import { useState, useEffect, useRef } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import Icon from '../components/Icon';
import { Btn, SectionHeader, Stars } from '../components/Primitives';
import { CourseCard, ProductCard } from '../components/Cards';
import Footer from '../components/Footer';

/* Animated blob shape */
function Blob({ style }) {
  return (
    <div style={{
      borderRadius: '60% 40% 70% 30% / 50% 60% 40% 70%',
      position: 'absolute', pointerEvents: 'none',
      ...style,
    }} />
  );
}

/* Animated stat counter */
function CountUp({ target, suffix = '' }) {
  const [count, setCount] = useState(0);
  const { ref, visible } = useAnimateOnScroll(0.5);
  const started = useRef(false);
  useEffect(() => {
    if (!visible || started.current) return;
    started.current = true;
    const n = parseInt(String(target).replace(/\D/g, ''));
    let start = 0;
    const step = Math.ceil(n / 40);
    const interval = setInterval(() => {
      start += step;
      if (start >= n) { setCount(n); clearInterval(interval); }
      else setCount(start);
    }, 35);
    return () => clearInterval(interval);
  }, [visible, target]);
  const display = String(target).includes('+')
    ? (count >= parseInt(String(target)) ? target : count + '+')
    : count;
  return <span ref={ref}>{display}{suffix}</span>;
}

function CategoryCard({ cat }) {
  const { navigate } = useVecka();
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => navigate(cat.page)}
      style={{ background: hov ? cat.color : '#fff', border: `1.5px solid ${hov ? cat.color : 'oklch(90% 0.012 60)'}`, borderRadius: 18, padding: '26px 22px', cursor: 'pointer', transition: 'all .25s cubic-bezier(.22,1,.36,1)', transform: hov ? 'translateY(-5px)' : 'none', boxShadow: hov ? '0 16px 40px rgba(0,0,0,.1)' : 'none' }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, transition: 'transform .25s', transform: hov ? 'scale(1.1) rotate(-4deg)' : 'none' }}>
        <Icon name={cat.icon} size={22} color={cat.accent} />
      </div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, margin: '0 0 7px' }}>{cat.title}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', margin: '0 0 12px', lineHeight: 1.55 }}>{cat.desc}</p>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: cat.accent, display: 'flex', alignItems: 'center', gap: 6 }}>
        {cat.count} <span style={{ opacity: hov ? 1 : 0, transition: 'opacity .2s, transform .2s', transform: hov ? 'translateX(0)' : 'translateX(-6px)', display: 'inline-block' }}>→</span>
      </div>
    </div>
  );
}

export default function HomePage() {
  const { navigate, courses, products } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref: r1, visible: v1 } = useAnimateOnScroll();
  const { ref: r2, visible: v2 } = useAnimateOnScroll();
  const { ref: r3, visible: v3 } = useAnimateOnScroll();
  const { ref: r4, visible: v4 } = useAnimateOnScroll();
  const px = isMobile ? '20px' : isTablet ? '32px' : '80px';

  return (
    <div>
      {/* ═══ HERO ═══ */}
      <section style={{ minHeight: isMobile ? 'auto' : '100vh', display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', background: '#faf5f8', paddingTop: isMobile ? 68 : 108, position: 'relative', overflow: 'hidden' }}>
        {/* Animated blobs */}
        <Blob style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(197,223,206,.45) 0%, transparent 70%)', top: -100, left: -100, animation: 'float 10s ease-in-out infinite' }} />
        <Blob style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(240,222,231,.5) 0%, transparent 70%)', bottom: 50, left: '30%', animation: 'floatB 13s ease-in-out infinite 1s' }} />

        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: isMobile ? '40px 20px 36px' : isTablet ? '52px 40px' : '60px 48px 60px 80px', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#c5dfce', borderRadius: 999, padding: '6px 14px', marginBottom: 22, width: 'fit-content', animation: 'bounceIn .6s .2s both' }}>
            <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#4a7d6e', display: 'inline-block', animation: 'heartbeat 2.5s ease-in-out infinite' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#1e3d2e', letterSpacing: '0.06em' }}>NUEVA PLATAFORMA — ABRIL 2026</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 36 : isTablet ? 46 : 54, fontWeight: 600, lineHeight: 1.12, margin: '0 0 20px', color: 'oklch(16% 0.022 50)', animation: 'slideUp .7s .1s both' }}>
            Cosé con propósito,<br />
            <span style={{ background: 'linear-gradient(90deg, #5e9e8a, #97ceb8, #5e9e8a)', backgroundSize: '200% 100%', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', animation: 'shimmer 3s linear infinite' }}>
              transformá tu mundo
            </span>
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 15 : 17, lineHeight: 1.78, color: 'oklch(45% 0.018 50)', marginBottom: 32, maxWidth: 480, animation: 'slideUp .7s .25s both' }}>
            Talleres online, moldes digitales y una comunidad de costureras que aprenden juntas. Descubrí la nueva plataforma VeCKA.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', animation: 'slideUp .7s .38s both' }}>
            {/* CTA with pulse ring */}
            <div style={{ position: 'relative' }}>
              <div style={{ position: 'absolute', inset: -4, borderRadius: 12, border: '2px solid #5e9e8a', animation: 'pulseRing 2s ease-out infinite', pointerEvents: 'none' }} />
              <Btn size={isMobile ? 'md' : 'lg'} onClick={() => navigate('escuela')} icon="book">Ver talleres</Btn>
            </div>
            <Btn size={isMobile ? 'md' : 'lg'} variant="outline" onClick={() => navigate('tienda')}>Explorar tienda</Btn>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: isMobile ? 20 : 36, marginTop: isMobile ? 32 : 52, paddingTop: isMobile ? 24 : 32, borderTop: '1px solid oklch(88% 0.016 60)', flexWrap: 'wrap', animation: 'slideUp .7s .5s both' }}>
            {[['5400', '5.400+', 'Alumnas activas'], ['48', '48', 'Talleres online'], ['200', '200+', 'Moldes digitales'], ['8', '8 años', 'Experiencia']].map(([raw, display, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 30, fontWeight: 700, color: '#5e9e8a', lineHeight: 1 }}>
                  <CountUp target={display} />
                </div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', marginTop: 3 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right */}
        {!isTablet && (
          <div style={{ position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg, #f0dee7, #e8d5df)', display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
            <Blob style={{ width: 400, height: 400, background: 'radial-gradient(circle, rgba(151,206,184,.3) 0%, transparent 65%)', top: 0, right: -60, animation: 'float 8s ease-in-out infinite' }} />
            <img src="/Portada-club-anual.png" alt="Vero — VeCKA Talleres" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block', animation: 'floatB 8s ease-in-out infinite', position: 'relative', zIndex: 1 }} />
            {/* Floating card */}
            <div style={{ position: 'absolute', bottom: 52, left: -20, background: '#fff', borderRadius: 16, padding: '16px 20px', boxShadow: '0 16px 48px rgba(0,0,0,.14)', maxWidth: 230, zIndex: 2, animation: 'bounceIn .7s .8s both' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0dee7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="star" size={16} color="#5e9e8a" style={{ fill: '#5e9e8a' }} />
                </div>
                <div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700 }}>4.9 / 5.0</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'oklch(52% 0.018 50)' }}>Calificación promedio</div>
                </div>
              </div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', fontStyle: 'italic' }}>
                "La mejor escuela de costura online"
              </div>
            </div>
          </div>
        )}
      </section>

      {/* ═══ CATEGORÍAS ═══ */}
      <section ref={r1} style={{ padding: `80px ${px}`, maxWidth: 1280, margin: '0 auto' }}>
        <div style={fadeUpStyle(v1, 0)}>
          <SectionHeader eyebrow="Aprendé con VeCKA" title="Todo lo que necesitás para coser" subtitle="Desde tus primeros pasos hasta técnicas profesionales." />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 12 : 22 }}>
          {[
            { icon: 'play', title: 'Talleres Online', desc: 'Aprendé a tu ritmo con clases en video de alta calidad.', count: '24 talleres', color: '#f0dee7', accent: '#5e9e8a', page: 'escuela' },
            { icon: 'download', title: 'Moldes Digitales', desc: 'PDF listos para imprimir. Indumentaria, infantil, accesorios.', count: '200+ moldes', color: '#d4f0e6', accent: '#4a7d6e', page: 'tienda' },
            { icon: 'package', title: 'Moldes en Papel', desc: 'Tu biblioteca física de moldes listos para usar.', count: '80+ modelos', color: '#dde8f5', accent: '#4a6d8c', page: 'tienda' },
            { icon: 'tag', title: 'Mercería VeCKA', desc: 'Materiales y herramientas seleccionados por Vero.', count: 'Selección curada', color: '#f5ead4', accent: '#8c6a3e', page: 'tienda' },
          ].map((cat, i) => (
            <div key={cat.title} style={fadeUpStyle(v1, i * 0.09)}>
              <CategoryCard cat={cat} />
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CLUB VECKA ═══ */}
      <section style={{ margin: `0 ${px} 80px`, borderRadius: 24, background: 'linear-gradient(135deg, #2a5244 0%, #1e3d2e 50%, #3a6854 100%)', padding: isMobile ? '40px 24px' : isTablet ? '48px 40px' : '64px 64px', display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', alignItems: 'center', gap: 36, position: 'relative', overflow: 'hidden' }}>
        <Blob style={{ width: 350, height: 350, background: 'radial-gradient(circle, rgba(151,206,184,.2) 0%, transparent 65%)', top: -80, right: -60, animation: 'float 9s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'rgba(151,206,184,.2)', borderRadius: 999, padding: '5px 14px', marginBottom: 14 }}>
            <span style={{ animation: 'heartbeat 2s infinite' }}>⭐</span>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', color: '#97ceb8' }}>MEMBRESÍA MENSUAL</span>
          </div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 32 : 46, fontWeight: 600, color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>Club VeCKA —<br />Cosé con propósito</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 16, color: 'rgba(197,223,206,.85)', lineHeight: 1.72, marginBottom: 28 }}>
            Acceso ilimitado a todos los talleres del mes + molde digital exclusivo + comunidad privada. Un precio, todo incluido.
          </p>
          <div style={{ position: 'relative', display: 'inline-block' }}>
            <div style={{ position: 'absolute', inset: -4, borderRadius: 12, border: '2px solid rgba(197,223,206,.4)', animation: 'pulseRing 2.5s ease-out infinite', pointerEvents: 'none' }} />
            <Btn variant="white" size={isMobile ? 'md' : 'lg'} onClick={() => navigate('escuela')}>Quiero sumarme al Club</Btn>
          </div>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, position: 'relative', zIndex: 1 }}>
          {[['Todos los talleres del mes', 'play'], ['Molde exclusivo mensual', 'download'], ['Comunidad privada', 'user'], ['Soporte personalizado', 'check']].map(([text, icon], i) => (
            <div key={text} style={{ background: 'rgba(255,255,255,.09)', borderRadius: 14, padding: '16px 16px', display: 'flex', alignItems: 'center', gap: 10, border: '1px solid rgba(255,255,255,.08)', transition: 'background .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,.14)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,.09)'}>
              <Icon name={icon} size={16} color="#97ceb8" />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 11 : 13, color: '#fff', fontWeight: 500, lineHeight: 1.3 }}>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ═══ CURSOS DESTACADOS ═══ */}
      <section ref={r2} style={{ padding: `0 ${px} 80px` }}>
        <div style={fadeUpStyle(v2, 0)}>
          <SectionHeader eyebrow="Escuela VeCKA" title="Talleres más populares" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 24 }}>
          {courses.filter(c => !c.isMembership).slice(0, 3).map((c, i) => (
            <div key={c.id} style={fadeUpStyle(v2, i * 0.1)}>
              <CourseCard course={c} onClick={() => navigate('curso', { course: c })} />
            </div>
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <Btn variant="outline" size="lg" onClick={() => navigate('escuela')}>Ver todos los talleres</Btn>
        </div>
      </section>

      {/* ═══ TIENDA ═══ */}
      <section ref={r3} style={{ padding: `0 ${px} 80px`, background: '#fdf9fb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 80 }}>
          <div style={fadeUpStyle(v3, 0)}>
            <SectionHeader eyebrow="Tienda VeCKA" title="Moldes & productos seleccionados" />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(4,1fr)', gap: isMobile ? 12 : 20 }}>
            {products.slice(0, 4).map((p, i) => (
              <div key={p.id} style={fadeUpStyle(v3, i * 0.08)}>
                <ProductCard product={p} onClick={() => navigate('tienda')} />
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Btn variant="outline" size="lg" onClick={() => navigate('tienda')}>Ver toda la tienda</Btn>
          </div>
        </div>
      </section>

      {/* ═══ SOBRE VERO ═══ */}
      <section style={{ padding: `80px ${px}`, display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: isTablet ? 40 : 80, alignItems: 'center' }}>
        {!isMobile && (
          <div style={{ height: isTablet ? 320 : 480, background: 'linear-gradient(135deg, #c5dfce, #97ceb8)', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <Blob style={{ width: 280, height: 280, background: 'radial-gradient(circle, rgba(255,255,255,.3), transparent 65%)', top: -40, right: -40, animation: 'float 7s ease-in-out infinite' }} />
            <div style={{ position: 'relative', zIndex: 1, fontFamily: "'Cormorant Garamond', serif", fontSize: 18, color: 'rgba(0,0,0,.3)', fontStyle: 'italic', textAlign: 'center' }}>Foto de Vero</div>
          </div>
        )}
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5e9e8a', marginBottom: 14 }}>La maestra detrás de VeCKA</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 34 : 48, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.1 }}>Hola, soy Vero</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 16, lineHeight: 1.8, color: 'oklch(40% 0.018 50)', marginBottom: 16 }}>
            Soy modelista industrial y costurera desde siempre. Hace 8 años empecé a dar talleres y descubrí que compartir mi oficio me hace muy feliz.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 16, lineHeight: 1.8, color: 'oklch(40% 0.018 50)', marginBottom: 28 }}>
            Cada clase está pensada para que coser sea un placer, no una frustración. Con paciencia, precisión y amor por el oficio.
          </p>
          <Btn size="lg" variant="outline" onClick={() => navigate('sobre')}>Conocer más sobre mí</Btn>
        </div>
      </section>

      {/* ═══ TESTIMONIOS ═══ */}
      <section ref={r4} style={{ padding: `80px ${px}`, background: 'linear-gradient(160deg, #1e3d2e 0%, #2a5244 50%, #1a3530 100%)', position: 'relative', overflow: 'hidden' }}>
        <Blob style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(151,206,184,.12) 0%, transparent 65%)', top: -100, right: -100, animation: 'float 12s ease-in-out infinite' }} />
        <div style={{ position: 'relative', zIndex: 1, ...fadeUpStyle(v4, 0) }}>
          <SectionHeader eyebrow="Comunidad VeCKA" title="Las alumnas dicen..." light />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2,1fr)' : 'repeat(3,1fr)', gap: 18, position: 'relative', zIndex: 1 }}>
          {[
            { name: 'Adriana Pinto', text: 'Me encanta cómo explica Vero, todo es súper claro. Los cursos son completísimos.', stars: 5 },
            { name: 'Patricia Gastal', text: 'Hermosos talleres, clarísimas las explicaciones. Me encanta que los talles son reales.', stars: 5 },
            { name: 'Aída Rodríguez', text: 'Los cursos son un placer: moldes sin fallas, explicaciones didácticas y apoyo constante.', stars: 5 },
            { name: 'Graciela Rosso', text: 'Solo cabe agradecer. Vero nos salva de miles de dudas con consejos increíbles.', stars: 5 },
            { name: 'Andrea Macía', text: 'Los mejores moldes que encontré. Con explicación paso a paso, clara y sencilla.', stars: 5 },
            { name: 'Claudia Méndez', text: 'Empecé desde cero y hoy confecciono mis propias prendas. ¡VeCKA cambió mi vida!', stars: 5 },
          ].slice(0, isMobile ? 3 : 6).map((t, i) => (
            <div key={t.name} style={{ background: 'rgba(255,255,255,.07)', borderRadius: 18, padding: '24px 22px', border: '1px solid rgba(151,206,184,.15)', transition: 'background .22s, transform .22s', ...fadeUpStyle(v4, i * 0.08) }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,.11)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.07)'; e.currentTarget.style.transform = 'none'; }}>
              <Stars rating={t.stars} count={null} />
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontStyle: 'italic', color: 'rgba(255,255,255,.85)', lineHeight: 1.68, margin: '14px 0 16px' }}>"{t.text}"</p>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#97ceb8' }}>{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
