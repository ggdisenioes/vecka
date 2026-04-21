import { useState } from 'react';
import { useVecka, MOCK_USER_STUDENT_DATA } from '../context/VeckaContext';
import Icon from '../components/Icon';
import { Btn, Badge, ProgressBar, inputStyle } from '../components/Primitives';
import { CourseCard } from '../components/Cards';

export default function CuentaPage() {
  const { user, navigate, courses, fmt } = useVecka();
  const [tab, setTab] = useState('cursos');

  if (!user) { navigate('home'); return null; }

  const enrolledCourses = courses.filter(c => c.enrolled);
  const tabs = [
    { id: 'cursos', label: 'Mis Cursos', icon: 'book' },
    { id: 'compras', label: 'Mis Compras', icon: 'package' },
    { id: 'perfil', label: 'Mi Perfil', icon: 'user' },
  ];

  return (
    <div style={{ paddingTop: 108, minHeight: '100vh', background: '#faf5f8' }}>
      {/* Header */}
      <div style={{ background: '#fff', borderBottom: '1px solid oklch(90% 0.012 60)' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '28px 80px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#fff' }}>
              {user.avatar}
            </div>
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, margin: 0, color: 'oklch(18% 0.022 50)' }}>
                Hola, {user.name.split(' ')[0]} 👋
              </h1>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>
                Alumna desde {MOCK_USER_STUDENT_DATA.memberSince}
              </div>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 28 }}>
              {[[enrolledCourses.length, 'Cursos activos'], [MOCK_USER_STUDENT_DATA.completedLessons, 'Clases vistas'], [MOCK_USER_STUDENT_DATA.purchases.length, 'Compras']].map(([val, label]) => (
                <div key={label} style={{ textAlign: 'center' }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#5e9e8a' }}>{val}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)' }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Tabs */}
          <div style={{ display: 'flex', gap: 0 }}>
            {tabs.map(t => (
              <button key={t.id} onClick={() => setTab(t.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', border: 'none', borderBottom: `2px solid ${tab === t.id ? '#5e9e8a' : 'transparent'}`, background: 'transparent', cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: tab === t.id ? 600 : 400, color: tab === t.id ? '#5e9e8a' : 'oklch(52% 0.018 50)', transition: 'all .15s' }}>
                <Icon name={t.icon} size={15} /> {t.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 1280, margin: '0 auto', padding: '40px 80px' }}>
        {tab === 'cursos' && (
          <div>
            {enrolledCourses.some(c => c.progress > 0 && c.progress < 100) && (
              <div style={{ marginBottom: 40 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 20, color: 'oklch(18% 0.022 50)' }}>Continuá aprendiendo</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 20 }}>
                  {enrolledCourses.filter(c => c.progress > 0 && c.progress < 100).map(c => (
                    <div key={c.id} style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', display: 'flex', border: '1px solid oklch(90% 0.012 60)', boxShadow: '0 2px 12px rgba(0,0,0,.05)' }}>
                      <div style={{ width: 120, background: c.color, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 12, color: 'rgba(0,0,0,.35)', textAlign: 'center', padding: 8 }}>{c.title}</div>
                      </div>
                      <div style={{ padding: '20px', flex: 1 }}>
                        <Badge color="#5e9e8a" bg="#e0f5ee">{c.category}</Badge>
                        <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, margin: '8px 0 4px', color: 'oklch(18% 0.022 50)' }}>{c.title}</h3>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)' }}>
                          <span>Progreso</span><span>{c.progress}%</span>
                        </div>
                        <ProgressBar value={c.progress} />
                        <div style={{ marginTop: 14 }}>
                          <Btn size="sm" onClick={() => navigate('curso', { course: c })}>Continuar clase</Btn>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 20, color: 'oklch(18% 0.022 50)' }}>Todos mis talleres</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 22 }}>
              {enrolledCourses.map(c => (
                <CourseCard key={c.id} course={c} onClick={() => navigate('curso', { course: c })} />
              ))}
            </div>
            <div style={{ marginTop: 28, padding: 24, background: '#f0dee7', borderRadius: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: 'oklch(35% 0.1 22)', marginBottom: 4 }}>Explorá más talleres</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(45% 0.08 22)' }}>Tenemos más de 24 talleres esperándote</div>
              </div>
              <Btn onClick={() => navigate('escuela')}>Ver escuela completa</Btn>
            </div>
          </div>
        )}

        {tab === 'compras' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 24 }}>Historial de compras</h2>
            <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', border: '1px solid oklch(88% 0.012 60)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 120px 100px', padding: '14px 24px', background: 'oklch(96% 0.012 60)', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: 'oklch(52% 0.018 50)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                {['Orden', 'Producto', 'Fecha', 'Total', 'Estado'].map(h => <div key={h}>{h}</div>)}
              </div>
              {MOCK_USER_STUDENT_DATA.purchases.map(p => (
                <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '120px 1fr 1fr 120px 100px', padding: '18px 24px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#5e9e8a' }}>{p.id}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(18% 0.022 50)' }}>{p.items}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)' }}>{p.date}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a' }}>${p.total.toLocaleString('es-AR')}</div>
                  <Badge color="#4a7d6e" bg="#d4f0e6">{p.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'perfil' && (
          <div style={{ maxWidth: 560 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 24 }}>Mi Perfil</h2>
            <div style={{ background: '#fff', borderRadius: 16, padding: 32, border: '1px solid oklch(88% 0.012 60)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 24 }}>
                {[['Nombre completo', user.name], ['Email', user.email], ['Contraseña', '••••••••']].map(([label, val]) => (
                  <div key={label}>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: 'oklch(52% 0.018 50)', display: 'block', marginBottom: 6, letterSpacing: '0.05em' }}>{label}</label>
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
