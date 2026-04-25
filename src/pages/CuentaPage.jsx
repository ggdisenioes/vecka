import { useState } from 'react';
import { useVecka, MOCK_USER_STUDENT_DATA } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from '../components/Icon';
import { Btn, Badge, ProgressBar, inputStyle, labelStyle } from '../components/Primitives';
import { CourseCard } from '../components/Cards';

export default function CuentaPage() {
  const { user, navigate, courses, fmt } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const [tab, setTab] = useState('cursos');
  const px = isMobile ? '16px' : isTablet ? '32px' : '80px';

  if (!user) { navigate('home'); return null; }

  const enrolledCourses = courses.filter(c => c.enrolled);
  const tabs = [
    { id: 'cursos', label: 'Mis Cursos', icon: 'book' },
    { id: 'compras', label: isMobile ? 'Compras' : 'Mis Compras', icon: 'package' },
    { id: 'perfil', label: isMobile ? 'Perfil' : 'Mi Perfil', icon: 'user' },
  ];

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
                  Hola, {user.name.split(' ')[0]} 👋
                </h1>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>
                  Alumna desde {MOCK_USER_STUDENT_DATA.memberSince}
                </div>
              </div>
            </div>
            <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', gap: isMobile ? 20 : 28 }}>
              {[[enrolledCourses.length, 'Cursos'], [MOCK_USER_STUDENT_DATA.completedLessons, 'Clases'], [MOCK_USER_STUDENT_DATA.purchases.length, 'Compras']].map(([val, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#5e9e8a' }}>{val}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Tabs */}
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
                      <div style={{ padding: '16px', flex: 1, minWidth: 0 }}>
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

        {tab === 'compras' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 20 }}>Historial de compras</h2>
            {isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {MOCK_USER_STUDENT_DATA.purchases.map(p => (
                  <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 18px', border: '1px solid oklch(88% 0.012 60)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{p.id}</span>
                      <Badge color="#4a7d6e" bg="#d4f0e6">{p.status}</Badge>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{p.items}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{p.date}</span>
                      <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a' }}>${p.total.toLocaleString('es-AR')}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid oklch(88% 0.012 60)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 130px 110px', padding: '13px 22px', background: 'oklch(96% 0.012 60)', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'oklch(52% 0.018 50)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  {['Orden', 'Producto', 'Fecha', 'Total', 'Estado'].map(h => <div key={h}>{h}</div>)}
                </div>
                {MOCK_USER_STUDENT_DATA.purchases.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 130px 110px', padding: '16px 22px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{p.id}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{p.items}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)' }}>{p.date}</div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a' }}>${p.total.toLocaleString('es-AR')}</div>
                    <Badge color="#4a7d6e" bg="#d4f0e6">{p.status}</Badge>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'perfil' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Mi Perfil</h2>
            <div style={{ background: '#fff', borderRadius: 16, padding: isMobile ? 22 : 28, border: '1px solid oklch(88% 0.012 60)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
                {[['Nombre completo', user.name], ['Email', user.email], ['Contraseña', '••••••••']].map(([label, val]) => (
                  <div key={label}>
                    <label style={{ ...labelStyle, display: 'block' }}>{label}</label>
                    <input defaultValue={val} style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }} />
                  </div>
                ))}
              </div>
              <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }}>Guardar cambios</Btn>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
