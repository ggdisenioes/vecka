import { useState, useEffect } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Btn, Badge, inputStyle } from '../components/Primitives';

const STATUS_LABELS = {
  pending: 'Pendiente',
  paid: 'Pagado',
  processing_shipment: 'Preparando',
  shipped: 'Enviado',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};
const STATUS_COLORS = {
  pending: { color: 'oklch(40% 0.1 65)', bg: 'oklch(95% 0.04 65)' },
  paid: { color: '#4a7d6e', bg: '#d4f0e6' },
  processing_shipment: { color: 'oklch(35% 0.09 240)', bg: 'oklch(91% 0.04 240)' },
  shipped: { color: 'oklch(30% 0.09 240)', bg: 'oklch(88% 0.04 240)' },
  delivered: { color: '#4a7d6e', bg: '#d4f0e6' },
  cancelled: { color: '#c0392b', bg: '#fde8e8' },
};

function statusBadge(s) {
  return STATUS_COLORS[s] || STATUS_COLORS.paid;
}

function formatDate(str) {
  if (!str) return '—';
  try { return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' }); } catch { return str; }
}

export default function AdminPage() {
  const { user, navigate, courses, products, fmt, notify } = useVecka();
  const { isMobile } = useResponsive();
  const [section, setSection] = useState('overview');

  // Orders state
  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState(null); // { id, status, tracking }

  // Users state
  const [users, setUsers] = useState(null);

  if (!user || user.role !== 'admin') { navigate('home'); return null; }

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: 'home' },
    { id: 'orders', label: 'Ventas', icon: 'tag' },
    { id: 'products', label: 'Productos', icon: 'package' },
    { id: 'courses', label: 'Cursos', icon: 'book' },
    { id: 'students', label: 'Alumnas', icon: 'user' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  const sidebarW = isMobile ? 0 : 220;

  const loadOrders = () => {
    if (ordersLoading) return;
    setOrdersLoading(true);
    api.allOrders()
      .then(setOrders)
      .catch(() => notify('Error cargando ventas', 'error'))
      .finally(() => setOrdersLoading(false));
  };

  const loadUsers = () => {
    api.users().then(setUsers).catch(() => {});
  };

  useEffect(() => {
    if (section === 'orders' || section === 'overview') loadOrders();
    if (section === 'students') loadUsers();
  }, [section]);

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;
    try {
      await api.updateOrderStatus(editingOrder.id, editingOrder.status, editingOrder.tracking);
      notify('Orden actualizada');
      setEditingOrder(null);
      loadOrders();
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const recentOrders = (orders || []).slice(0, 6);
  const totalRevenue = (orders || []).filter(o => o.status === 'paid' || o.status === 'delivered').reduce((s, o) => s + o.total, 0);

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108, minHeight: '100vh', display: 'flex', background: '#faf5f8' }}>

      {/* Mobile bottom nav */}
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
        <div style={{ width: sidebarW, background: '#fff', borderRight: '1px solid oklch(90% 0.012 60)', position: 'fixed', top: 108, bottom: 0, overflowY: 'auto', zIndex: 50 }}>
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

        {/* OVERVIEW */}
        {section === 'overview' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 34, margin: 0 }}>Buen día, {user.name.split(' ')[0]} ✨</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>
                {new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 16, marginBottom: 24 }}>
              {[
                { label: 'Ingresos confirmados', value: `$${(totalRevenue || 0).toLocaleString('es-AR')}`, sub: 'Órdenes pagadas', icon: 'tag', color: '#f0dee7' },
                { label: 'Órdenes totales', value: (orders || []).length, sub: `${(orders || []).filter(o => o.status === 'pending').length} pendientes`, icon: 'package', color: '#e0f5ee' },
                { label: 'Cursos activos', value: courses.length, sub: '48 clases', icon: 'book', color: 'oklch(93% 0.03 240)' },
                { label: 'Productos', value: products.length, sub: '3 categorías', icon: 'package', color: 'oklch(94% 0.03 60)' },
              ].map(s => (
                <div key={s.label} style={{ background: '#fff', borderRadius: 14, padding: isMobile ? '18px 16px' : '20px 18px', border: '1px solid oklch(90% 0.012 60)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name={s.icon} size={16} color="oklch(40% 0.1 22)" />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, lineHeight: 1 }}>{s.value}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>{s.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#5e9e8a', marginTop: 2 }}>{s.sub}</div>
                </div>
              ))}
            </div>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid oklch(92% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, margin: 0 }}>Ventas recientes</h3>
                <Btn size="sm" variant="ghost" onClick={() => setSection('orders')}>Ver todas</Btn>
              </div>
              {ordersLoading && <div style={{ padding: 24, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(55% 0.018 50)' }}>Cargando...</div>}
              {!ordersLoading && recentOrders.map((o, i) => (
                <div key={o.id} style={{ padding: '14px 20px', borderTop: i > 0 ? '1px solid oklch(93% 0.01 60)' : 'none', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{o.id}</span>
                      <Badge {...statusBadge(o.status)}>{STATUS_LABELS[o.status] || o.status}</Badge>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, marginTop: 2 }}>{o.user_name} — {(o.items_summary || '').split('|')[0].trim()}</div>
                  </div>
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexShrink: 0 }}>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a' }}>${Number(o.total).toLocaleString('es-AR')}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{formatDate(o.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VENTAS */}
        {section === 'orders' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, margin: 0 }}>Ventas</h2>
              <Btn size="sm" variant="ghost" icon="refresh" onClick={loadOrders}>Actualizar</Btn>
            </div>

            {/* Modal de edición */}
            {editingOrder && (
              <>
                <div onClick={() => setEditingOrder(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.4)', zIndex: 1000 }} />
                <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 16, padding: 28, width: 'min(420px, calc(100vw - 32px))', zIndex: 1001, boxShadow: '0 16px 60px rgba(0,0,0,.2)' }}>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginTop: 0, marginBottom: 18 }}>Actualizar orden {editingOrder.id}</h3>
                  <div style={{ marginBottom: 14 }}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.018 50)', display: 'block', marginBottom: 4 }}>Estado</label>
                    <select value={editingOrder.status} onChange={e => setEditingOrder({ ...editingOrder, status: e.target.value })}
                      style={{ ...inputStyle, width: '100%', appearance: 'none' }}>
                      {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div style={{ marginBottom: 20 }}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.018 50)', display: 'block', marginBottom: 4 }}>
                      Número de seguimiento (Correo Argentino)
                    </label>
                    <input value={editingOrder.tracking || ''} onChange={e => setEditingOrder({ ...editingOrder, tracking: e.target.value })}
                      placeholder="Ej: CA123456789AR"
                      style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <Btn size="lg" style={{ flex: 1, justifyContent: 'center' }} onClick={handleUpdateOrder}>Guardar</Btn>
                    <Btn size="lg" variant="outline" onClick={() => setEditingOrder(null)}>Cancelar</Btn>
                  </div>
                </div>
              </>
            )}

            {ordersLoading && <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif" }}>Cargando...</div>}
            {!ordersLoading && (orders || []).length === 0 && <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", color: 'oklch(55% 0.018 50)' }}>Sin ventas aún.</div>}
            {!ordersLoading && (
              <div style={{ display: 'grid', gap: 10 }}>
                {(orders || []).map(o => (
                  <div key={o.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid oklch(88% 0.012 60)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 8, marginBottom: 6 }}>
                      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{o.id}</span>
                        <Badge {...statusBadge(o.status)}>{STATUS_LABELS[o.status] || o.status}</Badge>
                        {o.has_physical ? <Badge color="#5e6e9e" bg="#e8ecf8">📦 Físico</Badge> : null}
                        {o.has_digital ? <Badge color="#3d6b5e" bg="#e0f5ee">📄 Digital</Badge> : null}
                      </div>
                      <Btn size="sm" variant="outline" onClick={() => setEditingOrder({ id: o.id, status: o.status, tracking: o.tracking_number || '' })}>Editar</Btn>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500 }}>{o.user_name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', margin: '2px 0' }}>{o.user_email}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)', marginBottom: 6 }}>{(o.items_summary || '').split('|').join(' · ')}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 6 }}>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a' }}>${Number(o.total).toLocaleString('es-AR')}</span>
                      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                        {o.tracking_number && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(40% 0.018 50)' }}>📦 {o.tracking_number}</span>}
                        <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)' }}>{formatDate(o.created_at)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PRODUCTOS */}
        {section === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, margin: 0 }}>Productos</h2>
              <Btn icon="plus" size="sm" onClick={() => notify('Editor de productos — próximamente')}>Nuevo</Btn>
            </div>
            <div style={{ display: 'grid', gap: 10 }}>
              {products.map(p => (
                <div key={p.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: p.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.title}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)' }}>
                      {p.subcategory} · {p.format === 'PDF' ? '📄 Digital' : p.format === 'Papel' || p.format === 'Físico' ? '📦 Físico' : p.format}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>{fmt(p.price, p.priceUSD)}</div>
                  <Btn size="sm" variant="ghost" onClick={() => notify('Editor próximamente')}>Editar</Btn>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16, background: '#f0faf5', borderRadius: 10, padding: '12px 16px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#3d6b5e' }}>
              📄 Para que los moldes digitales sean descargables, subí los PDFs al servidor en:<br />
              <code style={{ background: '#d4f0e6', padding: '2px 6px', borderRadius: 4, fontSize: 12 }}>backend/uploads/pdfs/product_101.pdf</code><br />
              (reemplazá 101 por el ID del producto correspondiente)
            </div>
          </div>
        )}

        {/* CURSOS */}
        {section === 'courses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, margin: 0 }}>Gestión de Cursos</h2>
              <Btn icon="plus" size="sm" onClick={() => notify('Editor de cursos — próximamente')}>Nuevo</Btn>
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
                  <Btn size="sm" variant="outline" onClick={() => notify('Editor próximamente')}>Editar</Btn>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ALUMNAS */}
        {section === 'students' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 20 }}>Alumnas registradas</h2>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              {!users && <div style={{ padding: 24, textAlign: 'center', fontFamily: "'DM Sans', sans-serif" }}>Cargando...</div>}
              {users && users.filter(u => u.role === 'student').map((s, i) => (
                <div key={s.id} style={{ padding: '14px 18px', borderTop: i > 0 ? '1px solid oklch(93% 0.01 60)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0dee7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>
                    {s.avatar}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{s.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.email}</div>
                  </div>
                  <Badge color="#4a7d6e" bg="#d4f0e6">Activa</Badge>
                </div>
              ))}
              {users && users.filter(u => u.role === 'student').length === 0 && (
                <div style={{ padding: 28, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(55% 0.018 50)' }}>Sin alumnas registradas aún.</div>
              )}
            </div>
          </div>
        )}

        {/* AJUSTES */}
        {section === 'settings' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 22 }}>Configuración</h2>
            {[
              { title: 'Pagos', fields: [['Pasarela principal', 'MercadoPago (Checkout Pro)'], ['Credencial', 'MP_ACCESS_TOKEN en backend/.env'], ['Webhook', 'MP_WEBHOOK_URL en backend/.env']] },
              { title: 'Envíos', fields: [['Transportista', 'Correo Argentino'], ['Costo base', 'SHIPPING_COST en backend/.env'], ['Tiempo estimado', '5-10 días hábiles']] },
              { title: 'Email', fields: [['Proveedor', 'SMTP (Gmail recomendado)'], ['Configuración', 'SMTP_* en backend/.env'], ['Soporte', 'consultas@vecka.com.ar']] },
              { title: 'PDFs', fields: [['Ubicación', 'backend/uploads/pdfs/'], ['Nombre esperado', 'product_<id>.pdf'], ['Expiración de links', '72 hs · 5 descargas']] },
            ].map(group => (
              <div key={group.title} style={{ background: '#fff', borderRadius: 14, padding: '20px 20px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 14 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginTop: 0, marginBottom: 14 }}>{group.title}</h3>
                {group.fields.map(([label, val]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid oklch(93% 0.01 60)', gap: 8 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, textAlign: 'right', maxWidth: '55%' }}>{val}</span>
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
