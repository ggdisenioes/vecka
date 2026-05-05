import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseServer } from '@/lib/supabase/server'
import '../membership.css'

export const dynamic = 'force-dynamic'

export default async function MembershipTierPage({ params }) {
  const { slug } = await params
  const supabase = await getSupabaseServer()
  const { user } = await getCurrentAuth()

  const { data: tier } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, status')
    .eq('slug', slug)
    .maybeSingle()

  if (!tier) notFound()
  if (tier.status !== 'published') notFound()

  if (!user) {
    redirect(`/login?next=/membresia/${slug}`)
  }

  // ¿Tiene acceso activo a este tier?
  const { data: grant } = await supabase
    .from('membership_grants')
    .select('access_status, expires_at, granted_at')
    .eq('tier_id', tier.id)
    .eq('user_id', user.id)
    .maybeSingle()

  const hasAccess =
    grant?.access_status === 'active' &&
    (!grant.expires_at || new Date(grant.expires_at) > new Date())

  // Cursos del tier (RLS deja pasar si está publicado, o si el usuario tiene acceso, o si es staff).
  const { data: tierCourses } = await supabase
    .from('membership_tier_courses')
    .select(`
      sort_order,
      course:courses(id, slug, title, subtitle, description, cover_image_url, status,
        modules:course_modules(
          id, title, description, position,
          lessons:course_lessons(id, slug, title, summary, status, position, lesson_type, live_session_at)
        )
      )
    `)
    .eq('tier_id', tier.id)
    .order('sort_order', { ascending: true })

  const courses = (tierCourses || [])
    .map((row) => row.course)
    .filter(Boolean)
    .filter((c) => c.status === 'published')

  return (
    <main className="membership-shell">
      <div className="membership-container">
        <div className="breadcrumb-row">
          <Link href="/membresia">← Membresías</Link>
        </div>

        <header className="membership-hero" style={{ textAlign: 'left', marginBottom: 24 }}>
          <h1 style={{ fontSize: 36 }}>{tier.name}</h1>
          {tier.description ? <p style={{ margin: '8px 0 0' }}>{tier.description}</p> : null}
          <div className="pill-row" style={{ marginTop: 14 }}>
            {hasAccess ? (
              <span className="membership-pill active">
                Acceso activo{grant?.expires_at ? ` · hasta ${new Date(grant.expires_at).toLocaleDateString('es-AR')}` : ' · vitalicia'}
              </span>
            ) : (
              <span className="membership-pill expired">Sin acceso</span>
            )}
          </div>
        </header>

        {!hasAccess ? (
          <div className="membership-locked">
            <p>
              Esta membresía requiere acceso. Si ya pagaste o creés que deberías tener acceso,
              <strong> contactá a tu administradora</strong> y te lo activamos manualmente.
            </p>
            <p style={{ marginTop: 12 }}>
              <Link href="/contacto" className="membership-cta">Solicitar acceso</Link>
            </p>
            {courses.length ? (
              <div style={{ marginTop: 24, textAlign: 'left' }}>
                <strong>Lo que incluye:</strong>
                <ul style={{ marginTop: 10, paddingLeft: 18 }}>
                  {courses.map((c) => (
                    <li key={c.id} style={{ marginBottom: 4 }}>{c.title}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
        ) : courses.length === 0 ? (
          <div className="membership-locked">
            Aún no hay contenido publicado para esta membresía. Volvé pronto.
          </div>
        ) : (
          courses.map((course) => {
            const modules = (course.modules || [])
              .slice()
              .sort((a, b) => (a.position || 0) - (b.position || 0))
            return (
              <section key={course.id} className="membership-section">
                <h2>{course.title}</h2>
                {course.subtitle ? (
                  <p style={{ color: 'var(--muted)', marginTop: -8 }}>{course.subtitle}</p>
                ) : null}
                {modules.length === 0 ? (
                  <div className="membership-locked" style={{ marginTop: 12 }}>
                    Próximamente.
                  </div>
                ) : (
                  modules.map((mod) => {
                    const lessons = (mod.lessons || [])
                      .filter((l) => l.status === 'published')
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                    return (
                      <div key={mod.id} style={{ marginTop: 18 }}>
                        <h3 style={{ fontSize: 20, marginBottom: 10 }}>{mod.title}</h3>
                        {lessons.length === 0 ? (
                          <p className="item-meta">Sin clases publicadas todavía.</p>
                        ) : (
                          <ul className="membership-list">
                            {lessons.map((l) => (
                              <li key={l.id}>
                                <Link href={`/membresia/${tier.slug}/${course.slug}/${l.slug}`}>
                                  <span>
                                    <strong>{l.title}</strong>
                                    {l.summary ? <div className="item-meta">{l.summary}</div> : null}
                                  </span>
                                  <span className="item-meta">
                                    {l.lesson_type === 'live_session'
                                      ? l.live_session_at
                                        ? `En vivo · ${new Date(l.live_session_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`
                                        : 'En vivo'
                                      : l.lesson_type === 'article'
                                        ? 'Artículo'
                                        : l.lesson_type === 'attachment'
                                          ? 'Descargas'
                                          : 'Video'}
                                  </span>
                                </Link>
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    )
                  })
                )}
              </section>
            )
          })
        )}
      </div>
    </main>
  )
}
