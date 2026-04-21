import { useVecka } from '../context/VeckaContext';

export default function Footer() {
  const { navigate } = useVecka();
  return (
    <footer style={{ background: 'oklch(15% 0.02 50)', color: '#fff', marginTop: 'auto' }}>
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 24px 40px', display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40 }}>
        {/* Brand */}
        <div>
          <img src="/logo-VeCKA.jpg" alt="VeCKA Talleres" style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 10, marginBottom: 14, display: 'block' }} />
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, lineHeight: 1.7, color: 'oklch(70% 0.01 60)', maxWidth: 260 }}>
            Talleres de costura y moldería para mujeres reales. Con propósito, con calidad, con amor por el oficio.
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 20 }}>
            {['Instagram', 'YouTube', 'TikTok', 'Facebook'].map(sn => (
              <a key={sn} href="#" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(60% 0.01 60)', textDecoration: 'none', letterSpacing: '0.06em' }}>{sn}</a>
            ))}
          </div>
        </div>
        {/* Link columns */}
        {[
          { title: 'Aprende', links: [['Escuela', 'escuela'], ['Club VeCKA', 'escuela'], ['Talleres Online', 'escuela'], ['Clases Presenciales', 'tienda']] },
          { title: 'Tienda', links: [['Moldes Digitales', 'tienda'], ['Moldes Impresos', 'tienda'], ['Mercería', 'tienda'], ['Novedades', 'tienda']] },
          { title: 'Ayuda', links: [['Mi Cuenta', 'cuenta'], ['Contacto', 'contacto'], ['Sobre Mí', 'sobre'], ['Blog', 'blog']] },
        ].map(col => (
          <div key={col.title}>
            <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'oklch(60% 0.01 60)', marginBottom: 16, marginTop: 0 }}>
              {col.title}
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {col.links.map(([label, p]) => (
                <button key={label} onClick={() => navigate(p)}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(70% 0.01 60)', padding: 0 }}>
                  {label}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div style={{ borderTop: '1px solid oklch(25% 0.01 60)', maxWidth: 1280, margin: '0 auto', padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.01 60)' }}>
          © 2026 VeCKA · Buenos Aires, Argentina · consultas@vecka.com.ar
        </span>
        <div style={{ display: 'flex', gap: 8 }}>
          {['MercadoPago', 'MODO', 'PayPal'].map(p => (
            <span key={p} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, background: 'oklch(22% 0.01 50)', padding: '4px 8px', borderRadius: 4, color: 'oklch(60% 0.01 60)' }}>{p}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}
