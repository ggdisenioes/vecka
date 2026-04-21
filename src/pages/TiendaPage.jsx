import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import Icon from '../components/Icon';
import { SectionHeader, inputStyle } from '../components/Primitives';
import { ProductCard } from '../components/Cards';
import Footer from '../components/Footer';

export default function TiendaPage() {
  const { products } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const categories = ['Todos', 'Moldes Digitales', 'Moldes Impresos', 'Mercería VeCKA'];
  const px = isMobile ? '16px' : isTablet ? '32px' : '80px';

  const filtered = products.filter(p => {
    const matchCat = filter === 'Todos' || p.category === filter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108 }}>
      {/* Header */}
      <div style={{ background: '#faf5f8', padding: isMobile ? '36px 16px 0' : `48px ${px} 0` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader eyebrow="Tienda VeCKA" title="Moldes & Mercería" subtitle="Moldes digitales PDF, moldes en papel y materiales seleccionados por Vero." center={false} />
          <div style={{ display: 'flex', gap: 10, marginBottom: 28, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', width: isMobile ? '100%' : 300 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="search" size={15} color="oklch(60% 0.018 50)" />
              </div>
              <input placeholder="Buscar moldes..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 36, width: '100%' }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {categories.map(cat => (
                <button key={cat} onClick={() => setFilter(cat)}
                  style={{ padding: '9px 16px', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 12 : 13, fontWeight: 500, background: filter === cat ? '#5e9e8a' : 'oklch(92% 0.012 60)', color: filter === cat ? '#fff' : 'oklch(40% 0.018 50)', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Grid */}
      <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '28px 16px 64px' : `32px ${px} 80px` }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'DM Sans', sans-serif", color: 'oklch(52% 0.018 50)' }}>
            No se encontraron productos.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr 1fr' : isTablet ? 'repeat(3, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 20 }}>
            {filtered.map((p, i) => (
              <div key={p.id} style={{ ...fadeUpStyle(visible, i * 0.06) }}>
                <ProductCard product={p} onClick={() => {}} />
              </div>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
