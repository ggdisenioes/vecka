import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase/server'
import LessonVideoPlayer from './LessonVideoPlayer'
import '../../../membership.css'

export const dynamic = 'force-dynamic'

function vimeoEmbed(url) {
  const match = String(url || '').match(/vimeo\.com\/(?:video\/)?(\d+)/)
  if (!match) return null
  return `https://player.vimeo.com/video/${match[1]}`
}

export default async function MembershipLessonPage({ params }) {
  const { slug, courseSlug, lessonSlug } = await params
  const supabase = await getSupabaseServer()
  const { user } = await getCurrentAuth()
  if (!user) redirect(`/login?next=/membresia/${slug}/${courseSlug}/${lessonSlug}`)

  // Localiza el tier (debe estar publicado).
  const { data: tier } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, status')
    .eq('slug', slug)
    .maybeSingle()
  if (!tier || tier.status !== 'published') notFound()

  // Curso por slug — RLS protege el contenido si el usuario no tiene acceso.
  const { data: course } = await supabase
    .from('courses')
    .select('id, slug, title')
    .eq('slug', courseSlug)
    .maybeSingle()
  if (!course) notFound()

  // Verificar grant activo del tier.
  const { data: grant } = await supabase
    .from('membership_grants')
    .select('access_status, expires_at')
    .eq('tier_id', tier.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const hasAccess =
    grant?.access_status === 'active' &&
    (!grant.expires_at || new Date(grant.expires_at) > new Date())
  if (!hasAccess) {
    redirect(`/membresia/${slug}`)
  }

  // Lección + módulo padre (para verificar que pertenece al curso).
  const { data: lesson } = await supabase
    .from('course_lessons')
    .select(`
      id, slug, title, summary, body, status, lesson_type,
      vimeo_url, external_video_url, video_provider, video_storage_path,
      live_session_url, live_session_at,
      module:course_modules(id, course_id, title)
    `)
    .eq('slug', lessonSlug)
    .maybeSingle()

  if (!lesson || lesson.module?.course_id !== course.id) notFound()

  // Materiales adjuntos.
  const { data: materials } = await supabase
    .from('course_materials')
    .select('id, file_name, mime_type, size_bytes, sort_order')
    .eq('lesson_id', lesson.id)
    .order('sort_order', { ascending: true })

  return (
    <main className="membership-shell">
      <div className="membership-container">
        <div className="breadcrumb-row">
          <Link href="/membresia">Membresías</Link> ·{' '}
          <Link href={`/membresia/${tier.slug}`}>{tier.name}</Link> ·{' '}
          <span>{course.title}</span>
        </div>

        <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, margin: '6px 0 18px' }}>
          {lesson.title}
        </h1>

        {lesson.lesson_type === 'live_session' ? (
          <div className="live-session-banner">
            <strong>Sesión en vivo</strong>
            {lesson.live_session_at ? (
              <span>
                {new Date(lesson.live_session_at).toLocaleString('es-AR', {
                  dateStyle: 'full',
                  timeStyle: 'short',
                })}
              </span>
            ) : null}
            {lesson.live_session_url ? (
              <a href={lesson.live_session_url} target="_blank" rel="noopener noreferrer">
                Entrar a la sesión
              </a>
            ) : (
              <span>El link estará disponible pronto.</span>
            )}
          </div>
        ) : null}

        {lesson.lesson_type === 'video' || (!lesson.lesson_type && lesson.video_provider !== 'none') ? (
          <>
            {lesson.video_provider === 'vimeo' && lesson.vimeo_url ? (
              <div className="video-frame">
                <iframe
                  src={vimeoEmbed(lesson.vimeo_url) || lesson.vimeo_url}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            {lesson.video_provider === 'external' && lesson.external_video_url ? (
              <div className="video-frame">
                <iframe
                  src={lesson.external_video_url}
                  allow="autoplay; fullscreen; picture-in-picture"
                  allowFullScreen
                />
              </div>
            ) : null}
            {lesson.video_provider === 'upload' && lesson.video_storage_path ? (
              <LessonVideoPlayer lessonId={lesson.id} />
            ) : null}
          </>
        ) : null}

        {lesson.summary ? (
          <p style={{ color: 'var(--muted)', marginTop: 0 }}>{lesson.summary}</p>
        ) : null}

        {lesson.body ? (
          <section className="membership-section">
            <div className="article-body">{lesson.body}</div>
          </section>
        ) : null}

        {materials && materials.length ? (
          <section className="membership-section">
            <h3>Materiales descargables</h3>
            <ul className="membership-list">
              {materials.map((m) => (
                <li key={m.id}>
                  <a href={`/api/attachments/${m.id}`} target="_blank" rel="noopener noreferrer">
                    <span>
                      <strong>{m.file_name}</strong>
                      <div className="item-meta">{m.mime_type}</div>
                    </span>
                    <span className="item-meta">Descargar →</span>
                  </a>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <div style={{ marginTop: 22 }}>
          <Link href={`/membresia/${tier.slug}`} className="membership-cta secondary">
            ← Volver al nivel
          </Link>
        </div>
      </div>
    </main>
  )
}
