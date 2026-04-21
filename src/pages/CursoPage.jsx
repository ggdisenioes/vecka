import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import Icon from '../components/Icon';
import { Btn, Badge, Stars, ProgressBar } from '../components/Primitives';
import Footer from '../components/Footer';

export default function CursoPage() {
  const { selectedCourse, navigate, addToCart, fmt, user, setAuthModal } = useVecka();
  const course = selectedCourse;
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [playing, setPlaying] = useState(false);

  if (!course) { navigate('escuela'); return null; }

  const isEnrolled = course.enrolled;
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedCount = Math.round((course.progress / 100) * totalLessons);

  // Player mode
  if (isEnrolled && course.modules.length > 0) {
    const mod = course.modules[activeModule];
    const lesson = mod?.lessons[activeLesson];

    return (
      <div style={{ paddingTop: 108, minHeight: '100vh', background: 'oklch(14% 0.02 50)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'oklch(18% 0.02 50)', padding: '0 24px', height: 52, display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid oklch(25% 0.015 50)' }}>
          <button onClick={() => navigate('escuela')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(70% 0.01 60)', display: 'flex', alignItems: 'center', gap: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>
            <Icon name="chevronRight" size={14} color="oklch(60% 0.01 60)" style={{ transform: 'rotate(180deg)' }} />
            Volver a la escuela
          </button>
          <div style={{ height: 20, width: 1, background: 'oklch(30% 0.015 50)' }} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: '#fff' }}>{course.title}</div>
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(65% 0.01 60)' }}>{completedCount}/{totalLessons} clases</span>
            <div style={{ width: 120 }}><ProgressBar value={course.progress} color="#97ceb8" /></div>
          </div>
        </div>

        {/* Main content */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
          {/* Sidebar */}
          <div style={{ width: 320, background: 'oklch(16% 0.02 50)', borderRight: '1px solid oklch(22% 0.015 50)', overflowY: 'auto', flexShrink: 0 }}>
            <div style={{ padding: '20px 16px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', color: 'oklch(55% 0.01 60)', textTransform: 'uppercase' }}>
              Contenido del curso
            </div>
            {course.modules.map((mod, mi) => (
              <div key={mi}>
                <div onClick={() => setActiveModule(mi)}
                  style={{ padding: '12px 16px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeModule === mi ? 'oklch(22% 0.02 50)' : 'transparent' }}>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: activeModule === mi ? '#fff' : 'oklch(65% 0.01 60)' }}>
                    {mi + 1}. {mod.title}
                  </span>
                  <Icon name="chevronDown" size={14} color="oklch(55% 0.01 60)" style={{ transform: activeModule === mi ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s' }} />
                </div>
                {activeModule === mi && (
                  <div style={{ paddingBottom: 8 }}>
                    {mod.lessons.map((lesson, li) => {
                      const lessonIndex = course.modules.slice(0, mi).reduce((s, m) => s + m.lessons.length, 0) + li;
                      const isCompleted = lessonIndex < completedCount;
                      const isActive = activeModule === mi && activeLesson === li;
                      return (
                        <div key={li} onClick={() => setActiveLesson(li)}
                          style={{ padding: '9px 16px 9px 32px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 10, background: isActive ? 'oklch(26% 0.02 50)' : 'transparent' }}>
                          {isCompleted ? (
                            <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                              <Icon name="check" size={10} color="#fff" />
                            </div>
                          ) : (
                            <Icon name={isActive ? 'play' : 'lock'} size={14} color={isActive ? '#97ceb8' : 'oklch(45% 0.01 60)'} />
                          )}
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: isActive ? '#fff' : isCompleted ? 'oklch(70% 0.01 60)' : 'oklch(55% 0.01 60)' }}>
                            {lesson}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Video area */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <div style={{ background: '#000', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: 400 }}>
              <div style={{ textAlign: 'center' }}>
                <div onClick={() => setPlaying(!playing)}
                  style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 auto 20px', backdropFilter: 'blur(4px)', border: '1px solid rgba(255,255,255,.2)', transition: 'background .2s' }}>
                  <Icon name={playing ? 'x' : 'play'} size={28} color="#fff" />
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, color: 'rgba(255,255,255,.7)', fontStyle: 'italic' }}>{lesson}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.4)', marginTop: 8 }}>VIDEO CLASE — 1920×1080px</div>
              </div>
              {/* Video controls */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '20px 24px', background: 'linear-gradient(transparent, rgba(0,0,0,.8))' }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,.2)', borderRadius: 2, marginBottom: 12, cursor: 'pointer' }}>
                  <div style={{ height: '100%', width: '35%', background: '#97ceb8', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.7)' }}>12:24 / 34:50</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,.5)' }}>720p HD</div>
                </div>
              </div>
            </div>
            {/* Lesson info */}
            <div style={{ background: 'oklch(18% 0.02 50)', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.01 60)', marginBottom: 6 }}>
                  Módulo {activeModule + 1}: {course.modules[activeModule]?.title}
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, color: '#fff', margin: 0 }}>{lesson}</h3>
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <Btn size="sm" variant="ghost" style={{ color: '#fff', background: 'oklch(25% 0.02 50)' }}
                  onClick={() => activeLesson > 0 ? setActiveLesson(l => l - 1) : null}>
                  ← Anterior
                </Btn>
                <Btn size="sm" onClick={() => {
                  if (activeLesson < course.modules[activeModule].lessons.length - 1) setActiveLesson(l => l + 1);
                  else if (activeModule < course.modules.length - 1) { setActiveModule(m => m + 1); setActiveLesson(0); }
                }}>
                  Siguiente →
                </Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course landing (not enrolled)
  return (
    <div style={{ paddingTop: 108 }}>
      <div style={{ background: 'oklch(16% 0.022 50)', padding: '60px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 380px', gap: 60, alignItems: 'start' }}>
          <div>
            <Badge color="#97ceb8" bg="#3d6b5e">{course.category}</Badge>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 52, fontWeight: 600, color: '#fff', margin: '16px 0 16px', lineHeight: 1.1 }}>{course.title}</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 17, color: 'oklch(75% 0.012 60)', lineHeight: 1.7, marginBottom: 24 }}>{course.description}</p>
            <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
              <Stars rating={course.rating} count={course.reviews} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(65% 0.01 60)' }}>{course.students.toLocaleString()} alumnas</span>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(65% 0.01 60)' }}>{course.lessons} clases · {course.duration}</span>
              <Badge color="oklch(70% 0.07 152)" bg="oklch(25% 0.05 152)">{course.level}</Badge>
            </div>
          </div>

          {/* Price card */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 28, boxShadow: '0 24px 64px rgba(0,0,0,.3)', position: 'sticky', top: 120 }}>
            <div style={{ height: 160, background: course.color, borderRadius: 12, marginBottom: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.3)', fontStyle: 'italic' }}>Preview del curso</div>
            </div>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, fontWeight: 700, color: '#5e9e8a', marginBottom: 4 }}>{fmt(course.price, course.priceUSD)}</div>
            {course.isMembership && <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', marginBottom: 16 }}>por mes · cancelá cuando quieras</div>}
            <Btn size="lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
              onClick={() => { if (!user) setAuthModal('login'); else addToCart(course); }}>
              {course.isMembership ? 'Unirme al Club VeCKA' : 'Inscribirme ahora'}
            </Btn>
            <div style={{ textAlign: 'center', marginBottom: 20 }}>
              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(60% 0.018 50)', marginBottom: 8 }}>Pagás con</div>
              <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                {['MercadoPago', 'MODO', 'PayPal'].map(pm => (
                  <span key={pm} style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, background: 'oklch(95% 0.01 60)', border: '1px solid oklch(88% 0.012 60)', padding: '3px 8px', borderRadius: 4, color: 'oklch(50% 0.018 50)' }}>{pm}</span>
                ))}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[['check', 'Acceso de por vida'], ['download', 'Material descargable incluido'], ['user', 'Soporte de Vero'], ['certificate', 'Certificado de finalización']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(35% 0.018 50)' }}>
                  <Icon name={icon} size={14} color="#5e9e8a" /> {text}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Modules */}
      {course.modules.length > 0 && (
        <div style={{ maxWidth: 1280, margin: '0 auto', padding: '60px 80px' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, marginBottom: 32, color: 'oklch(18% 0.022 50)' }}>Contenido del curso</h2>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            {course.modules.map((mod, mi) => (
              <div key={mi} style={{ border: '1px solid oklch(88% 0.016 60)', borderRadius: 14, overflow: 'hidden' }}>
                <div style={{ padding: '16px 20px', background: 'oklch(96% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, margin: 0, color: 'oklch(18% 0.022 50)' }}>{mi + 1}. {mod.title}</h4>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)' }}>{mod.lessons.length} clases</span>
                </div>
                <div style={{ padding: '8px 0' }}>
                  {mod.lessons.map((lesson, li) => (
                    <div key={li} style={{ padding: '9px 20px', display: 'flex', alignItems: 'center', gap: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>
                      <Icon name="lock" size={13} color="oklch(72% 0.012 60)" />
                      {lesson}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
