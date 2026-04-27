import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import { SectionHeader, Btn } from '../components/Primitives';
import { CourseCard } from '../components/Cards';
import Footer from '../components/Footer';

export default function EscuelaPage() {
  const { courses, navigate, fmt } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', 'Costura Básica', 'Indumentaria Femenina', 'Bebés y Niños', 'Accesorios y Deco', 'Membresía', 'Avanzado'];
  const filtered = filter === 'Todos' ? courses : courses.filter(c => c.category === filter);
  const membershipCourse = courses.find(c => c.isMembership);
  const px = isMobile ? '16px' : isTablet ? '32px' : '80px';

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108 }}>
      {/* Hero */}
      <div style={{ background: 'linear-gradient(135deg, #1e3d2e 0%, #2a5244 50%, #1a3530 100%)', padding: isMobile ? '44px 20px 48px' : `72px ${px} 68px`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -40, width: 320, height: 320, borderRadius: '50%', background: 'radial-gradient(circle, rgba(151,206,184,.18) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: '30%', width: 260, height: 260, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,168,187,.12) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative', ...fadeUpStyle(true, 0) }}>
          <SectionHeader eyebrow="Escuela VeCKA" title="Aprendé a coser, de verdad" subtitle="Talleres online pensados para mujeres reales. A tu ritmo, con paciencia y sin frustraciones." light />
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid oklch(90% 0.012 60)', position: 'sticky', top: isMobile ? 60 : 108, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `14px ${px}`, display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '7px 16px', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 12 : 13, fontWeight: 500, whiteSpace: 'nowrap', transition: 'all .18s', background: filter === cat ? '#5e9e8a' : 'oklch(94% 0.012 60)', color: filter === cat ? '#fff' : 'oklch(40% 0.018 50)', flexShrink: 0 }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '32px 16px 64px' : `48px ${px} 80px` }}>
        {/* Club banner */}
        {membershipCourse && (
          <div style={{ background: 'linear-gradient(135deg, #5e9e8a, #4a7d6e)', borderRadius: isMobile ? 16 : 20, padding: isMobile ? '28px 22px' : '36px 40px', display: 'flex', flexDirection: isTablet ? 'column' : 'row', justifyContent: 'space-between', alignItems: isTablet ? 'flex-start' : 'center', marginBottom: 36, gap: 20, ...fadeUpStyle(visible, 0) }}>
            <div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#97ceb8', marginBottom: 8 }}>★ ACCESO ILIMITADO</div>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 32, color: '#fff', margin: '0 0 8px' }}>{membershipCourse.title}</h3>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(88% 0.02 60)', margin: 0 }}>
                {membershipCourse.description}
              </p>
            </div>
            <div style={{ textAlign: isTablet ? 'left' : 'right', flexShrink: 0 }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 32 : 42, fontWeight: 700, color: '#fff' }}>{fmt(membershipCourse.price, membershipCourse.priceUSD)}</div>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(80% 0.02 60)', marginBottom: 14 }}>por mes</div>
              <Btn variant="white" onClick={() => navigate('curso', { course: membershipCourse })}>Suscribirme al Club</Btn>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 18 : 28 }}>
          {filtered.filter(c => !c.isMembership).map((c, i) => (
            <div key={c.id} style={{ ...fadeUpStyle(visible, i * 0.08) }}>
              <CourseCard course={c} onClick={() => navigate('curso', { course: c })} />
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
