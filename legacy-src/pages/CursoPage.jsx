import { useEffect, useMemo, useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import Icon from '../components/Icon';
import { Btn, Badge, Stars, ProgressBar } from '../components/Primitives';
import Footer from '../components/Footer';

function getLessonTitle(lesson, fallback = 'Clase sin título') {
  if (typeof lesson === 'string') return lesson;
  return lesson?.title || fallback;
}

function getLessonSummary(lesson) {
  return typeof lesson === 'string' ? '' : lesson?.summary || '';
}

function getLessonBody(lesson) {
  return typeof lesson === 'string' ? '' : lesson?.body || '';
}

function getLessonAttachments(lesson) {
  return Array.isArray(lesson?.attachments) ? lesson.attachments : [];
}

function getLessonFlags(lesson) {
  if (!lesson || typeof lesson === 'string') {
    return { hasVideo: false, isPreview: false, pdfCount: 0 };
  }

  return {
    hasVideo: Boolean(lesson.vimeoUrl || lesson.externalVideoUrl),
    isPreview: Boolean(lesson.isPreview),
    pdfCount: getLessonAttachments(lesson).length,
  };
}

function hasModuleOverview(module) {
  return Boolean(
    module?.description ||
      module?.vimeoUrl ||
      module?.externalVideoUrl ||
      (Array.isArray(module?.lessons) && module.lessons.length === 0),
  );
}

function getModuleTimelineEntry(module, moduleIndex) {
  const entries = [];

  if (hasModuleOverview(module)) {
    entries.push({ moduleIndex, lessonIndex: null, isModuleOverview: true });
  }

  (module?.lessons || []).forEach((_, lessonIndex) => {
    entries.push({ moduleIndex, lessonIndex, isModuleOverview: false });
  });

  return entries;
}

function getTimeline(modules = []) {
  return modules.flatMap((module, moduleIndex) => getModuleTimelineEntry(module, moduleIndex));
}

function normalizeVimeoEmbed(url = '') {
  const match = String(url).match(
    /(?:player\.)?vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/i,
  );

  return match?.[1] ? `https://player.vimeo.com/video/${match[1]}` : url;
}

function normalizeYoutubeEmbed(url = '') {
  const match = String(url).match(
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/i,
  );

  return match?.[1] ? `https://www.youtube.com/embed/${match[1]}` : url;
}

function resolveVideoSource(module, lesson) {
  const provider = lesson?.videoProvider || module?.videoProvider || 'none';
  const rawUrl = lesson?.vimeoUrl || lesson?.externalVideoUrl || module?.vimeoUrl || module?.externalVideoUrl || '';
  const url = String(rawUrl || '').trim();

  if (!url) {
    return { kind: 'none', src: '', provider: 'none' };
  }

  if (provider === 'vimeo' || /vimeo\.com/i.test(url)) {
    return { kind: 'iframe', src: normalizeVimeoEmbed(url), provider: 'vimeo' };
  }

  if (/youtube\.com|youtu\.be/i.test(url)) {
    return { kind: 'iframe', src: normalizeYoutubeEmbed(url), provider: 'youtube' };
  }

  if (/\.(mp4|webm|ogg)(\?|$)/i.test(url)) {
    return { kind: 'video', src: url, provider: 'file' };
  }

  return { kind: 'iframe', src: url, provider: provider === 'external' ? 'external' : 'embed' };
}

function formatDuration(seconds) {
  const total = Number(seconds || 0);
  if (!Number.isFinite(total) || total <= 0) return '';

  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const remainingSeconds = total % 60;

  if (hours > 0) {
    return `${hours}:${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
  }

  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`;
}

function countModuleDownloads(module) {
  return (module?.lessons || []).reduce((sum, lesson) => sum + getLessonAttachments(lesson).length, 0);
}

export default function CursoPage() {
  const { selectedCourse, navigate, addToCart, fmt, user, openAuthModal } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const course = selectedCourse;
  const [activeModule, setActiveModule] = useState(0);
  const [activeLesson, setActiveLesson] = useState(0);
  const [showModuleOverview, setShowModuleOverview] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (!course) {
    navigate('escuela');
    return null;
  }

  const canAccessCourse = Boolean(course.canAccess || course.enrolled);
  const totalLessons = course.modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0);
  const completedCount = Math.min(totalLessons, Math.round((course.progress / 100) * totalLessons));
  const currentModule = course.modules[activeModule] || null;
  const currentLesson = !showModuleOverview ? currentModule?.lessons?.[activeLesson] ?? null : null;
  const currentTitle = showModuleOverview ? currentModule?.title || course.title : getLessonTitle(currentLesson, currentModule?.title || 'Clase');
  const currentSummary = showModuleOverview ? currentModule?.description || '' : getLessonSummary(currentLesson) || currentModule?.description || '';
  const currentBody = showModuleOverview ? '' : getLessonBody(currentLesson);
  const currentAttachments = showModuleOverview ? [] : getLessonAttachments(currentLesson);
  const currentVideoSource = resolveVideoSource(currentModule, currentLesson);
  const currentDuration = formatDuration(
    currentLesson?.videoDurationSeconds || currentModule?.videoDurationSeconds || 0,
  );
  const timeline = useMemo(() => getTimeline(course.modules), [course.modules]);
  const activeTimelineIndex = timeline.findIndex(
    (entry) =>
      entry.moduleIndex === activeModule &&
      (showModuleOverview ? entry.lessonIndex === null : entry.lessonIndex === activeLesson),
  );

  useEffect(() => {
    if (!currentModule) {
      setActiveModule(0);
      setActiveLesson(0);
      setShowModuleOverview(false);
      return;
    }

    if (showModuleOverview && !hasModuleOverview(currentModule)) {
      setShowModuleOverview(false);
    }

    if (!showModuleOverview && activeLesson >= (currentModule.lessons?.length || 0)) {
      setActiveLesson(0);
    }
  }, [activeLesson, currentModule, showModuleOverview]);

  const goToTimelineEntry = (entry) => {
    if (!entry) return;
    setActiveModule(entry.moduleIndex);
    setActiveLesson(entry.lessonIndex ?? 0);
    setShowModuleOverview(entry.lessonIndex === null);
    if (isMobile) setSidebarOpen(false);
  };

  const goToPrevious = () => {
    if (activeTimelineIndex <= 0) return;
    goToTimelineEntry(timeline[activeTimelineIndex - 1]);
  };

  const goToNext = () => {
    if (activeTimelineIndex < 0 || activeTimelineIndex >= timeline.length - 1) return;
    goToTimelineEntry(timeline[activeTimelineIndex + 1]);
  };

  if (canAccessCourse && course.modules.length > 0) {
    return (
      <div style={{ paddingTop: isMobile ? 60 : 108, minHeight: '100vh', background: 'oklch(14% 0.02 50)', display: 'flex', flexDirection: 'column' }}>
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

        <div style={{ display: 'flex', flex: 1, overflow: 'hidden', position: 'relative' }}>
          {(!isMobile || sidebarOpen) && (
            <>
              {isMobile && <div onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 50 }} />}
              <div style={{ width: isMobile ? 280 : 300, background: 'oklch(16% 0.02 50)', borderRight: '1px solid oklch(22% 0.015 50)', overflowY: 'auto', flexShrink: 0, position: isMobile ? 'fixed' : 'relative', right: isMobile ? 0 : 'auto', top: isMobile ? 0 : 'auto', bottom: isMobile ? 0 : 'auto', zIndex: isMobile ? 60 : 'auto' }}>
                <div style={{ padding: '16px 14px 8px', fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', color: 'oklch(55% 0.01 60)', textTransform: 'uppercase' }}>
                  Contenido
                </div>
                {course.modules.map((module, moduleIndex) => (
                  <div key={module.id || moduleIndex}>
                    <div
                      onClick={() => {
                        setActiveModule(moduleIndex);
                        setActiveLesson(0);
                        setShowModuleOverview(hasModuleOverview(module));
                        if (isMobile) setSidebarOpen(false);
                      }}
                      style={{ padding: '11px 14px', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: activeModule === moduleIndex ? 'oklch(22% 0.02 50)' : 'transparent' }}
                    >
                      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: activeModule === moduleIndex ? '#fff' : 'oklch(65% 0.01 60)' }}>
                        {moduleIndex + 1}. {module.title}
                      </span>
                      <Icon name="chevronDown" size={12} color="oklch(55% 0.01 60)" style={{ transform: activeModule === moduleIndex ? 'rotate(0)' : 'rotate(-90deg)', transition: 'transform .2s' }} />
                    </div>
                    {activeModule === moduleIndex && (
                      <>
                        {hasModuleOverview(module) && (
                          <div
                            onClick={() => goToTimelineEntry({ moduleIndex, lessonIndex: null })}
                            style={{ padding: '8px 14px 8px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, background: showModuleOverview ? 'oklch(26% 0.02 50)' : 'transparent' }}
                          >
                            <Icon name="play" size={12} color={showModuleOverview ? '#97ceb8' : 'oklch(45% 0.01 60)'} />
                            <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: showModuleOverview ? '#fff' : 'oklch(70% 0.01 60)' }}>
                              Presentación del módulo
                            </span>
                          </div>
                        )}
                        {(module.lessons || []).map((lesson, lessonIndex) => {
                          const idx = course.modules.slice(0, moduleIndex).reduce((sum, item) => sum + item.lessons.length, 0) + lessonIndex;
                          const isCompleted = idx < completedCount;
                          const isActive = !showModuleOverview && activeModule === moduleIndex && activeLesson === lessonIndex;
                          const flags = getLessonFlags(lesson);

                          return (
                            <div
                              key={lesson.id || `${moduleIndex}-${lessonIndex}`}
                              onClick={() => goToTimelineEntry({ moduleIndex, lessonIndex })}
                              style={{ padding: '8px 14px 8px 28px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 9, background: isActive ? 'oklch(26% 0.02 50)' : 'transparent' }}
                            >
                              {isCompleted
                                ? <div style={{ width: 16, height: 16, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Icon name="check" size={9} color="#fff" /></div>
                                : <Icon name={isActive ? 'play' : 'lock'} size={12} color={isActive ? '#97ceb8' : 'oklch(45% 0.01 60)'} />
                              }
                              <div style={{ minWidth: 0, flex: 1 }}>
                                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: isActive ? '#fff' : isCompleted ? 'oklch(70% 0.01 60)' : 'oklch(55% 0.01 60)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                  {getLessonTitle(lesson)}
                                </div>
                                {(flags.hasVideo || flags.pdfCount > 0 || flags.isPreview) && (
                                  <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
                                    {flags.hasVideo && <Badge color="#97ceb8" bg="oklch(25% 0.04 160)">Video</Badge>}
                                    {flags.pdfCount > 0 && <Badge color="oklch(80% 0.03 250)" bg="oklch(24% 0.02 250)">{flags.pdfCount} PDF</Badge>}
                                    {flags.isPreview && <Badge color="oklch(82% 0.05 85)" bg="oklch(28% 0.03 85)">Preview</Badge>}
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
            <div style={{ background: '#000', flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', minHeight: isMobile ? 220 : 360 }}>
              {currentVideoSource.kind === 'iframe' && currentVideoSource.src ? (
                <iframe
                  title={currentTitle}
                  src={currentVideoSource.src}
                  allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                  allowFullScreen
                  style={{ width: '100%', height: '100%', border: 'none' }}
                />
              ) : currentVideoSource.kind === 'video' && currentVideoSource.src ? (
                <video controls style={{ width: '100%', height: '100%' }} src={currentVideoSource.src}>
                  Tu navegador no soporta reproducción de video embebido.
                </video>
              ) : (
                <div style={{ textAlign: 'center', padding: '0 24px' }}>
                  <div style={{ width: 60, height: 60, borderRadius: '50%', background: 'rgba(255,255,255,.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '1px solid rgba(255,255,255,.2)' }}>
                    <Icon name="play" size={24} color="#fff" />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 16 : 20, color: 'rgba(255,255,255,.8)', fontStyle: 'italic', marginBottom: 8 }}>{currentTitle}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'rgba(255,255,255,.55)' }}>
                    Esta sección todavía no tiene video cargado.
                  </div>
                </div>
              )}

              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '16px 20px', background: 'linear-gradient(transparent, rgba(0,0,0,.7))', pointerEvents: 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,.72)', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {showModuleOverview ? 'Presentación del módulo' : currentTitle}
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'rgba(255,255,255,.55)', flexShrink: 0 }}>
                    {currentDuration || 'Sin duración'}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ background: 'oklch(18% 0.02 50)', padding: `${isMobile ? 16 : 20}px ${isMobile ? 16 : 28}px`, flexShrink: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'oklch(55% 0.01 60)', marginBottom: 4 }}>
                    {showModuleOverview ? `Módulo ${activeModule + 1}` : `Módulo ${activeModule + 1} · Clase ${activeLesson + 1}`}
                  </div>
                  <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 18 : 22, color: '#fff', margin: 0 }}>
                    {currentTitle}
                  </h3>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  <Btn size="sm" variant="ghost" style={{ color: '#fff', background: 'oklch(25% 0.02 50)' }} onClick={goToPrevious}>←</Btn>
                  <Btn size="sm" onClick={goToNext}>→</Btn>
                </div>
              </div>

              {(currentSummary || currentBody || currentAttachments.length > 0) && (
                <div style={{ display: 'grid', gridTemplateColumns: isTablet ? '1fr' : 'minmax(0, 1fr) 280px', gap: 18, alignItems: 'start' }}>
                  <div>
                    {currentSummary && (
                      <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(82% 0.012 60)', lineHeight: 1.7, margin: '0 0 14px' }}>
                        {currentSummary}
                      </p>
                    )}
                    {currentBody && (
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(72% 0.012 60)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                        {currentBody}
                      </div>
                    )}
                  </div>
                  {currentAttachments.length > 0 && (
                    <div style={{ background: 'oklch(20% 0.02 50)', border: '1px solid oklch(25% 0.015 50)', borderRadius: 12, padding: 14 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: '#fff', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 12 }}>
                        Material de la clase
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                        {currentAttachments.map((attachment) => (
                          <a
                            key={attachment.id}
                            href={attachment.href}
                            target="_blank"
                            rel="noreferrer"
                            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, textDecoration: 'none', background: 'oklch(23% 0.02 50)', borderRadius: 10, padding: '10px 12px' }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {attachment.fileName}
                              </div>
                              <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: 'oklch(68% 0.01 60)', marginTop: 2 }}>
                                PDF descargable
                              </div>
                            </div>
                            <Icon name="download" size={14} color="#97ceb8" />
                          </a>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

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

          {!isTablet && (
            <div style={{ background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 24px 64px rgba(0,0,0,.3)', position: 'sticky', top: 120 }}>
              <div style={{ height: 150, background: course.color, borderRadius: 10, marginBottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                {course.coverImageUrl
                  ? <img src={course.coverImageUrl} alt={course.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  : <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 14, color: 'rgba(0,0,0,.3)', fontStyle: 'italic' }}>Preview del curso</div>}
              </div>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 700, color: '#5e9e8a', marginBottom: 14 }}>{fmt(course.price, course.priceUSD)}</div>
              <Btn size="lg" style={{ width: '100%', justifyContent: 'center', marginBottom: 12 }} onClick={() => { if (!user) openAuthModal('login'); else addToCart(course); }}>
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

        {isTablet && (
          <div style={{ maxWidth: 1280, margin: '24px auto 0', background: 'rgba(255,255,255,.08)', borderRadius: 14, padding: '18px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16 }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 32, fontWeight: 700, color: '#97ceb8' }}>{fmt(course.price, course.priceUSD)}</div>
            <Btn size="lg" onClick={() => { if (!user) openAuthModal('login'); else addToCart(course); }}>
              {course.isMembership ? 'Unirme al Club' : 'Inscribirme'}
            </Btn>
          </div>
        )}
      </div>

      {course.modules.length > 0 && (
        <div ref={ref} style={{ maxWidth: 1280, margin: '0 auto', padding: isMobile ? '36px 16px 60px' : `60px ${px}` }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 26 : 34, marginBottom: 28, color: 'oklch(18% 0.022 50)' }}>Contenido del curso</h2>
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? '1fr' : '1fr 1fr', gap: 14 }}>
            {course.modules.map((module, moduleIndex) => {
              const hasOverview = hasModuleOverview(module);
              const modulePdfCount = countModuleDownloads(module);

              return (
                <div key={module.id || moduleIndex} style={{ border: '1px solid oklch(88% 0.016 60)', borderRadius: 12, overflow: 'hidden', ...fadeUpStyle(visible, moduleIndex * 0.07) }}>
                  <div style={{ padding: '14px 18px', background: 'oklch(96% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                    <div>
                      <h4 style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 700, margin: 0 }}>{moduleIndex + 1}. {module.title}</h4>
                      {module.description && (
                        <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(48% 0.018 50)', margin: '6px 0 0', lineHeight: 1.5 }}>
                          {module.description}
                        </p>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Badge color="oklch(35% 0.018 50)" bg="oklch(90% 0.012 60)">{module.lessons.length} clases</Badge>
                      {hasOverview && <Badge color="#4a7d6e" bg="#d4f0e6">Video módulo</Badge>}
                      {modulePdfCount > 0 && <Badge color="oklch(35% 0.09 240)" bg="oklch(92% 0.04 240)">{modulePdfCount} PDF</Badge>}
                    </div>
                  </div>
                  <div style={{ padding: '6px 0' }}>
                    {hasOverview && (
                      <div style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>
                        <Icon name="play" size={12} color="#5e9e8a" />
                        Presentación del módulo
                      </div>
                    )}
                    {(module.lessons || []).map((lesson, lessonIndex) => {
                      const flags = getLessonFlags(lesson);
                      return (
                        <div key={lesson.id || `${moduleIndex}-${lessonIndex}`} style={{ padding: '8px 18px', display: 'flex', alignItems: 'center', gap: 9, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>
                          <Icon name={flags.isPreview ? 'play' : 'lock'} size={12} color={flags.isPreview ? '#5e9e8a' : 'oklch(72% 0.012 60)'} />
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <div>{getLessonTitle(lesson)}</div>
                            {(flags.hasVideo || flags.pdfCount > 0 || flags.isPreview) && (
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 4 }}>
                                {flags.hasVideo && <Badge color="#4a7d6e" bg="#d4f0e6">Video</Badge>}
                                {flags.pdfCount > 0 && <Badge color="oklch(35% 0.09 240)" bg="oklch(92% 0.04 240)">{flags.pdfCount} PDF</Badge>}
                                {flags.isPreview && <Badge color="oklch(40% 0.1 65)" bg="oklch(95% 0.04 65)">Vista previa</Badge>}
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
      <Footer />
    </div>
  );
}
