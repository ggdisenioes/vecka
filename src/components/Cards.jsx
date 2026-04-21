import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import Icon from './Icon';
import { Btn, Badge, Stars, ProgressBar } from './Primitives';

export function CourseCard({ course, onClick }) {
  const { fmt, addToCart } = useVecka();
  const [hov, setHov] = useState(false);

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid oklch(90% 0.012 60)', cursor: 'pointer', transition: 'all .25s', transform: hov ? 'translateY(-4px)' : 'none', boxShadow: hov ? '0 16px 40px rgba(0,0,0,.1)' : '0 2px 8px rgba(0,0,0,.05)' }}
      onClick={onClick}
    >
      <div style={{ height: 180, background: course.color || 'oklch(94% 0.02 60)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 600, color: 'rgba(0,0,0,.35)', textAlign: 'center', padding: '0 20px' }}>{course.title}</div>
        {course.isMembership && <div style={{ position: 'absolute', top: 12, right: 12 }}><Badge>Membresía</Badge></div>}
        {course.enrolled && <div style={{ position: 'absolute', top: 12, left: 12 }}><Badge color="#4a7d6e" bg="#d4f0e6">Inscripta ✓</Badge></div>}
      </div>
      <div style={{ padding: 20 }}>
        <Badge color="#5e9e8a" bg="#e0f5ee">{course.category}</Badge>
        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 600, margin: '10px 0 4px', color: 'oklch(18% 0.022 50)' }}>{course.title}</h3>
        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', margin: '0 0 12px', lineHeight: 1.5 }}>{course.subtitle}</p>
        <Stars rating={course.rating} count={course.reviews} />
        <div style={{ display: 'flex', gap: 12, marginTop: 8, fontSize: 12, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif" }}>
          <span>{course.lessons} clases</span>
          <span>·</span>
          <span>{course.duration}</span>
          <span>·</span>
          <span>{course.level}</span>
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

  return (
    <div
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}
      style={{ background: '#fff', borderRadius: 14, overflow: 'hidden', border: '1px solid oklch(90% 0.012 60)', cursor: 'pointer', transition: 'all .22s', transform: hov ? 'translateY(-3px)' : 'none', boxShadow: hov ? '0 12px 32px rgba(0,0,0,.09)' : '0 2px 6px rgba(0,0,0,.04)' }}
      onClick={onClick}
    >
      <div style={{ height: 140, background: product.color || 'oklch(94% 0.02 60)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'rgba(0,0,0,.3)', textAlign: 'center', padding: '0 16px' }}>{product.title}</div>
        {product.badge && <div style={{ position: 'absolute', top: 10, right: 10 }}><Badge>{product.badge}</Badge></div>}
        {product.format === 'PDF' && <div style={{ position: 'absolute', bottom: 10, left: 10 }}><Badge color="oklch(35% 0.09 240)" bg="oklch(92% 0.04 240)">PDF</Badge></div>}
      </div>
      <div style={{ padding: 16 }}>
        <div style={{ fontSize: 11, color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif", marginBottom: 4 }}>{product.subcategory}</div>
        <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, margin: '0 0 4px', color: 'oklch(18% 0.022 50)', lineHeight: 1.3 }}>{product.title}</h4>
        <div style={{ fontSize: 11, color: 'oklch(60% 0.018 50)', fontFamily: "'DM Sans', sans-serif", marginBottom: 10 }}>Talles: {product.sizes}</div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a' }}>{fmt(product.price, product.priceUSD)}</div>
          <button
            onClick={e => { e.stopPropagation(); addToCart(product); }}
            style={{ width: 32, height: 32, borderRadius: '50%', background: '#5e9e8a', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="plus" size={14} color="#fff" />
          </button>
        </div>
      </div>
    </div>
  );
}
