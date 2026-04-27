import { useState } from 'react';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import { Badge, SectionHeader } from '../components/Primitives';
import Footer from '../components/Footer';

const BLOG_POSTS = [
  { id: 1, title: 'El pantalón de jean: historia y características', date: '10 Abr 2025', comments: 3, color: '#d4e0f0', category: 'Tendencias', reading: '5 min', excerpt: 'El jean es una de las prendas más icónicas. Descubrí su origen, evolución y cómo trabajarlo en costura.' },
  { id: 2, title: 'Terminaciones a mano: técnicas que marcan la diferencia', date: '18 Nov 2024', comments: 0, color: '#e8d5c4', category: 'Técnicas', reading: '4 min', excerpt: 'Las terminaciones a mano le dan a tus prendas ese toque profesional que no se puede replicar con máquina.' },
  { id: 3, title: '¡Cosé el Chalebuzo!', date: '27 Dic 2024', comments: 2, color: '#d4e8d8', category: 'Tutoriales', reading: '6 min', excerpt: 'El chalebuzo es la prenda del momento. Mitad chaleco, mitad buzo — aprendé a confeccionarlo.' },
  { id: 4, title: '¡Tutorial! Regalale a mamá este Bolsito de herramientas', date: '14 Oct 2024', comments: 0, color: '#f0dce8', category: 'Tutoriales', reading: '7 min', excerpt: 'Un regalo hecho a mano siempre es especial. Cosé este práctico bolsito para herramientas.' },
  { id: 5, title: '¡Así fue ExpoHobby 2024!', date: '3 Nov 2024', comments: 31, color: '#f0e8d0', category: 'Eventos', reading: '3 min', excerpt: 'ExpoHobby 2024 fue una experiencia increíble. Te cuento todo lo que pasó.' },
  { id: 6, title: 'Tutorial: ¡Abrigo para perros!', date: '14 Oct 2024', comments: 0, color: '#d8e4f0', category: 'Tutoriales', reading: '5 min', excerpt: 'Sí, ¡también cosemos para nuestras mascotas! Aprendé a hacer un abrigo para tu perro.' },
  { id: 7, title: 'Guía completa: tipos de tela para costura', date: '2 Sep 2024', comments: 8, color: '#e4d8f0', category: 'Guías', reading: '8 min', excerpt: 'Algodón, lycra, lino, viscolycra... Conocé las telas más usadas y cuándo elegir cada una.' },
];

const CATEGORIES = ['Todos', 'Tutoriales', 'Técnicas', 'Tendencias', 'Eventos', 'Guías'];

function BlogCard({ post, delay = 0, visible }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid oklch(90% 0.012 60)', cursor: 'pointer', transition: 'transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease', transform: hov ? 'translateY(-5px)' : 'none', boxShadow: hov ? '0 14px 36px rgba(0,0,0,.1)' : '0 2px 8px rgba(0,0,0,.04)', ...fadeUpStyle(visible, delay) }}>
      <div style={{ height: 150, background: post.color, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(0,0,0,.28)', fontStyle: 'italic', padding: 16, textAlign: 'center', transition: 'transform .3s', transform: hov ? 'scale(1.04)' : 'scale(1)' }}>{post.title}</div>
      </div>
      <div style={{ padding: '18px 18px 20px' }}>
        <Badge color="#5e9e8a" bg="#e0f5ee">{post.category}</Badge>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 19, fontWeight: 600, margin: '9px 0 8px', lineHeight: 1.3, color: 'oklch(16% 0.022 50)' }}>{post.title}</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(48% 0.018 50)', lineHeight: 1.6, margin: '0 0 12px' }}>{post.excerpt}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(58% 0.018 50)' }}>
          <span>{post.date}</span>
          <span>{post.reading} · {post.comments} comentarios</span>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const [filter, setFilter] = useState('Todos');
  const px = isMobile ? '16px' : isTablet ? '32px' : '80px';
  const [featured, ...rest] = BLOG_POSTS;
  const filtered = filter === 'Todos' ? BLOG_POSTS : BLOG_POSTS.filter(p => p.category === filter);

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108 }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3d2e 0%, #2a5244 50%, #1a3530 100%)', padding: isMobile ? '44px 20px 48px' : `64px ${px} 60px`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -80, right: '10%', width: 380, height: 380, borderRadius: '50%', background: 'radial-gradient(circle, rgba(151,206,184,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -60, left: '5%', width: 220, height: 220, borderRadius: '50%', background: 'radial-gradient(circle, rgba(224,168,187,.1) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', position: 'relative' }}>
          <SectionHeader eyebrow="VeCKA Blog" title="Costura, inspiración y tutoriales" subtitle="Tips, tutoriales y todo lo que necesitás saber para avanzar en tu camino como costurera." light />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid oklch(90% 0.012 60)', position: 'sticky', top: isMobile ? 60 : 108, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `14px ${px}`, display: 'flex', gap: 8, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '7px 16px', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 12 : 13, fontWeight: 500, background: filter === cat ? '#5e9e8a' : 'oklch(94% 0.012 60)', color: filter === cat ? '#fff' : 'oklch(40% 0.018 50)', transition: 'all .15s', whiteSpace: 'nowrap', flexShrink: 0 }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '32px 16px 64px' : `52px ${px} 80px` }}>
        {/* Featured post */}
        {filter === 'Todos' && !isMobile && (
          <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: 0, borderRadius: 20, overflow: 'hidden', marginBottom: 44, boxShadow: '0 4px 24px rgba(0,0,0,.08)', cursor: 'pointer', border: '1px solid oklch(90% 0.012 60)', ...fadeUpStyle(visible, 0) }}>
            <div style={{ height: isTablet ? 240 : 320, background: featured.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.3)', fontStyle: 'italic', textAlign: 'center', padding: 24 }}>{featured.title}</div>
            </div>
            <div style={{ background: '#fff', padding: '36px 36px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 14 }}>
                <Badge color="#3d6b5e" bg="#c5dfce">Destacado</Badge>
                <Badge color="#5e9e8a" bg="#e0f5ee">{featured.category}</Badge>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isTablet ? 26 : 32, fontWeight: 600, margin: '0 0 14px', lineHeight: 1.2 }}>{featured.title}</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(45% 0.018 50)', lineHeight: 1.7, marginBottom: 20 }}>{featured.excerpt}</p>
              <div style={{ display: 'flex', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>
                <span>{featured.date}</span><span>·</span><span>{featured.reading}</span><span>·</span><span>{featured.comments} comentarios</span>
              </div>
            </div>
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 24 }}>
          {(filter === 'Todos' && !isMobile ? rest : filtered).map((post, i) => (
            <BlogCard key={post.id} post={post} delay={i * 0.07} visible={visible} />
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
