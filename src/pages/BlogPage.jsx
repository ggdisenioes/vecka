import { useState } from 'react';
import { Badge } from '../components/Primitives';
import Footer from '../components/Footer';
import { SectionHeader } from '../components/Primitives';

const BLOG_POSTS = [
  { id: 1, title: 'El pantalón de jean: historia y características', date: '10 Abr 2025', comments: 3, color: '#d4e0f0', category: 'Tendencias', reading: '5 min', excerpt: 'El jean es una de las prendas más icónicas de la historia. Descubrí su origen, evolución y cómo trabajarlo en costura.' },
  { id: 2, title: 'Terminaciones a mano: técnicas que marcan la diferencia', date: '18 Nov 2024', comments: 0, color: '#e8d5c4', category: 'Técnicas', reading: '4 min', excerpt: 'Las terminaciones a mano le dan a tus prendas ese toque profesional que no se puede replicar con máquina.' },
  { id: 3, title: '¡Cosé el Chalebuzo!', date: '27 Dic 2024', comments: 2, color: '#d4e8d8', category: 'Tutoriales', reading: '6 min', excerpt: 'El chalebuzo es la prenda del momento. Mitad chaleco, mitad buzo — aprende a confeccionarlo desde cero.' },
  { id: 4, title: '¡Tutorial! Regalale a mamá este Bolsito de herramientas', date: '14 Oct 2024', comments: 0, color: '#f0dce8', category: 'Tutoriales', reading: '7 min', excerpt: 'Un regalo hecho a mano siempre es especial. Cosé este práctico bolsito para herramientas y sorprendé a tu mamá.' },
  { id: 5, title: '¡Así fue ExpoHobby 2024!', date: '3 Nov 2024', comments: 31, color: '#f0e8d0', category: 'Eventos', reading: '3 min', excerpt: 'ExpoHobby 2024 fue una experiencia increíble. Te cuento todo lo que pasó y las novedades que nos llevamos.' },
  { id: 6, title: 'Tutorial: ¡Abrigo para perros!', date: '14 Oct 2024', comments: 0, color: '#d8e4f0', category: 'Tutoriales', reading: '5 min', excerpt: 'Sí, ¡también cosemos para nuestras mascotas! Aprendé a hacer un abrigo para tu perro en pocos pasos.' },
  { id: 7, title: 'Guía completa: tipos de tela para costura', date: '2 Sep 2024', comments: 8, color: '#e4d8f0', category: 'Guías', reading: '8 min', excerpt: 'Algodón, lycra, lino, viscolycra... Conocé las telas más usadas y cuándo elegir cada una.' },
  { id: 8, title: 'Cómo tomar medidas correctamente', date: '15 Ago 2024', comments: 5, color: '#d8f0e4', category: 'Técnicas', reading: '4 min', excerpt: 'Tomar medidas con precisión es la base de cualquier prenda bien hecha. Guía paso a paso con fotos.' },
];

const CATEGORIES = ['Todos', 'Tutoriales', 'Técnicas', 'Tendencias', 'Eventos', 'Guías'];

function BlogCard({ post }) {
  const [hov, setHov] = useState(false);
  return (
    <div onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid oklch(90% 0.012 60)', cursor: 'pointer', transition: 'all .22s', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 12px 32px rgba(0,0,0,.09)' : '0 2px 8px rgba(0,0,0,.04)' }}>
      <div style={{ height: 160, background: post.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(0,0,0,.28)', fontStyle: 'italic', padding: 16, textAlign: 'center' }}>{post.title}</div>
      </div>
      <div style={{ padding: '20px 20px 22px' }}>
        <Badge color="#5e9e8a" bg="#e0f5ee">{post.category}</Badge>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, margin: '10px 0 10px', lineHeight: 1.3, color: 'oklch(16% 0.022 50)' }}>{post.title}</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(48% 0.018 50)', lineHeight: 1.6, margin: '0 0 14px' }}>{post.excerpt}</p>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(58% 0.018 50)' }}>
          <span>{post.date}</span>
          <span>{post.reading} · {post.comments} comentarios</span>
        </div>
      </div>
    </div>
  );
}

export default function BlogPage() {
  const [filter, setFilter] = useState('Todos');
  const [featured, ...rest] = BLOG_POSTS;
  const filtered = filter === 'Todos' ? BLOG_POSTS : BLOG_POSTS.filter(p => p.category === filter);

  return (
    <div style={{ paddingTop: 108 }}>
      {/* Header */}
      <div style={{ background: 'oklch(16% 0.022 50)', padding: '56px 80px 52px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader eyebrow="VeCKA Blog" title="Costura, inspiración y tutoriales" subtitle="Tips, tutoriales y todo lo que necesitás saber para avanzar en tu camino como costurera." light />
        </div>
      </div>

      {/* Filter bar */}
      <div style={{ background: '#fff', borderBottom: '1px solid oklch(90% 0.012 60)', position: 'sticky', top: 108, zIndex: 100 }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '14px 80px', display: 'flex', gap: 8 }}>
          {CATEGORIES.map(cat => (
            <button key={cat} onClick={() => setFilter(cat)}
              style={{ padding: '7px 18px', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, background: filter === cat ? '#5e9e8a' : 'oklch(94% 0.012 60)', color: filter === cat ? '#fff' : 'oklch(40% 0.018 50)', transition: 'all .15s' }}>
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '52px 80px 80px' }}>
        {/* Featured post */}
        {filter === 'Todos' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 0, borderRadius: 20, overflow: 'hidden', marginBottom: 48, boxShadow: '0 4px 24px rgba(0,0,0,.08)', cursor: 'pointer', border: '1px solid oklch(90% 0.012 60)' }}>
            <div style={{ height: 340, background: featured.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.3)', fontStyle: 'italic', textAlign: 'center', padding: 24 }}>
                Imagen — {featured.title}
              </div>
            </div>
            <div style={{ background: '#fff', padding: '40px 40px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
                <Badge color="#3d6b5e" bg="#c5dfce">Destacado</Badge>
                <Badge color="#5e9e8a" bg="#e0f5ee">{featured.category}</Badge>
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, fontWeight: 600, margin: '0 0 16px', lineHeight: 1.2, color: 'oklch(16% 0.022 50)' }}>{featured.title}</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'oklch(45% 0.018 50)', lineHeight: 1.7, marginBottom: 24 }}>{featured.excerpt}</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>
                <span>{featured.date}</span>
                <span>·</span>
                <span>{featured.reading} de lectura</span>
                <span>·</span>
                <span>{featured.comments} comentarios</span>
              </div>
            </div>
          </div>
        )}

        {/* Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
          {(filter === 'Todos' ? rest : filtered).map(post => <BlogCard key={post.id} post={post} />)}
        </div>
      </div>

      <Footer />
    </div>
  );
}
