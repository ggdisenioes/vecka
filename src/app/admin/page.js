import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Badge, ButtonLink, Card, EmptyState, MetricCard, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

function formatDate(value) {
  if (!value) return 'Sin fecha'
  return new Date(value).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })
}

function formatCurrency(value) {
  return Number(value || 0).toLocaleString('es-AR', {
    style: 'currency',
    currency: 'ARS',
    maximumFractionDigits: 0,
  })
}

function countValue(result) {
  return Number(result?.count || 0)
}

export default async function AdminPage() {
  const { user, profile } = await getCurrentAuth()

  if (!user) {
    redirect('/login?next=/admin')
  }

  if (!isStaff(profile)) {
    redirect('/cuenta')
  }

  const supabase = getSupabaseAdmin()
  const [
    coursesCount,
    publishedCoursesCount,
    tiersResult,
    activeMembersCount,
    usersCount,
    activeCouponsCount,
    recentCoursesResult,
    recentGrantsResult,
  ] = await Promise.all([
    supabase.from('courses').select('id', { count: 'exact', head: true }),
    supabase.from('courses').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    supabase
      .from('membership_tiers')
      .select('id, slug, name, status, price_ars, billing_period, updated_at')
      .order('sort_order', { ascending: true })
      .order('updated_at', { ascending: false }),
    supabase.from('membership_grants').select('id', { count: 'exact', head: true }).eq('access_status', 'active'),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase.from('membership_coupons').select('id', { count: 'exact', head: true }).eq('active', true),
    supabase
      .from('courses')
      .select('id, title, status, visibility, updated_at')
      .order('updated_at', { ascending: false })
      .limit(5),
    supabase
      .from('membership_grants')
      .select('id, user_id, access_status, grant_type, granted_at, payment_reference, membership_tiers(name, price_ars)')
      .order('granted_at', { ascending: false })
      .limit(5),
  ])

  const tiers = tiersResult.data || []
  const recentCourses = recentCoursesResult.data || []
  const recentGrants = recentGrantsResult.data || []
  const publishedTiers = tiers.filter((tier) => tier.status === 'published')
  const draftTiers = tiers.filter((tier) => tier.status !== 'published')

  const quickActions = [
    {
      href: '/admin/courses',
      title: 'Gestionar cursos',
      description: 'Editar talleres, lecciones, materiales y visibilidad.',
    },
    {
      href: '/admin/membresias',
      title: 'Gestionar membresías',
      description: 'Configurar planes, contenido exclusivo y accesos.',
    },
    {
      href: '/admin/usuarios',
      title: 'Ver usuarios',
      description: 'Buscar alumnas, roles, accesos y compras.',
    },
    {
      href: '/admin/ajustes',
      title: 'Ajustes de checkout',
      description: 'Precios públicos, datos bancarios y textos operativos.',
    },
  ]

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <PageHeader
          kicker="Administración VeCKA"
          title="Panel de control"
          lede="Una vista operativa para cursos, membresías, usuarios y configuración comercial."
          actions={(
            <>
              <ButtonLink href="/admin/membresias" variant="secondary">Membresías</ButtonLink>
              <ButtonLink href="/admin/courses">Nuevo contenido</ButtonLink>
            </>
          )}
        />

        <section className="vk-metric-grid" aria-label="Resumen operativo">
          <MetricCard value={countValue(coursesCount)} label="Cursos totales" />
          <MetricCard value={countValue(publishedCoursesCount)} label="Cursos publicados" />
          <MetricCard value={publishedTiers.length} label="Membresías publicadas" />
          <MetricCard value={countValue(activeMembersCount)} label="Miembros activos" />
          <MetricCard value={countValue(usersCount)} label="Usuarios registrados" />
          <MetricCard value={countValue(activeCouponsCount)} label="Cupones activos" />
        </section>

        <div className="admin-dashboard-grid" style={{ marginTop: 22 }}>
          <Card>
            <div className="section-heading">
              <h2>Acciones frecuentes</h2>
            </div>
            <div className="admin-dashboard-actions">
              {quickActions.map((action) => (
                <Link key={action.href} href={action.href} className="admin-dashboard-action">
                  <strong>{action.title}</strong>
                  <span>{action.description}</span>
                </Link>
              ))}
            </div>
          </Card>

          <Card>
            <div className="section-heading">
              <h2>Estado del catálogo</h2>
            </div>
            <div className="admin-dashboard-list">
              <div className="admin-dashboard-list-item">
                <div>
                  <strong>Cursos pendientes</strong>
                  <small>Borradores o archivados</small>
                </div>
                <Badge tone="warm">{Math.max(countValue(coursesCount) - countValue(publishedCoursesCount), 0)}</Badge>
              </div>
              <div className="admin-dashboard-list-item">
                <div>
                  <strong>Membresías en revisión</strong>
                  <small>No publicadas todavía</small>
                </div>
                <Badge tone="rose">{draftTiers.length}</Badge>
              </div>
              <div className="admin-dashboard-list-item">
                <div>
                  <strong>Ingreso base mensual</strong>
                  <small>Según miembros activos y primer plan publicado</small>
                </div>
                <Badge>{formatCurrency((publishedTiers[0]?.price_ars || 0) * countValue(activeMembersCount))}</Badge>
              </div>
            </div>
          </Card>

          <Card>
            <div className="section-heading">
              <h2>Cursos recientes</h2>
              <Link href="/admin/courses" className="admin-button ghost">Ver todos</Link>
            </div>
            {recentCourses.length ? (
              <div className="admin-dashboard-list">
                {recentCourses.map((course) => (
                  <Link key={course.id} href={`/admin/courses/${course.id}`} className="admin-dashboard-list-item">
                    <div>
                      <strong>{course.title || 'Sin título'}</strong>
                      <small>{formatDate(course.updated_at)}</small>
                    </div>
                    <Badge tone={course.status === 'published' ? '' : 'neutral'}>
                      {course.status === 'published' ? 'Publicado' : 'Borrador'}
                    </Badge>
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState>No hay cursos cargados todavía.</EmptyState>
            )}
          </Card>

          <Card>
            <div className="section-heading">
              <h2>Últimos accesos</h2>
              <Link href="/admin/membresias/miembros" className="admin-button ghost">Ver miembros</Link>
            </div>
            {recentGrants.length ? (
              <div className="admin-dashboard-list">
                {recentGrants.map((grant) => (
                  <div key={grant.id} className="admin-dashboard-list-item">
                    <div>
                      <strong>{grant.membership_tiers?.name || 'Membresía VeCKA'}</strong>
                      <small>{grant.payment_reference || grant.user_id}</small>
                    </div>
                    <Badge tone={grant.access_status === 'active' ? '' : 'neutral'}>
                      {formatDate(grant.granted_at)}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState>No hay accesos recientes.</EmptyState>
            )}
          </Card>
        </div>
      </div>
    </main>
  )
}
