import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import NewTierButton from './NewTierButton'
import TiersListClient from './TiersListClient'
import '../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminMembershipsListPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()
  const { data: tiers, error } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, status, sort_order, updated_at, price_ars, price_usd, billing_period, is_featured')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  const { data: grants } = await supabase
    .from('membership_grants')
    .select('tier_id')
    .eq('access_status', 'active')

  const { data: tierCourseRows } = await supabase
    .from('membership_tier_courses')
    .select('tier_id, course_id, courses(status)')

  const { data: contentRows } = await supabase
    .from('membership_content_items')
    .select('tier_id, status')

  const counts = new Map()
  for (const g of grants || []) {
    counts.set(g.tier_id, (counts.get(g.tier_id) || 0) + 1)
  }

  const courseCounts = new Map()
  const publishedCourseCounts = new Map()
  const uniqueCourseIds = new Set()
  for (const row of tierCourseRows || []) {
    courseCounts.set(row.tier_id, (courseCounts.get(row.tier_id) || 0) + 1)
    if (row.course_id) uniqueCourseIds.add(row.course_id)
    if (row.courses?.status === 'published') {
      publishedCourseCounts.set(row.tier_id, (publishedCourseCounts.get(row.tier_id) || 0) + 1)
    }
  }

  const contentCounts = new Map()
  const publishedContentCounts = new Map()
  for (const row of contentRows || []) {
    contentCounts.set(row.tier_id, (contentCounts.get(row.tier_id) || 0) + 1)
    if (row.status === 'published') {
      publishedContentCounts.set(row.tier_id, (publishedContentCounts.get(row.tier_id) || 0) + 1)
    }
  }

  const publishedCount = (tiers || []).filter((tier) => tier.status === 'published').length
  const draftCount = (tiers || []).filter((tier) => tier.status === 'draft').length
  const activeMemberCount = (grants || []).length
  const nativeContentCount = (contentRows || []).length

  if (error) {
    return (
      <main className="admin-shell">
        <div className="admin-container">
          <h1>Membresías</h1>
          <p style={{ color: '#b85c5c' }}>Error al cargar: {error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">← Volver al panel</Link>
            </div>
            <h1>Membership Admin</h1>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/admin/membresias/estadisticas" className="admin-button ghost">
              Estadísticas
            </Link>
            <Link href="/admin/membresias/cupones" className="admin-button ghost">
              Cupones
            </Link>
            <Link href="/admin/membresias/miembros" className="admin-button ghost">
              Ver todos los miembros
            </Link>
            <NewTierButton />
          </div>
        </header>

        <section className="admin-card membership-dashboard">
          <div className="section-heading">
            <h2>Membresías</h2>
          </div>
          <div className="admin-metrics">
            <div className="metric-card">
              <span>Publicadas</span>
              <strong>{publishedCount}</strong>
            </div>
            <div className="metric-card">
              <span>Borradores</span>
              <strong>{draftCount}</strong>
            </div>
            <div className="metric-card">
              <span>Miembros activos</span>
              <strong>{activeMemberCount}</strong>
            </div>
            <div className="metric-card">
              <span>Contenido exclusivo</span>
              <strong>{nativeContentCount}</strong>
            </div>
            <div className="metric-card">
              <span>Cursos opcionales</span>
              <strong>{uniqueCourseIds.size}</strong>
            </div>
          </div>
        </section>

        <TiersListClient
          tiers={(tiers || []).map((tier) => ({
            ...tier,
            course_count: courseCounts.get(tier.id) || 0,
            content_count: contentCounts.get(tier.id) || 0,
            published_count: (publishedCourseCounts.get(tier.id) || 0) + (publishedContentCounts.get(tier.id) || 0),
            active_members: counts.get(tier.id) || 0,
          }))}
        />
      </div>
    </main>
  )
}
