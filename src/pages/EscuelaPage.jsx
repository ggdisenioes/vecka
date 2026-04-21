import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { SectionHeader, Btn } from '../components/Primitives';
import { CourseCard } from '../components/Cards';
import Footer from '../components/Footer';

export default function EscuelaPage() {
  const { courses, navigate, fmt } = useVecka();
  const [filter, setFilter] = useState('Todos');
  const categories = ['Todos', 'Costura Básica', 'Indumentaria Femenina', 'Bebés y Niños', 'Accesorios y Deco', 'Membresía', 'Avanzado'];
  const filtered = filter === 'Todos' ? courses : courses.filter(c => c.category === filter);

  return (
    <div style={{ paddingTop: 108 }}>
      {/* Hero */}
      <div style={{ background: 'oklch(16% 0.022 50)', padding: '64px 80px 60px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader eyebrow="Escuela VeCKA" title="Aprendé a coser, de verdad" subtitle="Talleres online pensados para mujeres reales. A tu ritmo, con paciencia y sin frustraciones." light />
        </div>
      </div>

      {/* Filters */}
      <div style={{ background: '#fff', borderBottom: '1px solid oklch(90% 0.012 60)', position: 'sticky', top: 108, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '0 80px', display: 'flex', gap: 8, overflowX: 'auto', paddingTop: 16, paddingBottom: 16 }}>
          {categories.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '7px 18px', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, whiteSpace: 'nowrap', transition: 'all .15s', background: filter === cat ? '#5e9e8a' : 'oklch(94% 0.012 60)', color: filter === cat ? '#fff' : 'oklch(40% 0.018 50)' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '48px 80px 80px' }}>
        {/* Club banner */}
        <div style={{ background: 'linear-gradient(135deg, #5e9e8a, #4a7d6e)', borderRadius: 20, padding: '36px 40px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.16em', color: '#97ceb8', marginBottom: 8 }}>★ ACCESO ILIMITADO</div>
            <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, color: '#fff', margin: '0 0 8px' }}>Club VeCKA — Membresía Mensual</h3>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(88% 0.02 60)', margin: 0 }}>
              Accedé a todos los talleres + molde exclusivo + comunidad. Un precio, todo incluido.
            </p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 700, color: '#fff' }}>{fmt(8500, 9)}</div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(80% 0.02 60)', marginBottom: 14 }}>por mes</div>
            <Btn variant="white" onClick={() => navigate('curso', { course: courses.find(c => c.isMembership) })}>Suscribirme al Club</Btn>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 28 }}>
          {filtered.filter(c => !c.isMembership).map(c => (
            <CourseCard key={c.id} course={c} onClick={() => navigate('curso', { course: c })} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
