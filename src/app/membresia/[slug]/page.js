import Link from 'next/link'
import { notFound } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import MembershipContentSection from './MembershipContentSection'
import MembershipAgenda from '@/components/club/MembershipAgenda'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import {
  canAccessMembershipContentItem,
  getClubAccessFromGrants,
} from '@/lib/memberships'
import { formatPriceArs, getPublicMembershipPaymentPlans } from '@/lib/membership-pricing'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import '../membership.css'

export const dynamic = 'force-dynamic'

export default async function MembershipTierPage({ params, searchParams }) {
  const { slug } = await params
  const sp = await searchParams
  const paymentStatus = sp?.payment || null
  const subscriptionStatus = sp?.subscription || null

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
  let clubAccess = { hasAccess: false, isFounder: false, grant: null, grants: [] }
  if (user) {
    const { data } = await admin
      .from('membership_grants')
      .select('tier_id, access_status, expires_at, granted_at, starts_at, grant_type, membership_tiers(slug, billing_period, price_ars, features, description)')
      .eq('user_id', user.id)
    clubAccess = getClubAccessFromGrants(data || [])
    // Direct check: does this user have an active grant for THIS specific tier?
    // This works for any tier, not just legacy slugs.
    if (!clubAccess.hasAccess) {
      const now = new Date()
      const directGrant = (data || []).find(
        (g) =>
          g.tier_id === tier.id &&
          g.access_status === 'active' &&
          (!g.expires_at || new Date(g.expires_at) > now)
      )
      if (directGrant) {
        clubAccess = { hasAccess: true, isFounder: false, grant: directGrant, grants: [directGrant] }
      }
    }
    grant = clubAccess.grant
  }

  const hasAccess = userIsStaff || clubAccess.hasAccess

  const contentTier = tier

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
  let contentCategories = []
  if (hasAccess && contentTier?.id) {
    const { data: categories } = await admin
      .from('membership_content_categories')
      .select('*')
      .eq('tier_id', contentTier.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    let itemsQuery = admin
      .from('membership_content_items')
      .select('*')
      .eq('tier_id', contentTier.id)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true })

    if (!userIsStaff) {
      itemsQuery = itemsQuery.eq('status', 'published')
    }

    const { data: items } = await itemsQuery
    contentCategories = categories || []
    contentItems = userIsStaff
      ? (items || [])
      : (items || []).filter((item) => canAccessMembershipContentItem(item, clubAccess))
  }

  let agendaEvents = []
  if (hasAccess) {
    // Agenda global del Club (tier_id null) + eventos específicos del tier.
    const { data: events } = await admin
      .from('membership_agenda_events')
      .select('*')
      .or(`tier_id.is.null,tier_id.eq.${contentTier?.id}`)
      .order('starts_at', { ascending: true })
    agendaEvents = events || []
  }

  const features = Array.isArray(tier.features) ? tier.features : []
  const { data: settings } = await admin
    .from('platform_settings')
    .select('public_membership_monthly_price_ars, public_membership_annual_price_ars, club_agenda_visible, club_next_live_visible')
    .maybeSingle()
  const showAgenda = settings?.club_agenda_visible ?? true
  const showNextLive = settings?.club_next_live_visible ?? true
  const paymentPlans = getPublicMembershipPaymentPlans({ tier, settings: settings || {} })
  const monthlyPlan = paymentPlans.find((plan) => plan.id === 'monthly') || paymentPlans[0]
  const directAccessHref = courses.length > 0 ? `/membresias/${tier.slug}/${courses[0].slug}` : `/membresias/${tier.slug}`
  const checkoutHref = user ? `/checkout/${tier.slug}` : `/login?next=/checkout/${tier.slug}`

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref={`/login?next=/membresias/${slug}`}>
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
          </header>

          {!hasAccess ? (
            <div className="membership-summary-row">
              <section className="membership-detail-card membership-summary-card">
                <p className="summary-kicker">Tu membresía</p>
                <div className="membership-detail-price">
                  <div className="membership-detail-price-value">
                    {formatPriceArs(monthlyPlan.priceArs)}
                  </div>
                  <div className="membership-detail-price-meta">
                    ARS / mes
                  </div>
                </div>
                <Link className="membership-detail-primary" href={checkoutHref}>
                  Sumarme ahora →
                </Link>
              </section>

              <section className="membership-detail-card membership-summary-card">
                <h3>Estado</h3>
                <p>Todavía no tenés acceso activo.</p>
                <div className="membership-detail-meta">
                  <div><strong>{courses.length}</strong> talleres incluidos</div>
                  <div><strong>{contentItems.length}</strong> recursos exclusivos</div>
                </div>
              </section>

              <section className="membership-detail-card membership-summary-card">
                <h3>Beneficios</h3>
                {features.length > 0 ? (
                  <ul className="membership-detail-list">
                    {features.slice(0, 4).map((feature, index) => <li key={`${feature}-${index}`}>{feature}</li>)}
                  </ul>
                ) : (
                  <p>No hay beneficios cargados todavía.</p>
                )}
              </section>
            </div>
          ) : null}

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
          {subscriptionStatus === 'pending' ? (
            <div className="membership-status pending">
              Recibimos tu solicitud de suscripción. El acceso se activa automáticamente cuando Mercado Pago acredita el primer pago.
            </div>
          ) : null}

          {hasAccess ? (
            <MembershipAgenda events={agendaEvents} showAgenda={showAgenda} showNextLive={showNextLive} />
          ) : null}

          <div className="membership-detail-grid membership-detail-grid-full">
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
                    <MembershipContentSection items={contentItems} categories={contentCategories} />
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
          </div>
        </div>
      </section>
    </PublicSiteShell>
  )
}
