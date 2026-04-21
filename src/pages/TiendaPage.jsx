import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import Icon from '../components/Icon';
import { SectionHeader, inputStyle } from '../components/Primitives';
import { ProductCard } from '../components/Cards';
import Footer from '../components/Footer';

export default function TiendaPage() {
  const { products, navigate } = useVecka();
  const [filter, setFilter] = useState('Todos');
  const [search, setSearch] = useState('');
  const categories = ['Todos', 'Moldes Digitales', 'Moldes Impresos', 'Mercería VeCKA'];

  const filtered = products.filter(p => {
    const matchCat = filter === 'Todos' || p.category === filter;
    const matchSearch = p.title.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div style={{ paddingTop: 108 }}>
      {/* Header */}
      <div style={{ background: '#faf5f8', padding: '48px 80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader eyebrow="Tienda VeCKA" title="Moldes & Mercería" subtitle="Moldes digitales PDF, moldes en papel y materiales seleccionados por Vero." center={false} />
          <div style={{ display: 'flex', gap: 12, marginBottom: 32, alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ position: 'relative', flex: 1, maxWidth: 320 }}>
              <div style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)' }}>
                <Icon name="search" size={16} color="oklch(60% 0.018 50)" />
              </div>
              <input placeholder="Buscar moldes..." value={search} onChange={e => setSearch(e.target.value)} style={{ ...inputStyle, paddingLeft: 38, width: '100%' }} />
            </div>
            {categories.map(cat => (
              <button key={cat} onClick={() => setFilter(cat)}
                style={{ padding: '9px 18px', border: 'none', borderRadius: 999, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500, background: filter === cat ? '#5e9e8a' : 'oklch(92% 0.012 60)', color: filter === cat ? '#fff' : 'oklch(40% 0.018 50)', transition: 'all .15s' }}>
                {cat}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Grid */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '32px 80px 80px' }}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '80px 0', fontFamily: "'DM Sans', sans-serif", color: 'oklch(52% 0.018 50)' }}>
            No se encontraron productos.
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 22 }}>
            {filtered.map(p => <ProductCard key={p.id} product={p} onClick={() => {}} />)}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
}
