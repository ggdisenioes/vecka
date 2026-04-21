import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import Icon from '../components/Icon';
import { Btn, SectionHeader, Stars } from '../components/Primitives';
import { CourseCard, ProductCard } from '../components/Cards';
import Footer from '../components/Footer';

function CategoryCard({ cat }) {
  const { navigate } = useVecka();
  const [hov, setHov] = useState(false);
  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      onClick={() => navigate(cat.page)}
      style={{ background: hov ? cat.color : '#fff', border: `1.5px solid ${hov ? cat.color : 'oklch(90% 0.012 60)'}`, borderRadius: 16, padding: '28px 24px', cursor: 'pointer', transition: 'all .22s' }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 12, background: cat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
        <Icon name={cat.icon} size={20} color={cat.accent} />
      </div>
      <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, margin: '0 0 8px', color: 'oklch(18% 0.022 50)' }}>{cat.title}</h3>
      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', margin: '0 0 14px', lineHeight: 1.55 }}>{cat.desc}</p>
      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: cat.accent }}>{cat.count}</div>
    </div>
  );
}

export default function HomePage() {
  const { navigate, courses, products } = useVecka();

  return (
    <div>
      {/* Hero */}
      <section style={{ minHeight: '100vh', display: 'grid', gridTemplateColumns: '1fr 1fr', background: '#faf5f8', paddingTop: 108 }}>
        {/* Left */}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '60px 48px 60px 80px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, background: '#f0dee7', borderRadius: 999, padding: '6px 14px', marginBottom: 24, width: 'fit-content' }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#5e9e8a' }} />
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#4a7d6e', letterSpacing: '0.06em' }}>NUEVA PLATAFORMA — ABRIL 2026</span>
          </div>
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 600, lineHeight: 1.15, margin: '0 0 20px', color: 'oklch(16% 0.022 50)' }}>
            Cosé con propósito, transformá tu mundo
          </h1>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, lineHeight: 1.75, color: 'oklch(45% 0.018 50)', marginBottom: 36, maxWidth: 480 }}>
            Talleres online, moldes digitales y una comunidad de costureras que aprenden juntas. Descubrí la nueva plataforma VeCKA — diseñada para vos.
          </p>
          <div style={{ display: 'flex', gap: 14 }}>
            <Btn size="lg" onClick={() => navigate('escuela')} icon="book">Ver todos los talleres</Btn>
            <Btn size="lg" variant="outline" onClick={() => navigate('tienda')}>Explorar tienda</Btn>
          </div>
          {/* Stats */}
          <div style={{ display: 'flex', gap: 36, marginTop: 56, paddingTop: 36, borderTop: '1px solid oklch(88% 0.016 60)' }}>
            {[['5.400+', 'Alumnas activas'], ['48', 'Talleres online'], ['200+', 'Moldes digitales'], ['8 años', 'De experiencia']].map(([val, label]) => (
              <div key={label}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#5e9e8a' }}>{val}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Right — visual */}
        <div style={{ position: 'relative', overflow: 'hidden', background: '#f0dee7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/Portada-club-anual.png" alt="Vero — VeCKA Talleres" style={{ width: '100%', height: '100%', objectFit: 'contain', objectPosition: 'center bottom', display: 'block' }} />
          {/* Floating card */}
          <div style={{ position: 'absolute', bottom: 48, left: -24, background: '#fff', borderRadius: 16, padding: '18px 22px', boxShadow: '0 16px 48px rgba(0,0,0,.14)', maxWidth: 240 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0dee7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="star" size={16} color="#5e9e8a" style={{ fill: '#5e9e8a' }} />
              </div>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700 }}>4.9 / 5.0</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)' }}>Calificación promedio</div>
              </div>
            </div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', fontStyle: 'italic' }}>
              "La mejor escuela de costura online de Argentina"
            </div>
          </div>
        </div>
      </section>

      {/* Categorías */}
      <section style={{ padding: '80px 80px', maxWidth: 1280, margin: '0 auto' }}>
        <SectionHeader eyebrow="Aprendé con VeCKA" title="Todo lo que necesitás para coser" subtitle="Desde tus primeros pasos hasta técnicas profesionales — encontrá el curso perfecto para vos." />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
          {[
            { icon: 'play', title: 'Talleres Online', desc: 'Aprendé a tu ritmo, desde casa, con clases en video de alta calidad.', count: '24 talleres', color: '#f0dee7', accent: '#5e9e8a', page: 'escuela' },
            { icon: 'download', title: 'Moldes Digitales', desc: 'PDF listos para imprimir. Indumentaria femenina, infantil y accesorios.', count: '200+ moldes', color: '#e0f5ee', accent: '#5e9e8a', page: 'tienda' },
            { icon: 'package', title: 'Moldes en Papel', desc: 'Tu biblioteca física de moldes, impresos y listos para usar en tu taller.', count: '80+ modelos', color: 'oklch(93% 0.03 240)', accent: 'oklch(45% 0.09 240)', page: 'tienda' },
            { icon: 'tag', title: 'Mercería VeCKA', desc: 'Herramientas, insumos y materiales seleccionados por Vero.', count: 'Selección curada', color: 'oklch(93% 0.03 60)', accent: 'oklch(45% 0.09 60)', page: 'tienda' },
          ].map(cat => <CategoryCard key={cat.title} cat={cat} />)}
        </div>
      </section>

      {/* Club VeCKA Banner */}
      <section style={{ margin: '0 80px 80px', borderRadius: 24, background: '#5e9e8a', padding: '60px 64px', display: 'grid', gridTemplateColumns: '1fr 1fr', alignItems: 'center', gap: 40 }}>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', color: '#97ceb8', marginBottom: 12 }}>★ MEMBRESÍA MENSUAL</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 600, color: '#fff', margin: '0 0 16px', lineHeight: 1.1 }}>Club VeCKA — Cosé con propósito</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, color: 'oklch(88% 0.02 60)', lineHeight: 1.7, marginBottom: 28 }}>
            Acceso ilimitado a todos los talleres del mes + molde digital exclusivo + comunidad privada de costureras. Todo por un precio mensual fijo.
          </p>
          <Btn variant="white" size="lg" onClick={() => navigate('escuela')}>Quiero sumarme al Club</Btn>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          {[['Todos los talleres del mes', 'play'], ['Molde exclusivo mensual', 'download'], ['Comunidad privada', 'user'], ['Soporte personalizado', 'check']].map(([text, icon]) => (
            <div key={text} style={{ background: 'rgba(255,255,255,.1)', borderRadius: 12, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 10 }}>
              <Icon name={icon} size={18} color="oklch(85% 0.04 22)" />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#fff', fontWeight: 500 }}>{text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Cursos destacados */}
      <section style={{ padding: '0 80px 80px' }}>
        <SectionHeader eyebrow="Escuela VeCKA" title="Talleres más populares" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {courses.filter(c => !c.isMembership).slice(0, 3).map(c => (
            <CourseCard key={c.id} course={c} onClick={() => navigate('curso', { course: c })} />
          ))}
        </div>
        <div style={{ textAlign: 'center', marginTop: 36 }}>
          <Btn variant="outline" size="lg" onClick={() => navigate('escuela')}>Ver todos los talleres</Btn>
        </div>
      </section>

      {/* Tienda destacada */}
      <section style={{ padding: '0 80px 80px', background: '#fdf9fb' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', paddingTop: 80 }}>
          <SectionHeader eyebrow="Tienda VeCKA" title="Moldes & productos seleccionados" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 20 }}>
            {products.slice(0, 4).map(p => (
              <ProductCard key={p.id} product={p} onClick={() => navigate('tienda')} />
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 36 }}>
            <Btn variant="outline" size="lg" onClick={() => navigate('tienda')}>Ver toda la tienda</Btn>
          </div>
        </div>
      </section>

      {/* Sobre Vero */}
      <section style={{ padding: '80px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
        <div style={{ height: 480, background: '#97ceb8', borderRadius: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 22px, rgba(255,255,255,.2) 22px, rgba(255,255,255,.2) 23px)' }} />
          <div style={{ position: 'relative', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.35)', fontStyle: 'italic', textAlign: 'center' }}>Foto de Vero{'\n'}500×480px</div>
        </div>
        <div>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5e9e8a', marginBottom: 16 }}>La maestra detrás de VeCKA</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 48, fontWeight: 600, margin: '0 0 24px', lineHeight: 1.1 }}>Hola, soy Vero</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.8, color: 'oklch(40% 0.018 50)', marginBottom: 20 }}>
            Soy modelista industrial y costurera desde siempre. Hace 8 años empecé a dar talleres y descubrí que compartir mi mundo con quienes quieren aprender me hace muy feliz.
          </p>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.8, color: 'oklch(40% 0.018 50)', marginBottom: 32 }}>
            Cada clase está pensada para que coser sea un placer, no una frustración. Aprenderás con paciencia, precisión y mucho amor por el oficio.
          </p>
          <Btn size="lg" variant="outline" onClick={() => navigate('sobre')}>Conocer más sobre mí</Btn>
        </div>
      </section>

      {/* Testimonios */}
      <section style={{ padding: '80px 80px', background: 'oklch(16% 0.022 50)' }}>
        <SectionHeader eyebrow="Comunidad VeCKA" title="Las alumnas dicen..." light />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {[
            { name: 'Adriana Pinto', text: 'Me encanta cómo explica Vero, todo es súper claro. Los cursos son completísimos y siempre está atenta a cada consulta.', stars: 5 },
            { name: 'Patricia Gastal', text: 'Hermosos talleres, clarísimas las explicaciones y muy buenos los videos. Me encanta que los talles son reales.', stars: 5 },
            { name: 'Aída Rodríguez', text: 'Los cursos son un placer: moldes sin fallas, explicaciones didácticas y el apoyo de Vero ante cada duda.', stars: 5 },
            { name: 'Graciela Rosso', text: 'Solo cabe agradecer. Vero nos salva de miles de dudas y nos da consejos que nunca hubiéramos imaginado.', stars: 5 },
            { name: 'Andrea Macía', text: 'Los mejores moldes que encontré. Con explicación paso a paso, clara y sencilla. 100% recomendable.', stars: 5 },
            { name: 'Claudia Méndez', text: 'Empecé desde cero y hoy confecciono mis propias prendas. VeCKA cambió mi vida. ¡Gracias, Vero!', stars: 5 },
          ].map(t => (
            <div key={t.name} style={{ background: 'oklch(22% 0.018 50)', borderRadius: 16, padding: '28px 24px' }}>
              <Stars rating={t.stars} count={null} />
              <p style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontStyle: 'italic', color: 'oklch(88% 0.01 60)', lineHeight: 1.65, margin: '16px 0 20px' }}>"{t.text}"</p>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: 'oklch(75% 0.06 22)' }}>{t.name}</div>
            </div>
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}
