import { useEffect, useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from '../components/Icon';
import { Btn, Badge, ProgressBar, inputStyle } from '../components/Primitives';
import { CourseCard } from '../components/Cards';

function firstName(value) {
  const name = String(value || '').trim();
  return name ? name.split(/\s+/)[0] : 'Hola';
}

function countCourseLessons(course) {
  if (typeof course?.lessons === 'number') return course.lessons;
  if (course?.lessons === '∞') return 0;
  if (Array.isArray(course?.modules)) {
    return course.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
  }
  return 0;
}

function membershipStartLabel(memberships = []) {
  const values = memberships
    .map((membership) => membership.startsAt || membership.grantedAt)
    .filter(Boolean)
    .map((value) => new Date(value))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());

  if (values.length === 0) return null;
  return values[0].toLocaleDateString('es-AR', { month: 'long', year: 'numeric' });
}

export default function CuentaPage() {
  const { user, navigate, courses, userMemberships, userPurchases, updateUserProfile, notify } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const [tab, setTab] = useState('cursos');
  const [profileForm, setProfileForm] = useState({ fullName: user?.name || '', password: '', confirmPassword: '' });
  const [profileError, setProfileError] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const px = isMobile ? '16px' : isTablet ? '32px' : '80px';

  useEffect(() => {
    setProfileForm((current) => ({
      ...current,
      fullName: user?.name || '',
    }));
  }, [user?.name]);

  const setProfileField = (field, value) => {
    setProfileError('');
    setProfileForm((current) => ({ ...current, [field]: value }));
  };

  const handleProfileSubmit = async (event) => {
    event.preventDefault();
    setProfileError('');

    const fullName = profileForm.fullName.trim();
    const password = profileForm.password;
    const confirmPassword = profileForm.confirmPassword;

    if (!fullName) {
      setProfileError('Ingresá tu nombre completo.');
      return;
    }

    if (password || confirmPassword) {
      if (password.length < 8) {
        setProfileError('La contraseña debe tener al menos 8 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setProfileError('Las contraseñas no coinciden.');
        return;
      }
    }

    setProfileSaving(true);
    try {
      await updateUserProfile({
        fullName,
        password: password || undefined,
      });
      setProfileForm((current) => ({ ...current, password: '', confirmPassword: '' }));
      notify('Perfil actualizado correctamente.');
    } catch (error) {
      setProfileError(error.message || 'No pudimos guardar los cambios.');
    } finally {
      setProfileSaving(false);
    }
  };

  if (!user) { navigate('home'); return null; }

  const accessibleCourses = courses.filter((course) => course.enrolled || course.canAccess);
  const enrolledCourses = accessibleCourses.filter((course) => course.enrolled);
  const activeMemberships = (userMemberships || []).filter(m => m.accessStatus === 'active');
  const purchases = userPurchases || [];
  const coursesInProgress = accessibleCourses.filter((course) => course.progress > 0 && course.progress < 100);
  const lessonsCount = accessibleCourses.reduce((sum, course) => sum + countCourseLessons(course), 0);
  const studentSince = membershipStartLabel(activeMemberships);
  const tabs = [
    { id: 'cursos', label: 'Mis Cursos', icon: 'book' },
    ...(activeMemberships.length > 0 ? [{ id: 'membresia', label: isMobile ? 'Membresía' : 'Mi Membresía', icon: 'star' }] : []),
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
                  Hola, {firstName(user.name)} 👋
                </h1>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>
                  {studentSince ? `Miembro desde ${studentSince}` : user.email}
                </div>
              </div>
            </div>
            <div style={{ marginLeft: isMobile ? 0 : 'auto', display: 'flex', gap: isMobile ? 20 : 28 }}>
              {[[accessibleCourses.length, 'Cursos'], [lessonsCount, 'Clases'], [purchases.length, 'Compras']].map(([val, label]) => (
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
            {coursesInProgress.length > 0 && (
              <div style={{ marginBottom: 36 }}>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 18 }}>Continuá aprendiendo</h2>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 16 }}>
                  {coursesInProgress.map(c => (
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
            {accessibleCourses.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid oklch(88% 0.012 60)', fontFamily: "'DM Sans', sans-serif", color: 'oklch(52% 0.018 50)' }}>
                Todavía no tenés talleres disponibles en tu cuenta.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 22 }}>
                {accessibleCourses.map(c => (
                  <CourseCard key={c.id} course={c} onClick={() => navigate('curso', { course: c })} />
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'membresia' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 20 }}>Mi Membresía</h2>
            {activeMemberships.length === 0 ? (
              <div style={{ background: '#fff', borderRadius: 16, padding: 28, border: '1px solid oklch(88% 0.012 60)', fontFamily: "'DM Sans', sans-serif", color: 'oklch(52% 0.018 50)' }}>
                No tenés membresías activas.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {activeMemberships.map(m => {
                  const expires = m.expiresAt ? new Date(m.expiresAt) : null;
                  const daysLeft = expires ? Math.ceil((expires - new Date()) / 86400000) : null;
                  const periodLabel = m.billingPeriod === 'monthly' ? 'mensual' : m.billingPeriod === 'annual' ? 'anual' : m.billingPeriod === 'lifetime' ? 'vitalicia' : '';
                  return (
                    <div key={m.id} style={{ background: '#fff', borderRadius: 16, padding: isMobile ? 20 : 28, border: '1px solid oklch(88% 0.012 60)' }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 14 }}>
                        <div>
                          <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700 }}>{m.tierName}</div>
                          {periodLabel && (
                            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#5e9e8a', fontWeight: 600, marginTop: 2 }}>
                              Membresía {periodLabel}
                            </div>
                          )}
                        </div>
                        <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: 20, background: '#d4f0e6', color: '#2e7d6a', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap' }}>
                          Activa
                        </span>
                      </div>
                      {m.description ? (
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)', marginBottom: 14 }}>{m.description}</div>
                      ) : null}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 18, marginBottom: m.features?.length ? 16 : 0, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)' }}>
                        {m.startsAt && (
                          <span>Inicio: <strong>{new Date(m.startsAt).toLocaleDateString('es-AR')}</strong></span>
                        )}
                        {expires ? (
                          <span>
                            Vence: <strong>{expires.toLocaleDateString('es-AR')}</strong>
                            {daysLeft !== null && daysLeft <= 30 && (
                              <span style={{ marginLeft: 6, color: daysLeft <= 7 ? '#c0392b' : '#e67e22', fontWeight: 700 }}>
                                ({daysLeft <= 0 ? 'Expirada' : `${daysLeft}d restantes`})
                              </span>
                            )}
                          </span>
                        ) : (
                          <span style={{ color: '#5e9e8a', fontWeight: 600 }}>Sin vencimiento</span>
                        )}
                      </div>
                      {m.features?.length > 0 && (
                        <ul style={{ margin: '10px 0 0', paddingLeft: 18, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(40% 0.018 50)', lineHeight: 1.7 }}>
                          {m.features.map((f, i) => <li key={i}>{f}</li>)}
                        </ul>
                      )}
                      {m.tierSlug && (
                        <div style={{ marginTop: 16 }}>
                          <a href={`/membresias/${m.tierSlug}`} style={{ display: 'inline-block', padding: '9px 20px', background: '#5e9e8a', color: '#fff', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, textDecoration: 'none' }}>
                            Ver contenido de la membresía →
                          </a>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'compras' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 20 }}>Historial de compras</h2>
            {purchases.length === 0 ? null : isMobile ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {purchases.map(p => (
                  <div key={p.id} style={{ background: '#fff', borderRadius: 14, padding: '18px 18px', border: '1px solid oklch(88% 0.012 60)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{p.id}</span>
                      <Badge color="#4a7d6e" bg="#d4f0e6">{p.status}</Badge>
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500, marginBottom: 4 }}>{p.items}</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{p.date ? new Date(p.date).toLocaleDateString('es-AR') : ''}</span>
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
                {purchases.map(p => (
                  <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '130px 1fr 1fr 130px 110px', padding: '16px 22px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center' }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{p.id}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>{p.items}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)' }}>{p.date ? new Date(p.date).toLocaleDateString('es-AR') : ''}</div>
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
            <form onSubmit={handleProfileSubmit} style={{ background: '#fff', borderRadius: 16, padding: isMobile ? 22 : 28, border: '1px solid oklch(88% 0.012 60)' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 22 }}>
                <div>
                  <label style={{ ...labelStyle, display: 'block' }}>Nombre completo</label>
                  <input
                    value={profileForm.fullName}
                    onChange={(event) => setProfileField('fullName', event.target.value)}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    required
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block' }}>Email</label>
                  <input
                    value={user.email}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box', color: 'oklch(50% 0.018 50)' }}
                    readOnly
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block' }}>Nueva contraseña (opcional)</label>
                  <input
                    type="password"
                    value={profileForm.password}
                    onChange={(event) => setProfileField('password', event.target.value)}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    minLength={8}
                    placeholder="Dejala vacía si no querés cambiarla"
                  />
                </div>
                <div>
                  <label style={{ ...labelStyle, display: 'block' }}>Repetir nueva contraseña</label>
                  <input
                    type="password"
                    value={profileForm.confirmPassword}
                    onChange={(event) => setProfileField('confirmPassword', event.target.value)}
                    style={{ ...inputStyle, width: '100%', boxSizing: 'border-box' }}
                    minLength={8}
                    placeholder="Repetí la contraseña nueva"
                  />
                </div>
              </div>
              {profileError && (
                <div style={{ marginBottom: 16, borderRadius: 10, padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, background: '#fce8e1', color: '#8a3b26' }}>
                  {profileError}
                </div>
              )}
              <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} disabled={profileSaving}>
                {profileSaving ? 'Guardando...' : 'Guardar cambios'}
              </Btn>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
