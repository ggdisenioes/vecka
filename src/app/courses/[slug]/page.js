import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { Badge, ButtonLink, Card, EmptyState, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth } from '@/lib/auth'
import { getLegacyFrontData } from '@/lib/legacy-front'
import '../../membresia/membership.css'

export const dynamic = 'force-dynamic'

function lessonCount(course) {
  return (course.modules || []).reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
}

export default async function CoursePage({ params }) {
  const { slug } = await params
  const [{ user, profile }, data] = await Promise.all([
    getCurrentAuth(),
    getLegacyFrontData({ courseSlug: slug }),
  ])
  const course = (data.courses || []).find((item) => item.slug === slug)

  if (!course || !data.selectedCourseId) {
    notFound()
  }

  const totalLessons = lessonCount(course)

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref={`/login?next=/courses/${slug}`}>
      <main className="vk-page">
        <div className="vk-container">
          <PageHeader
            kicker={course.category || 'Taller VeCKA'}
            title={course.title}
            lede={course.subtitle || course.description || 'Un taller online de VeCKA para aprender a tu ritmo.'}
            actions={course.canAccess ? (
              <ButtonLink href="/cuenta">Ver en mi cuenta</ButtonLink>
            ) : (
              <ButtonLink href="/membresias">Acceder con Club VeCKA</ButtonLink>
            )}
          />

          <section className="membership-detail-hero">
            <div className="membership-detail-hero-copy">
              <div className="vk-cluster">
                <Badge>{course.level || 'Todos los niveles'}</Badge>
                <Badge tone="warm">{course.duration || 'A tu ritmo'}</Badge>
                <Badge tone="neutral">{totalLessons} clases</Badge>
              </div>
              <h2>Contenido del taller</h2>
              <p>
                Esta pantalla ya usa la experiencia nativa de VeCKA. Desde acá podés revisar el programa y entrar desde tu cuenta si tenés acceso activo.
              </p>
            </div>
            <div className="home-hero-media">
              {course.coverImageUrl ? (
                <img src={course.coverImageUrl} alt={course.title} />
              ) : (
                <img src="/Portada-club-anual.png" alt={course.title} />
              )}
            </div>
          </section>

          <section className="vk-card vk-card-padded" style={{ marginTop: 22 }}>
            <div className="vk-section-heading">
              <h2>Programa</h2>
              {course.canAccess ? (
                <Link href="/cuenta" className="vk-button secondary">Entrar desde mi cuenta</Link>
              ) : (
                <Link href="/login" className="vk-button secondary">Iniciar sesión</Link>
              )}
            </div>
            {course.modules?.length ? (
              <div className="vk-stack">
                {course.modules.map((module) => (
                  <Card key={module.id || module.title} className="vk-stack">
                    <h3 style={{ margin: 0, fontSize: 28 }}>{module.title}</h3>
                    {module.description ? <p style={{ margin: 0, color: 'var(--muted)' }}>{module.description}</p> : null}
                    {module.lessons?.length ? (
                      <div className="membership-list">
                        {module.lessons.map((lesson) => (
                          <div key={lesson.id || lesson.slug} className="item">
                            <strong>{lesson.title}</strong>
                            {lesson.summary ? <span className="item-meta">{lesson.summary}</span> : null}
                          </div>
                        ))}
                      </div>
                    ) : null}
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState>El programa de este taller se está terminando de cargar.</EmptyState>
            )}
          </section>
        </div>
      </main>
    </PublicSiteShell>
  )
}
