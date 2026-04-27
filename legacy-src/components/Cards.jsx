import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import Icon from './Icon';
import { Btn, Badge, Stars, ProgressBar } from './Primitives';

export function CourseCard({ course, onClick, animDelay = 0 }) {
  const { fmt, addToCart } = useVecka();
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 16, overflow: 'hidden',
        border: '1px solid oklch(90% 0.012 60)', cursor: 'pointer',
        transition: 'transform .28s cubic-bezier(.22,1,.36,1), box-shadow .28s ease',
        transform: hov ? 'translateY(-6px)' : 'none',
        boxShadow: hov ? '0 20px 48px rgba(0,0,0,.12)' : '0 2px 8px rgba(0,0,0,.05)',
      }}
      onClick={onClick}
    >
      <div style={{ height: 180, background: course.color || 'oklch(94% 0.02 60)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
        {/* Subtle pattern overlay */}
        <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,.25) 0%, transparent 60%)', transition: 'opacity .3s', opacity: hov ? 1 : 0 }} />
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: 'rgba(0,0,0,.3)', textAlign: 'center', padding: '0 20px', position: 'relative', transition: 'transform .3s', transform: hov ? 'scale(1.03)' : 'scale(1)' }}>{course.title}</div>
        {course.isMembership && <div style={{ position: 'absolute', top: 12, right: 12 }}><Badge>Membresía</Badge></div>}
        {course.enrolled && <div style={{ position: 'absolute', top: 12, left: 12 }}><Badge color="#4a7d6e" bg="#d4f0e6">Inscripta ✓</Badge></div>}
      </div>
      <div style={{ padding: 20 }}>
        <Badge color="#5e9e8a" bg="#e0f5ee">{course.category}</Badge>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, margin: '10px 0 4px', color: 'oklch(18% 0.022 50)' }}>{course.title}</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', margin: '0 0 12px', lineHeight: 1.5 }}>{course.subtitle}</p>
        <Stars rating={course.rating} count={course.reviews} />
        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif" }}>
          <span>{course.lessons} clases</span><span>·</span><span>{course.duration}</span><span>·</span><span>{course.level}</span>
        </div>
        {course.enrolled && course.progress > 0 && (
          <div style={{ marginTop: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, fontFamily: "'DM Sans', sans-serif", color: 'oklch(52% 0.018 50)', marginBottom: 4 }}>
              <span>Tu progreso</span><span>{course.progress}%</span>
            </div>
            <ProgressBar value={course.progress} />
          </div>
        )}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 16 }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#5e9e8a' }}>{fmt(course.price, course.priceUSD)}</div>
          {course.enrolled
            ? <Btn size="sm" variant="outline" onClick={e => { e.stopPropagation(); onClick(); }}>Continuar</Btn>
            : <Btn size="sm" onClick={e => { e.stopPropagation(); addToCart(course); }}>Inscribirme</Btn>
          }
        </div>
      </div>
    </div>
  );
}

export function ProductCard({ product, onClick }) {
  const { fmt, addToCart } = useVecka();
  const [hov, setHov] = useState(false);
  const [added, setAdded] = useState(false);

  const handleAdd = (e) => {
    e.stopPropagation();
    addToCart(product);
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  };

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff', borderRadius: 14, overflow: 'hidden',
        border: '1px solid oklch(90% 0.012 60)', cursor: 'pointer',
        transition: 'transform .25s cubic-bezier(.22,1,.36,1), box-shadow .25s ease',
        transform: hov ? 'translateY(-4px)' : 'none',
        boxShadow: hov ? '0 14px 36px rgba(0,0,0,.1)' : '0 2px 6px rgba(0,0,0,.04)',
      }}
      onClick={onClick}
    >
      <div style={{ height: 140, background: product.color || 'oklch(94% 0.02 60)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,255,255,.18) 0%, transparent 70%)', opacity: hov ? 1 : 0, transition: 'opacity .25s' }} />
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 13, color: 'rgba(0,0,0,.28)', textAlign: 'center', padding: '0 14px', position: 'relative' }}>{product.title}</div>
        {product.badge && <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge>{product.badge}</Badge></div>}
        {product.format === 'PDF' && <div style={{ position: 'absolute', bottom: 10, left: 10 }}><Badge color="oklch(35% 0.09 240)" bg="oklch(92% 0.04 240)">PDF</Badge></div>}
      </div>
      <div style={{ padding: 14 }}>
        <div style={{ fontSize: 11, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif", marginBottom: 3 }}>{product.subcategory}</div>
        <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, margin: '0 0 3px', color: 'oklch(18% 0.022 50)', lineHeight: 1.3 }}>{product.title}</h4>
        <div style={{ fontSize: 11, color: 'oklch(60% 0.018 50)', fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Talles: {product.sizes}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a' }}>{fmt(product.price, product.priceUSD)}</div>
          <button
            onClick={handleAdd}
            style={{ width: 32, height: 32, borderRadius: '50%', background: added ? '#4a7d6e' : '#5e9e8a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background .2s, transform .15s', transform: added ? 'scale(0.9)' : 'scale(1)' }}
          >
            <Icon name={added ? 'check' : 'plus'} size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
