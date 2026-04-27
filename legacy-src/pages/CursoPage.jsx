import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import Icon from '../components/Icon';
import { Btn, Badge, Stars, ProgressBar } from '../components/Primitives';
import Footer from '../components/Footer';

export default function CursoPage() {
  const { selectedCourse, navigate, addToCart, fmt, user, setAuthModal } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const course = selectedCourse;
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!course) { navigate('escuela'); return null; }

  const isEnrolled = course.enrolled;
  const totalLessons = course.modules.reduce((s, m) => s + m.lessons.length, 0);
  const completedCount = Math.round((course.progress / 100) * totalLessons);

  // Player mode (enrolled)
  if (isEnrolled && course.modules.length > 0) {
    const mod = course.modules[activeModule];
    const lesson = mod?.lessons[activeLesson];

    return (
      <div style={{ paddingTop: isMobile ? 60 : 108, minHeight: '100vh', background: 'oklch(14% 0.02 50)', display: 'flex', flexDirection: 'column' }}>
        {/* Top bar */}
        <div style={{ background: 'oklch(18% 0.02 50)', padding: `0 ${isMobile ? 14 : 24}px`, height: 50, display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid oklch(25% 0.015 50)', flexShrink: 0 }}>
          <button onClick={() => navigate('escuela')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(65% 0.01 60)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: "'DM Sans', sans-serif", fontSize: 12, flexShrink: 0 }}>
            <Icon name="chevronRight" size={13} color="oklch(60% 0.01 60)" style={{ transform: 'rotate(180deg)' }} />
            {!isMobile && 'Volver'}
          </button>
          <div style={{ height: 18, width: 1, background: 'oklch(30% 0.015 50)' }} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{course.title}</div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(!sidebarOpen)} style={{ background: 'oklch(25% 0.02 50)', border: 'none', cursor: 'pointer', padding: '5px 10px', borderRadius: 6, color: '#fff', fontFamily: "'DM Sans', sans-serif", fontSize: 11, flexShrink: 0 }}>
              Índice
            </button>
          )}
          {!isMobile && (
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(65% 0.01 60)' }}>{completedCount}/{totalLessons}</span>
              <div style={{ width: 100 }}><ProgressBar value={course.progress} color="#97ceb8" /></div>
            </div>
          )}
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {/* Sidebar */}
          {(!isMobile || sidebarOpen) && (
            <>
              {isMobile && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50 }} />}
              <div style={{ width: isMobile ? 280 : 300, background: 'oklch(16% 0.02 50)', borderRight: '1px solid oklch(22% 0.015 50)', overflowY: 'auto', flexShrink: 0, position: isMobile ? 'fixed' : 'relative', right: isMobile ? 0 : 'auto', top: isMobile ? 0 : 'auto', bottom: isMobile ? 0 : 'auto', zIndex: isMobile ? 60 : 'auto' }}>
                <div style={{ padding: '16px 14px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'oklch(55% 0.01 60)', textTransform: 'uppercase' }}>
                  Contenido
                </div>
                {course.modules.map((mod, mi) => (
                  <div key={mi}>
                    <div onClick={() => { setActiveModule(mi); if (isMobile) setSidebarOpen(false); }}
                      style={{ padding: '11px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeModule === mi ? 'oklch(22% 0.02 50)' : 'transparent' }}>
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: activeModule === mi ? '#fff' : 'oklch(65% 0.01 60)' }}>
                        {mi + 1}. {mod.title}
                      </span>
                      <Icon name="chevronDown" size={12} color="oklch(55% 0.01 60)" style={{ transform: activeModule === mi ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s' }} />
                    </div>
                    {activeModule === mi && mod.lessons.map((lesson, li) => {
                      const idx = course.modules.slice(0, mi).reduce((s, m) => s + m.lessons.length, 0) + li;
                      const isCompleted = idx < completedCount;
                      const isActive = activeModule === mi && activeLesson === li;
                      return (
                        <div key={li} onClick={() => { setActiveLesson(li); if (isMobile) setSidebarOpen(false); }}
                          style={{ padding: '8px 14px 8px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, background: isActive ? 'oklch(26% 0.02 50)' : 'transparent' }}>
                          {isCompleted
                            ? <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" size={9} color="#fff" /></div>
                            : <Icon name={isActive ? 'play' : 'lock'} size={12} color={isActive ? '#97ceb8' : 'oklch(45% 0.01 60)'} />
                          }
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: isActive ? '#fff' : isCompleted ? 'oklch(70% 0.01 60)' : 'oklch(55% 0.01 60)' }}>{lesson}</span>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Video */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ background: '#000', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: isMobile ? 220 : 360 }}>
              <div style={{ textAlign: 'center' }}>
                <div onClick={() => setPlaying(!playing)}
                  style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', margin: '0 auto 16px', border: '1px solid rgba(255,255,255,.2)', transition: 'background .2s' }}>
                  <Icon name={playing ? 'x' : 'play'} size={24} color="#fff" />
                </div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 16 : 20, color: 'rgba(255,255,255,.65)', fontStyle: 'italic', padding: '0 16px' }}>{lesson}</div>
              </div>
              {/* Progress bar */}
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,.7))' }}>
                <div style={{ height: 3, background: 'rgba(255,255,255,.2)', borderRadius: 2, marginBottom: 8, cursor: 'pointer' }}>
                  <div style={{ height: '100%', width: '35%', background: '#97ceb8', borderRadius: 2 }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,.65)' }}>12:24 / 34:50</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'rgba(255,255,255,.4)' }}>HD</div>
                </div>
              </div>
            </div>
            {/* Lesson nav */}
            <div style={{ background: 'oklch(18% 0.02 50)', padding: `${isMobile ? 16 : 20}px ${isMobile ? 16 : 28}px`, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexShrink: 0 }}>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'oklch(55% 0.01 60)', marginBottom: 4 }}>Módulo {activeModule + 1}</div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 18 : 22, color: '#fff', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{lesson}</h3>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <Btn size="sm" variant="ghost" style={{ color: '#fff', background: 'oklch(25% 0.02 50)' }}
                  onClick={() => activeLesson > 0 ? setActiveLesson(l => l - 1) : null}>←</Btn>
                <Btn size="sm" onClick={() => {
                  if (activeLesson < course.modules[activeModule].lessons.length - 1) setActiveLesson(l => l + 1);
                  else if (activeModule < course.modules.length - 1) { setActiveModule(m => m + 1); setActiveLesson(0); }
                }}>→</Btn>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Course landing
  const px = isMobile ? '16px' : isTablet ? '32px' : '80px';
  return (
    <div style={{ paddingTop: isMobile ? 60 : 108 }}>
      <div style={{ background: 'linear-gradient(135deg, #1e3d2e 0%, #2a5244 60%, #1a3530 100%)', padding: isMobile ? '44px 16px 36px' : `60px ${px}`, position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -100, right: '5%', width: 400, height: 400, borderRadius: '50%', background: 'radial-gradient(circle, rgba(151,206,184,.15) 0%, transparent 70%)', pointerEvents: 'none' }} />
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 360px', gap: isTablet ? 32 : 60, alignItems: 'start' }}>
          <div>
            <Badge color="#97ceb8" bg="#3d6b5e">{course.category}</Badge>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 36 : isTablet ? 44 : 52, fontWeight: 600, color: '#fff', margin: '14px 0 14px', lineHeight: 1.1 }}>{course.title}</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 16, color: 'oklch(75% 0.012 60)', lineHeight: 1.7, marginBottom: 20 }}>{course.description}</p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
              <Stars rating={course.rating} count={course.reviews} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(65% 0.01 60)' }}>{course.students.toLocaleString()} alumnas</span>
              <Badge color="oklch(70% 0.07 152)" bg="oklch(25% 0.05 152)">{course.level}</Badge>
            </div>
          </div>

          {/* Price card */}
          {!isTablet && (
            <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,.3)', position: 'sticky', top: 120 }}>
              <div style={{ height: 150, background: course.color, borderRadius: 10, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'rgba(0,0,0,.3)', fontStyle: 'italic' }}>Preview del curso</div>
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 700, color: '#5e9e8a', marginBottom: 14 }}>{fmt(course.price, course.priceUSD)}</div>
              <Btn size="lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }}
                onClick={() => { if (!user) setAuthModal('login'); else addToCart(course); }}>
                {course.isMembership ? 'Unirme al Club VeCKA' : 'Inscribirme ahora'}
              </Btn>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[['check', 'Acceso de por vida'], ['download', 'Material descargable'], ['user', 'Soporte de Vero'], ['certificate', 'Certificado de finalización']].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(35% 0.018 50)' }}>
                    <Icon name={icon} size={13} color="#5e9e8a" /> {text}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Mobile CTA */}
        {isTablet && (
          <div style={{ maxWidth: 1280, margin: '24px auto 0', background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: '#97ceb8' }}>{fmt(course.price, course.priceUSD)}</div>
            <Btn size="lg" onClick={() => { if (!user) setAuthModal('login'); else addToCart(course); }}>
              {course.isMembership ? 'Unirme al Club' : 'Inscribirme'}
            </Btn>
          </div>
        )}
      </div>

      {/* Modules */}
      {course.modules.length > 0 && (
        <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '36px 16px 60px' : `60px ${px}` }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 26 : 34, marginBottom: 28, color: 'oklch(18% 0.022 50)' }}>Contenido del curso</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 1fr', gap: 14 }}>
            {course.modules.map((mod, mi) => (
              <div key={mi} style={{ border: '1px solid oklch(88% 0.016 60)', borderRadius: 12, overflow: 'hidden', ...fadeUpStyle(visible, mi * 0.07) }}>
                <div style={{ padding: '14px 18px', background: 'oklch(96% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, margin: 0 }}>{mi + 1}. {mod.title}</h4>
                  <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)' }}>{mod.lessons.length} clases</span>
                </div>
                <div style={{ padding: '6px 0' }}>
                  {mod.lessons.map((lesson, li) => (
                    <div key={li} style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>
                      <Icon name="lock" size={12} color="oklch(72% 0.012 60)" />
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
