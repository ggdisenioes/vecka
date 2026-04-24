import { useState, useEffect } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Btn, Badge, ProgressBar, inputStyle } from '../components/Primitives';
import { CourseCard } from '../components/Cards';

const MOCK_PURCHASES = [
  { id: 'ORD-DEMO1', created_at: '2026-03-15T14:00:00', items_summary: 'Molde Remera Básica Adulto', total: 1800, status: 'paid', has_digital: 1, has_physical: 0, downloads: [{ product_title: 'Molde Remera Básica Adulto', token: 'demo-token-1', download_count: 1, max_downloads: 5 }] },
  { id: 'ORD-DEMO2', created_at: '2026-02-02T10:00:00', items_summary: 'Cose desde Cero | Indumentaria Femenina', total: 40500, status: 'paid', has_digital: 0, has_physical: 0, downloads: [] },
  { id: 'ORD-DEMO3', created_at: '2026-01-10T09:00:00', items_summary: 'Club VeCKA — Enero', total: 8500, status: 'paid', has_digital: 0, has_physical: 0, downloads: [] },
];

const labelStyle = { fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.018 50)', marginBottom: 4 };

const STATUS_MAP = {
  pending: { label: 'Pendiente', color: 'oklch(40% 0.1 65)', bg: 'oklch(95% 0.04 65)' },
  paid: { label: 'Pagado', color: '#4a7d6e', bg: '#d4f0e6' },
  processing_shipment: { label: 'Preparando envío', color: 'oklch(35% 0.09 240)', bg: 'oklch(91% 0.04 240)' },
  shipped: { label: 'Enviado', color: 'oklch(35% 0.09 240)', bg: 'oklch(91% 0.04 240)' },
  delivered: { label: 'Entregado', color: '#4a7d6e', bg: '#d4f0e6' },
  cancelled: { label: 'Cancelado', color: '#c0392b', bg: '#fde8e8' },
  Completado: { label: 'Completado', color: '#4a7d6e', bg: '#d4f0e6' },
};

