import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from '../components/Icon';
import { Btn, Badge } from '../components/Primitives';

const RECENT_ORDERS = [
  { id: 'ORD-1124', student: 'María González', item: 'Cose desde Cero', amount: '$18.500', status: 'Completado', date: 'Hoy 14:32' },
  { id: 'ORD-1123', student: 'Laura Pérez', item: 'Molde Vestido Camisero', amount: '$2.200', status: 'Completado', date: 'Hoy 11:05' },
  { id: 'ORD-1122', student: 'Ana Rodríguez', item: 'Club VeCKA', amount: '$8.500', status: 'Pendiente', date: 'Ayer 18:20' },
  { id: 'ORD-1121', student: 'Claudia Méndez', item: 'Indumentaria Femenina', amount: '$22.000', status: 'Completado', date: 'Ayer 09:15' },
];

const statusBadge = (s) => ({ 'Completado': { color: '#4a7d6e', bg: '#d4f0e6' }, 'Pendiente': { color: 'oklch(40% 0.1 65)', bg: 'oklch(95% 0.04 65)' }, 'Enviado': { color: 'oklch(35% 0.09 240)', bg: 'oklch(91% 0.04 240)' } }[s] || { color: '#4a7d6e', bg: '#d4f0e6' });

export default function AdminPage() {
  const { user, navigate, courses, products, fmt, notify } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const [section, setSection] = useState('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!user || user.role !== 'admin') { navigate('home'); return null; }

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: 'home' },
    { id: 'courses', label: 'Cursos', icon: 'book' },
    { id: 'products', label: 'Productos', icon: 'package' },
    { id: 'orders', label: 'Ventas', icon: 'tag' },
    { id: 'students', label: 'Alumnas', icon: 'user' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  const sidebarW = isMobile ? 0 : 220;

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108, minHeight: '100vh', display: 'flex', background: '#faf5f8' }}>
      {/* Mobile nav bar */}
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid oklch(90% 0.012 60)', zIndex: 200, display: 'flex', padding: '8px 0 12px' }}>
          {navItems.slice(0, 5).map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0' }}>
              <Icon name={item.icon} size={18} color={section === item.id ? '#5e9e8a' : 'oklch(60% 0.018 50)'} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: section === item.id ? 700 : 400, color: section === item.id ? '#5e9e8a' : 'oklch(60% 0.018 50)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Desktop sidebar */}
      {!isMobile && (
        <div style={{ width: sidebarW, background: '#fff', borderRight: '1px solid oklch(90% 0.012 60)', position: 'fixed', top: 108, bottom: 0, overflowY: 'auto', zIndex: 50, flexShrink: 0 }}>
          <div style={{ padding: '20px 12px' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(60% 0.012 60)', marginBottom: 8, paddingLeft: 10 }}>Panel Admin</div>
            {navItems.map(item => (
              <button key={item.id} onClick={() => setSection(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: section === item.id ? 600 : 400, background: section === item.id ? '#f0dee7' : 'transparent', color: section === item.id ? '#5e9e8a' : 'oklch(35% 0.018 50)', transition: 'all .15s', marginBottom: 2, textAlign: 'left' }}>
                <Icon name={item.icon} size={15} color={section === item.id ? '#5e9e8a' : 'oklch(55% 0.018 50)'} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main */}
      <div style={{ marginLeft: isMobile ? 0 : sidebarW, flex: 1, padding: isMobile ? '24px 16px 80px' : '32px 36px', minWidth: 0 }}>
        {section === 'overview' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 34, margin: 0 }}>Buen día, Vero ✨</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>Lunes 21 de abril, 2026</p>
            </div>
            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 16, marginBottom: 24 }}>
              {[
                { label: 'Ventas este mes', value: '$284.500', sub: '+18% vs anterior', icon: 'tag', color: '#f0dee7' },
                { label: 'Alumnas activas', value: '5.412', sub: '+64 esta semana', icon: 'user', color: '#e0f5ee' },
                { label: 'Cursos activos', value: '6', sub: '48 clases', icon: 'book', color: 'oklch(93% 0.03 240)' },
                { label: 'Productos', value: '9', sub: '3 con stock bajo', icon: 'package', color: 'oklch(94% 0.03 60)' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: isMobile ? '18px 16px' : '20px 18px', border: '1px solid oklch(90% 0.012 60)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name={s.icon} size={16} color="oklch(40% 0.1 22)" />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#5e9e8a', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            {/* Orders table */}
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid oklch(92% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, margin: 0 }}>Ventas recientes</h3>
                <Btn size="sm" variant="ghost" onClick={() => setSection('orders')}>Ver todas</Btn>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {isMobile ? (
                  <div>
                    {RECENT_ORDERS.map(o => (
                      <div key={o.id} style={{ padding: '14px 18px', borderTop: '1px solid oklch(93% 0.01 60)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{o.id}</span>
                          <Badge {...statusBadge(o.status)}>{o.status}</Badge>
                        </div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>{o.student}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{o.date}</span>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a' }}>{o.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'oklch(96.5% 0.01 60)' }}>
                        {['Orden', 'Alumna', 'Producto', 'Monto', 'Estado', 'Fecha'].map(h => (
                          <th key={h} style={{ padding: '10px 18px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'oklch(52% 0.018 50)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_ORDERS.map(o => (
                        <tr key={o.id} style={{ borderTop: '1px solid oklch(93% 0.01 60)' }}>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{o.id}</td>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{o.student}</td>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>{o.item}</td>
                          <td style={{ padding: '13px 18px', fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a' }}>{o.amount}</td>
                          <td style={{ padding: '13px 18px' }}><Badge {...statusBadge(o.status)}>{o.status}</Badge></td>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{o.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {section === 'courses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, margin: 0 }}>Gestión de Cursos</h2>
              <Btn icon="plus" size="sm" onClick={() => notify('Función de creación próximamente')}>Nuevo</Btn>
            </div>
            <div style={{ display: 'grid', gap: 12 }}>
              {courses.map(c => (
                <div key={c.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 9, background: c.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)', marginTop: 2 }}>{c.category} · {c.students.toLocaleString()} alumnas</div>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>{fmt(c.price, c.priceUSD)}</div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Btn size="sm" variant="outline" onClick={() => notify('Editor próximamente')}>Editar</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, margin: 0 }}>Productos</h2>
              <Btn icon="plus" size="sm" onClick={() => notify('Editor próximamente')}>Nuevo</Btn>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {products.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)' }}>{p.subcategory} · {p.format}</div>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>{fmt(p.price, p.priceUSD)}</div>
                  <Btn size="sm" variant="ghost" onClick={() => notify('Editor próximamente')}>Editar</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'orders' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 20 }}>Ventas</h2>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              {RECENT_ORDERS.map((o, i) => (
                <div key={o.id} style={{ padding: '14px 18px', borderTop: i > 0 ? '1px solid oklch(93% 0.01 60)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{o.id}</span>
                    <Badge {...statusBadge(o.status)}>{o.status}</Badge>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500 }}>{o.student} — {o.item}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{o.date}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a' }}>{o.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'students' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 20 }}>Alumnas</h2>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              {[
                { name: 'María González', email: 'maria@gmail.com', courses: 3, joined: '15 Mar 2024', status: 'Activa' },
                { name: 'Laura Pérez', email: 'laura.perez@gmail.com', courses: 1, joined: '02 Ene 2025', status: 'Activa' },
                { name: 'Ana Rodríguez', email: 'ana.rod@outlook.com', courses: 5, joined: '28 Jun 2023', status: 'Club' },
              ].map((s, i) => (
                <div key={i} style={{ padding: '14px 18px', borderTop: i > 0 ? '1px solid oklch(93% 0.01 60)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0dee7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>
                    {s.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                  </div>
                  <Badge color="#4a7d6e" bg={s.status === 'Club' ? '#f0dee7' : '#d4f0e6'}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'settings' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 22 }}>Configuración</h2>
            {[
              { section: 'Tienda', fields: [['Moneda base', 'ARS'], ['Pasarelas activas', 'MercadoPago, MODO, PayPal']] },
              { section: 'Escuela', fields: [['Certificados', 'Activados'], ['Soporte por email', 'consultas@vecka.com.ar']] },
            ].map(group => (
              <div key={group.section} style={{ background: '#fff', borderRadius: 14, padding: '20px 20px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 14 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginTop: 0, marginBottom: 14 }}>{group.section}</h3>
                {group.fields.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>{val}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
