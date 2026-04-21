import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import Icon from '../components/Icon';
import { Btn, Badge } from '../components/Primitives';

const RECENT_ORDERS = [
  { id: 'ORD-1124', student: 'María González', item: 'Cose desde Cero', amount: '$18.500', status: 'Completado', date: 'Hoy 14:32' },
  { id: 'ORD-1123', student: 'Laura Pérez', item: 'Molde Vestido Camisero', amount: '$2.200', status: 'Completado', date: 'Hoy 11:05' },
  { id: 'ORD-1122', student: 'Ana Rodríguez', item: 'Club VeCKA', amount: '$8.500', status: 'Pendiente', date: 'Ayer 18:20' },
  { id: 'ORD-1121', student: 'Claudia Méndez', item: 'Indumentaria Femenina', amount: '$22.000', status: 'Completado', date: 'Ayer 09:15' },
  { id: 'ORD-1120', student: 'Patricia Gastal', item: 'Kit Entretelas', amount: '$4.800', status: 'Enviado', date: '19 Abr' },
];

export default function AdminPage() {
  const { user, navigate, courses, products, fmt, notify } = useVecka();
  const [section, setSection] = useState('overview');

  if (!user || user.role !== 'admin') { navigate('home'); return null; }

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: 'home' },
    { id: 'courses', label: 'Cursos', icon: 'book' },
    { id: 'products', label: 'Productos', icon: 'package' },
    { id: 'orders', label: 'Ventas', icon: 'tag' },
    { id: 'students', label: 'Alumnas', icon: 'user' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  const stats = [
    { label: 'Ventas este mes', value: '$284.500', sub: '+18% vs mes anterior', icon: 'tag', color: '#f0dee7' },
    { label: 'Alumnas activas', value: '5.412', sub: '+64 esta semana', icon: 'user', color: '#e0f5ee' },
    { label: 'Cursos activos', value: '6', sub: '48 clases publicadas', icon: 'book', color: 'oklch(93% 0.03 240)' },
    { label: 'Productos en tienda', value: '9', sub: '3 con stock bajo', icon: 'package', color: 'oklch(94% 0.03 60)' },
  ];

  const statusBadge = (status) => {
    const map = {
      'Completado': { color: '#4a7d6e', bg: '#d4f0e6' },
      'Pendiente': { color: 'oklch(40% 0.1 65)', bg: 'oklch(95% 0.04 65)' },
      'Enviado': { color: 'oklch(35% 0.09 240)', bg: 'oklch(91% 0.04 240)' },
    };
    return map[status] || { color: '#4a7d6e', bg: '#d4f0e6' };
  };

  return (
    <div style={{ paddingTop: 108, minHeight: '100vh', display: 'flex', background: '#faf5f8' }}>
      {/* Sidebar */}
      <div style={{ width: 240, background: '#fff', borderRight: '1px solid oklch(90% 0.012 60)', position: 'fixed', top: 108, bottom: 0, overflowY: 'auto', zIndex: 50 }}>
        <div style={{ padding: '24px 16px' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(60% 0.012 60)', marginBottom: 8, paddingLeft: 12 }}>Panel Admin</div>
          {navItems.map(item => (
            <button key={item.id} onClick={() => setSection(item.id)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '10px 12px', border: 'none', borderRadius: 10, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: section === item.id ? 600 : 400, background: section === item.id ? '#f0dee7' : 'transparent', color: section === item.id ? '#5e9e8a' : 'oklch(35% 0.018 50)', transition: 'all .15s', marginBottom: 2, textAlign: 'left' }}>
              <Icon name={item.icon} size={16} color={section === item.id ? '#5e9e8a' : 'oklch(55% 0.018 50)'} />
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main area */}
      <div style={{ marginLeft: 240, flex: 1, padding: '36px 40px', minWidth: 0 }}>
        {section === 'overview' && (
          <div>
            <div style={{ marginBottom: 28 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, margin: 0, color: 'oklch(18% 0.022 50)' }}>Buen día, Vero ✨</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>Lunes 21 de abril, 2026</p>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 18, marginBottom: 28 }}>
              {stats.map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 16, padding: '22px 20px', border: '1px solid oklch(90% 0.012 60)' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
                    <Icon name={s.icon} size={18} color="oklch(40% 0.1 22)" />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: 'oklch(18% 0.022 50)', lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', marginTop: 6 }}>{s.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: '#5e9e8a', marginTop: 4 }}>{s.sub}</div>
                </div>
              ))}
            </div>

            {/* Recent orders */}
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
              <div style={{ padding: '20px 24px', borderBottom: '1px solid oklch(92% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, margin: 0 }}>Ventas recientes</h3>
                <Btn size="sm" variant="ghost" onClick={() => setSection('orders')}>Ver todas</Btn>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ background: 'oklch(96.5% 0.01 60)' }}>
                      {['Orden', 'Alumna', 'Producto', 'Monto', 'Estado', 'Fecha'].map(h => (
                        <th key={h} style={{ padding: '10px 20px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'oklch(52% 0.018 50)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {RECENT_ORDERS.map(o => (
                      <tr key={o.id} style={{ borderTop: '1px solid oklch(93% 0.01 60)' }}>
                        <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#5e9e8a' }}>{o.id}</td>
                        <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{o.student}</td>
                        <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>{o.item}</td>
                        <td style={{ padding: '14px 20px', fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a' }}>{o.amount}</td>
                        <td style={{ padding: '14px 20px' }}>
                          <Badge {...statusBadge(o.status)}>{o.status}</Badge>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{o.date}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {section === 'courses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, margin: 0 }}>Gestión de Cursos</h2>
              <Btn icon="plus" onClick={() => notify('Función de creación próximamente')}>Nuevo curso</Btn>
            </div>
            <div style={{ display: 'grid', gap: 14 }}>
              {courses.map(c => (
                <div key={c.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 22px', border: '1px solid oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', gap: 18 }}>
                  <div style={{ width: 52, height: 52, borderRadius: 10, background: c.color, flexShrink: 0 }} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600 }}>{c.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)', marginTop: 2 }}>{c.category} · {c.level} · {c.students.toLocaleString()} alumnas</div>
                  </div>
                  <Badge color={c.enrolled ? '#4a7d6e' : 'oklch(40% 0.018 50)'} bg={c.enrolled ? '#d4f0e6' : 'oklch(92% 0.012 60)'}>
                    {c.enrolled ? 'Publicado' : 'Borrador'}
                  </Badge>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a', minWidth: 80, textAlign: 'right' }}>{fmt(c.price, c.priceUSD)}</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Btn size="sm" variant="outline" onClick={() => notify('Editor de curso próximamente')}>Editar</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => navigate('curso', { course: c })}>Ver</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, margin: 0 }}>Gestión de Productos</h2>
              <Btn icon="plus" onClick={() => notify('Editor de productos próximamente')}>Nuevo producto</Btn>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '60px 1fr 130px 100px 100px 120px', padding: '12px 20px', background: 'oklch(96% 0.01 60)', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'oklch(52% 0.018 50)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {['', 'Producto', 'Categoría', 'Formato', 'Precio', 'Acciones'].map(h => <div key={h}>{h}</div>)}
              </div>
              {products.map(p => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '60px 1fr 130px 100px 100px 120px', padding: '14px 20px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: p.color }} />
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500 }}>{p.title}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)' }}>{p.subcategory}</div>
                  <Badge>{p.format}</Badge>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a' }}>{fmt(p.price, p.priceUSD)}</div>
                  <Btn size="sm" variant="outline" onClick={() => notify('Editor próximamente')}>Editar</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'students' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, margin: 0 }}>Alumnas</h2>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)' }}>5.412 alumnas registradas</div>
            </div>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              {[
                { name: 'María González', email: 'maria@gmail.com', courses: 3, joined: '15 Mar 2024', status: 'Activa' },
                { name: 'Laura Pérez', email: 'laura.perez@gmail.com', courses: 1, joined: '02 Ene 2025', status: 'Activa' },
                { name: 'Ana Rodríguez', email: 'ana.rod@outlook.com', courses: 5, joined: '28 Jun 2023', status: 'Club' },
                { name: 'Patricia Gastal', email: 'patrigas@gmail.com', courses: 2, joined: '10 Abr 2025', status: 'Activa' },
                { name: 'Claudia Méndez', email: 'cme@yahoo.com.ar', courses: 4, joined: '03 Feb 2024', status: 'Club' },
              ].map((s, i) => (
                <div key={i} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 80px 120px 80px', padding: '16px 24px', borderTop: i > 0 ? '1px solid oklch(93% 0.01 60)' : 'none', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#f0dee7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>
                      {s.name[0]}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)' }}>{s.email}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, textAlign: 'center' }}>{s.courses} cursos</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{s.joined}</div>
                  <Badge color="#4a7d6e" bg={s.status === 'Club' ? '#f0dee7' : '#d4f0e6'}>{s.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'orders' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, marginBottom: 24 }}>Historial de Ventas</h2>
            <div style={{ background: '#fff', borderRadius: 16, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: 'oklch(96% 0.01 60)' }}>
                    {['Orden', 'Alumna', 'Producto', 'Monto', 'Estado', 'Fecha'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'oklch(52% 0.018 50)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {RECENT_ORDERS.map(o => (
                    <tr key={o.id} style={{ borderTop: '1px solid oklch(93% 0.01 60)' }}>
                      <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#5e9e8a' }}>{o.id}</td>
                      <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{o.student}</td>
                      <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>{o.item}</td>
                      <td style={{ padding: '14px 20px', fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a' }}>{o.amount}</td>
                      <td style={{ padding: '14px 20px' }}>
                        <Badge {...statusBadge(o.status)}>{o.status}</Badge>
                      </td>
                      <td style={{ padding: '14px 20px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{o.date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {section === 'settings' && (
          <div style={{ maxWidth: 600 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, marginBottom: 28 }}>Configuración</h2>
            {[
              { section: 'Tienda', fields: [['Moneda base', 'ARS'], ['Moneda internacional', 'USD'], ['Pasarelas activas', 'MercadoPago, MODO, PayPal']] },
              { section: 'Escuela', fields: [['Plataforma de video', 'Interno'], ['Certificados', 'Activados'], ['Soporte por email', 'consultas@vecka.com.ar']] },
            ].map(group => (
              <div key={group.section} style={{ background: '#fff', borderRadius: 16, padding: 24, border: '1px solid oklch(88% 0.012 60)', marginBottom: 18 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginTop: 0, marginBottom: 18 }}>{group.section}</h3>
                {group.fields.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(40% 0.018 50)' }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{val}</span>
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
