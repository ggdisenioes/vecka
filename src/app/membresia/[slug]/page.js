import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabaseServer } from '@/lib/supabase/server'
import '../membership.css'

export const dynamic = 'force-dynamic'

function RichBody({ html }) {
  if (!html) return null
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
}

function formatPrice(value) {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  }).format(Number(value || 0))
}

function periodLabel(period) {
  if (period === 'annual') return 'año'
  if (period === 'lifetime') return 'vitalicia'
  return 'mes'
}

function contentTypeLabel(type) {
  if (type === 'download') return 'Descargable'
  if (type === 'image') return 'Imagen'
  if (type === 'link') return 'Link'
  if (type === 'embed') return 'Video'
  return 'Texto'
}

export default async function MembershipTierPage({ params, searchParams }) {
  const { slug } = await params
  const sp = await searchParams
  const paymentStatus = sp?.payment || null

  const { user, profile } = await getCurrentAuth()
  const userIsStaff = isStaff(profile)
  const admin = getSupabaseAdmin()

  const { data: tier } = await admin
    .from('membership_tiers')
    .select('id, slug, name, description, status, price_ars, price_usd, billing_period, features, trial_days, is_featured')
    .eq('slug', slug)
    .maybeSingle()

  if (!tier) notFound()
  if (tier.status !== 'published' && !userIsStaff) notFound()

  let grant = null
  if (user) {
    const supabase = await getSupabaseServer()
    const { data } = await supabase
      .from('membership_grants')
      .select('access_status, expires_at, granted_at, grant_type')
      .eq('tier_id', tier.id)
      .eq('user_id', user.id)
      .maybeSingle()
    grant = data
  }

  const hasAccess = userIsStaff || (
    grant?.access_status === 'active' &&
    (!grant.expires_at || new Date(grant.expires_at) > new Date())
  )

  const { data: tierCourses } = await admin
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
    .filter((course) => userIsStaff || course.status === 'published')

  let contentItems = []
  if (hasAccess) {
    let itemsQuery = admin
      .from('membership_content_items')
      .select('*')
      .eq('tier_id', tier.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!userIsStaff) {
      itemsQuery = itemsQuery.eq('status', 'published')
    }

    const { data: items } = await itemsQuery
    contentItems = items || []
  }

  const features = Array.isArray(tier.features) ? tier.features : []
  const directAccessHref = courses.length > 0 ? `/membresias/${tier.slug}/${courses[0].slug}` : `/membresias/${tier.slug}`
  const checkoutHref = user ? `/checkout/${tier.slug}` : `/login?next=/checkout/${tier.slug}`

  return (
    <PublicSiteShell user={user} loginHref={`/login?next=/membresias/${slug}`}>
      <section className="membership-shell">
        <div className="membership-container" style={{ paddingTop: 48 }}>
          <Link href="/membresias" className="lovable-back-link">← Volver a membresías</Link>

          <header className="membership-detail-hero">
            <div className="membership-detail-hero-copy">
              <span className="lovable-eyebrow">CLUB VECKA</span>
              <h1>{tier.name}</h1>
              {tier.description ? <p>{tier.description}</p> : null}

              <div className="pill-row membership-detail-pills" style={{ marginTop: 20 }}>
                {userIsStaff && tier.status !== 'published' ? (
                  <span className="membership-pill expired">
                    {tier.status === 'draft' ? 'Borrador' : 'Archivada'}
                  </span>
                ) : null}
                {hasAccess ? (
                  <span className="membership-pill active">
                    Acceso activo{grant?.expires_at ? ` · hasta ${new Date(grant.expires_at).toLocaleDateString('es-AR')}` : ' · vigente'}
                  </span>
                ) : (
                  <span className="membership-pill expired">Sin acceso activo</span>
                )}
              </div>
            </div>

            <aside className="membership-detail-side">
              <p className="summary-kicker" style={{ color: 'var(--vck-primary)', fontSize: 12, letterSpacing: '.1em', textTransform: 'uppercase', margin: 0 }}>
                Tu membresía
              </p>
              <div className="membership-detail-price">
                <div className="membership-detail-price-value">
                  {Number(tier.price_ars || 0) > 0 ? formatPrice(tier.price_ars) : 'Gratis'}
                </div>
                <div className="membership-detail-price-meta">
                  {Number(tier.price_ars || 0) > 0 ? `ARS / ${periodLabel(tier.billing_period)}` : 'Acceso sin cargo'}
                </div>
              </div>

              <div className="membership-detail-meta">
                <div><strong>{courses.length}</strong> talleres incluidos</div>
                <div><strong>{contentItems.length}</strong> recursos exclusivos</div>
                <div><strong>{features.length}</strong> beneficios</div>
              </div>

              {hasAccess ? (
                <Link className="membership-detail-primary" href={directAccessHref}>
                  Ir a la membresía →
                </Link>
              ) : (
                <Link className="membership-detail-primary" href={checkoutHref}>
                  Sumarme ahora →
                </Link>
              )}
            </aside>
          </header>

          {userIsStaff ? (
            <div className="membership-admin-banner" style={{ marginTop: 24 }}>
              Vista administradora: podés ver esta membresía y su contenido aunque no esté publicada o no tengas un grant activo.
            </div>
          ) : null}

          {paymentStatus === 'success' ? (
            <div className="membership-status success">✓ Pago aprobado. Tu membresía ya está activa.</div>
          ) : null}
          {paymentStatus === 'failure' ? (
            <div className="membership-status error">El pago no pudo procesarse. Podés intentarlo nuevamente.</div>
          ) : null}
          {paymentStatus === 'pending' ? (
            <div className="membership-status pending">Tu pago está pendiente de confirmación.</div>
          ) : null}

          <div className="membership-detail-grid">
            <div className="membership-detail-main">
              {!hasAccess ? (
                <section className="membership-section">
                  <h2>Qué incluye</h2>
                  {features.length > 0 ? (
                    <ul className="lovable-tier-benefits">
                      {features.map((feature, index) => (
                        <li key={`${feature}-${index}`}>
                          <span className="lovable-check">✓</span>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="item-meta">Próximamente vamos a cargar los beneficios completos.</p>
                  )}

                  {courses.length > 0 ? (
                    <div style={{ marginTop: 24 }}>
                      <h3>Talleres incluidos</h3>
                      <ul className="membership-list">
                        {courses.map((course) => (
                          <li key={course.id}>
                            <div className="item">
                              <span>
                                <strong>{course.title}</strong>
                                {course.subtitle ? <div className="item-meta">{course.subtitle}</div> : null}
                              </span>
                              <span className="item-meta">Incluido</span>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </section>
              ) : courses.length === 0 && contentItems.length === 0 ? (
                <div className="membership-locked">Aún no hay contenido publicado para esta membresía. Volvé pronto.</div>
              ) : (
                <>
                  {contentItems.length > 0 ? (
                    <section className="membership-section">
                      <h2>Contenido exclusivo</h2>
                      <div className="membership-content-grid">
                        {contentItems.map((item) => {
                          const privateFileUrl = item.storage_path ? `/api/membership-content/${item.id}` : null
                          const mediaHref = privateFileUrl || item.media_url
                          return (
                            <article key={item.id} className="membership-resource-card">
                              <div className="item-meta">{contentTypeLabel(item.type)}</div>
                              <h3>{item.title}</h3>
                              {item.summary ? <p>{item.summary}</p> : null}

                              {item.type === 'image' && mediaHref ? (
                                <img src={mediaHref} alt={item.title} className="membership-resource-image" />
                              ) : null}

                              {item.type === 'embed' && item.media_url ? (
                                <div className="video-frame">
                                  <iframe src={item.media_url} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                                </div>
                              ) : null}

                              {item.body ? <RichBody html={item.body} /> : null}

                              {item.type === 'download' && mediaHref ? (
                                <a className="membership-cta secondary" href={mediaHref} target="_blank" rel="noopener noreferrer">
                                  Descargar {item.file_name || 'archivo'}
                                </a>
                              ) : null}

                              {item.type === 'link' && item.media_url ? (
                                <a className="membership-cta secondary" href={item.media_url} target="_blank" rel="noopener noreferrer">
                                  Abrir recurso
                                </a>
                              ) : null}
                            </article>
                          )
                        })}
                      </div>
                    </section>
                  ) : null}

                  {courses.map((course) => {
                    const modules = (course.modules || [])
                      .slice()
                      .sort((a, b) => (a.position || 0) - (b.position || 0))
                    return (
                      <section key={course.id} className="membership-section">
                        <h2>{course.title}</h2>
                        {course.subtitle ? <p className="item-meta">{course.subtitle}</p> : null}
                        {modules.length === 0 ? (
                          <div className="membership-locked" style={{ marginTop: 12 }}>Próximamente.</div>
                        ) : (
                          modules.map((mod) => {
                            const lessons = (mod.lessons || [])
                              .filter((lesson) => userIsStaff || lesson.status === 'published')
                              .sort((a, b) => (a.position || 0) - (b.position || 0))
                            return (
                              <div key={mod.id} style={{ marginTop: 18 }}>
                                <h3>{mod.title}</h3>
                                {lessons.length === 0 ? (
                                  <p className="item-meta">Sin clases publicadas todavía.</p>
                                ) : (
                                  <ul className="membership-list">
                                    {lessons.map((lesson) => (
                                      <li key={lesson.id}>
                                        <Link href={`/membresias/${tier.slug}/${course.slug}/${lesson.slug}`}>
                                          <span>
                                            <strong>{lesson.title}</strong>
                                            {lesson.summary ? <div className="item-meta">{lesson.summary}</div> : null}
                                          </span>
                                          <span className="item-meta">
                                            {lesson.lesson_type === 'live_session'
                                              ? lesson.live_session_at
                                                ? `En vivo · ${new Date(lesson.live_session_at).toLocaleString('es-AR', { dateStyle: 'short', timeStyle: 'short' })}`
                                                : 'En vivo'
                                              : lesson.lesson_type === 'article'
                                                ? 'Artículo'
                                                : lesson.lesson_type === 'attachment'
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
                  })}
                </>
              )}
            </div>

            <aside className="membership-detail-sidebar">
              <section className="membership-detail-card">
                <h3>Estado</h3>
                <p>{hasAccess ? 'Tenés acceso a esta membresía.' : 'Todavía no tenés acceso activo.'}</p>
              </section>

              <section className="membership-detail-card">
                <h3>Beneficios</h3>
                {features.length > 0 ? (
                  <ul className="membership-detail-list">
                    {features.map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}
                  </ul>
                ) : (
                  <p>No hay beneficios cargados todavía.</p>
                )}
              </section>
            </aside>
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