function formatDate(str) {
  try { return new Date(str).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' }); } catch { return str; }
}

export default function CuentaPage() {
  const { user, setUser, navigate, courses, fmt, notify } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const [tab, setTab] = useState('cursos');
  const [orders, setOrders] = useState(null);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', phone: user?.phone || '' });
  const [passForm, setPassForm] = useState({ current: '', next: '' });
  const px = isMobile ? '16px' : isTablet ? '32px' : '80px';

  if (!user) { navigate('home'); return null; }

  const isDemo = !!user.isDemo;
  const enrolledCourses = courses.filter(c => c.enrolled);
  const tabs = [
    { id: 'cursos', label: 'Mis Cursos', icon: 'book' },
    { id: 'compras', label: isMobile ? 'Compras' : 'Mis Compras', icon: 'package' },
    { id: 'perfil', label: isMobile ? 'Perfil' : 'Mi Perfil', icon: 'user' },
  ];

  // Cargar órdenes reales cuando se muestra la pestaña
  useEffect(() => {
    if (tab !== 'compras' || isDemo || orders !== null) return;
    setOrdersLoading(true);
    api.myOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setOrdersLoading(false));
  }, [tab]);

  const displayOrders = isDemo ? MOCK_PURCHASES : (orders || []);

  const handleDownload = (token) => {
    if (isDemo) { notify('Descarga disponible después del pago real'); return; }
    window.open(api.downloadUrl(token), '_blank');
  };

  const handleSaveProfile = async () => {
    if (isDemo) { notify('Guardado disponible con cuenta real'); return; }
    try {
      const updated = await api.updateProfile(profileForm);
      setUser(updated);
      notify('Perfil actualizado');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  const handleChangePassword = async () => {
    if (isDemo) { notify('Disponible con cuenta real'); return; }
    if (!passForm.current || !passForm.next) return;
    try {
      await api.updatePassword(passForm.current, passForm.next);
      setPassForm({ current: '', next: '' });
      notify('Contraseña actualizada');
    } catch (err) {
      notify(err.message, 'error');
    }
  };

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108, minHeight: '100vh', background: '#faf5f8' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid oklch(90% 0.012 60)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: `24px ${px}` }}>
          <div style={{ display: 'flex', alignItems: isMobile ? 'flex-start' : 'center', flexDirection: isMobile ? 'column' : 'row', gap: isMobile ? 16 : 20, marginBottom: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                {user.avatar}
              </div>
              <div>
                <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 26 : 32, margin: 0 }}>
                  Hola, {user.name.split(' ')[0]}
                </h1>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>
                  {isDemo ? 'Modo demo' : `Alumna desde ${user.memberSince || '2024'}`}
                  {isDemo && <span style={{ color: '#e67e22', marginLeft: 8 }}>·</span>}
                  {isDemo && <span style={{ color: '#e67e22', fontSize: 11, marginLeft: 4 }}>Registrate para guardar tu progreso</span>}
                </div>
              </div>
            </div>
            <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', gap: isMobile ? 20 : 28 }}>
              {[[enrolledCourses.length, 'Cursos'], [displayOrders.length, 'Compras']].map(([val, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#5e9e8a' }}>{val}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 0, overflowX: 'auto' }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 7, padding: isMobile ? '10px 16px' : '10px 20px', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#5e9e8a' : 'transparent'}`, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 13 : 14, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#5e9e8a' : 'oklch(52% 0.018 50)', transition: 'all .15s', whiteSpace: 'nowrap' }}>
                <Icon name={t.icon} size={14} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: `32px ${px}` }}>

        {/* MIS CURSOS */}
        {tab === 'cursos' && (
          <div>
            {enrolledCourses.some(c => c.progress > 0 && c.progress < 100) && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 18 }}>Continuá aprendiendo</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
                  {enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).map(c => (
                    <div key={c.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', border: '1px solid oklch(90% 0.012 60)' }}>
                      <div style={{ width: 100, background: c.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 11, color: 'rgba(0,0,0,.35)', textAlign: 'center', padding: 8 }}>{c.title}</div>
                      </div>
                      <div style={{ padding: 16, flex: 1, minWidth: 0 }}>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, margin: '0 0 4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{c.title}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)' }}>
                          <span>Progreso</span><span>{c.progress}%</span>
                        </div>
                        <ProgressBar value={c.progress} />
                        <div style={{ marginTop: 12 }}>
                          <Btn size="sm" onClick={() => navigate('curso', { course: c })}>Continuar</Btn>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 18 }}>Todos mis talleres</h2>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 22 }}>
              {enrolledCourses.map(c => (
                <CourseCard key={c.id} course={c} onClick={() => navigate('curso', { course: c })} />
              ))}
            </div>
          </div>
        )}

        {/* MIS COMPRAS */}
        {tab === 'compras' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 20 }}>Historial de compras</h2>
            {ordersLoading && (
              <div style={{ textAlign: 'center', padding: 40, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(55% 0.018 50)' }}>Cargando...</div>
            )}
            {!ordersLoading && displayOrders.length === 0 && (
              <div style={{ textAlign: 'center', padding: 48, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(55% 0.018 50)' }}>
                Todavía no tenés compras.<br />
                <Btn size="sm" style={{ marginTop: 16 }} onClick={() => navigate('tienda')}>Ir a la tienda</Btn>
              </div>
            )}
            {!ordersLoading && displayOrders.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {displayOrders.map(p => {
                  const statusInfo = STATUS_MAP[p.status] || STATUS_MAP.paid;
                  const hasDownloads = p.has_digital && p.status === 'paid' && p.downloads?.length > 0;
                  return (
                    <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '20px 22px', border: '1px solid oklch(88% 0.012 60)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10, flexWrap: 'wrap', gap: 8 }}>
                        <div>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{p.id}</span>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)', marginLeft: 10 }}>{formatDate(p.created_at)}</span>
                        </div>
                        <Badge color={statusInfo.color} bg={statusInfo.bg}>{statusInfo.label}</Badge>
                      </div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, marginBottom: 8 }}>{p.items_summary}</div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                        <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a' }}>
                          ${Number(p.total).toLocaleString('es-AR')}
                        </span>
                        {p.tracking_number && (
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(40% 0.018 50)' }}>
                            📦 Seguimiento: <strong>{p.tracking_number}</strong>
                          </div>
                        )}
                      </div>

                      {/* Botones de descarga PDF */}
                      {hasDownloads && (
                        <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid oklch(93% 0.01 60)' }}>
                          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.018 50)', marginBottom: 8 }}>Descargas disponibles:</div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {p.downloads.map(d => (
                              <button key={d.token} onClick={() => handleDownload(d.token)}
                                style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', background: '#e8f5f0', border: '1px solid #b0d9c8', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#3d6b5e' }}>
                                <Icon name="download" size={13} color="#3d6b5e" />
                                {d.product_title}
                                <span style={{ fontWeight: 400, color: 'oklch(55% 0.018 50)', fontSize: 11 }}>
                                  ({d.download_count}/{d.max_downloads})
                                </span>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Pendiente de pago */}
                      {p.status === 'pending' && (
                        <div style={{ marginTop: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(40% 0.1 65)', background: 'oklch(97% 0.02 65)', padding: '8px 12px', borderRadius: 8 }}>
                          ⏳ Esperando confirmación del pago. Los accesos se habilitarán automáticamente.
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* MI PERFIL */}
        {tab === 'perfil' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Mi Perfil</h2>
            <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? 22 : 28, border: '1px solid oklch(88% 0.012 60)', marginBottom: 16 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginTop: 0, marginBottom: 16 }}>Datos personales</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 18 }}>
                <div>
                  <label style={{ ...labelStyle, display: 'block' }}>Nombre completo</label>
                  <input value={profileForm.name} onChange={e => setProfileForm({ ...profileForm, name: e.target.value })} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block' }}>Email</label>
                  <input value={user.email} disabled style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', opacity: 0.6 }} />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block' }}>Teléfono</label>
                  <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} placeholder="+54 9 11 ..." />
                </div>
              </div>
              <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSaveProfile}>Guardar cambios</Btn>
            </div>

            {!isDemo && (
              <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? 22 : 28, border: '1px solid oklch(88% 0.012 60)' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginTop: 0, marginBottom: 16 }}>Cambiar contraseña</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                  <div>
                    <label style={{ ...labelStyle, display: 'block' }}>Contraseña actual</label>
                    <input type="password" value={passForm.current} onChange={e => setPassForm({ ...passForm, current: e.target.value })} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ ...labelStyle, display: 'block' }}>Nueva contraseña</label>
                    <input type="password" value={passForm.next} onChange={e => setPassForm({ ...passForm, next: e.target.value })} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <Btn size="lg" variant="outline" style={{ width: '100%', justifyContent: 'center' }} onClick={handleChangePassword} disabled={!passForm.current || !passForm.next}>Cambiar contraseña</Btn>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
