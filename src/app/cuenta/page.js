import { redirect } from 'next/navigation'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import AccountScreen from './AccountScreen'
import { getCurrentAuth } from '@/lib/auth'
import { buildPublicMembershipSummary, getClubAccessFromGrants } from '@/lib/memberships'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

function initialsFromName(name, email) {
  const source = String(name || email || 'V').trim()
  return (
    source
      .split(/\s+/)
      .map((part) => part[0]?.toUpperCase())
      .filter(Boolean)
      .slice(0, 2)
      .join('')
    || 'V'
  )
}

function purchaseStatusLabel(grant) {
  if (grant.access_status === 'active') return 'Completado'
  if (grant.access_status === 'cancelled') return 'Cancelado'
  if (grant.access_status === 'expired') return 'Vencido'
  return 'Pendiente'
}

function purchaseAmount(grant) {
  const match = String(grant.notes || '').match(/Monto acreditado:\s*ARS\s*([0-9]+(?:[.,][0-9]+)?)/i)
  if (!match) return Number(grant.membership_tiers?.price_ars || 0)

  const normalized = match[1].replace(/\./g, '').replace(',', '.')
  const amount = Number(normalized)
  return Number.isFinite(amount) ? amount : Number(grant.membership_tiers?.price_ars || 0)
}

function countLessons(course) {
  return (course.modules || []).reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
}

export default async function AccountPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/cuenta')

  const admin = getSupabaseAdmin()
  const nowIso = new Date().toISOString()

  const [enrollmentsResult, grantsResult, purchasesResult] = await Promise.all([
    admin
      .from('course_enrollments')
      .select('course_id')
      .eq('user_id', user.id)
      .eq('access_status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    admin
      .from('membership_grants')
      .select('id, tier_id, access_status, granted_at, starts_at, expires_at, membership_tiers(id, slug, name, billing_period, price_ars, features, description)')
      .eq('user_id', user.id)
      .eq('access_status', 'active')
      .or(`expires_at.is.null,expires_at.gt.${nowIso}`),
    admin
      .from('membership_grants')
      .select('id, access_status, grant_type, granted_at, starts_at, payment_reference, notes, membership_tiers(id, name, price_ars)')
      .eq('user_id', user.id)
      .or('grant_type.eq.payment,payment_reference.not.is.null')
      .order('granted_at', { ascending: false }),
  ])

  const enrollmentIds = [...new Set((enrollmentsResult.data || []).map((row) => row.course_id).filter(Boolean))]
  const activeGrants = grantsResult.data || []
  const activeTierIds = [...new Set(activeGrants.map((grant) => grant.tier_id).filter(Boolean))]

  const [directCoursesResult, membershipCourseRowsResult] = await Promise.all([
    enrollmentIds.length
      ? admin
          .from('courses')
          .select('id, slug, title, subtitle, status, modules:course_modules(id, lessons:course_lessons(id))')
          .in('id', enrollmentIds)
          .eq('status', 'published')
      : Promise.resolve({ data: [] }),
    activeTierIds.length
      ? admin
          .from('membership_tier_courses')
          .select('tier_id, course:courses(id, slug, title, subtitle, status, modules:course_modules(id, lessons:course_lessons(id)))')
          .in('tier_id', activeTierIds)
      : Promise.resolve({ data: [] }),
  ])

  const coursesById = new Map()

  for (const course of directCoursesResult.data || []) {
    coursesById.set(course.id, {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle || '',
      lessonCount: countLessons(course),
      href: `/courses/${course.slug}`,
      accessLabel: 'Compra directa',
      sourceLabel: 'Acceso individual',
      sortKey: 0,
    })
  }

  for (const row of membershipCourseRowsResult.data || []) {
    const course = row.course
    if (!course || course.status !== 'published' || coursesById.has(course.id)) continue
    coursesById.set(course.id, {
      id: course.id,
      slug: course.slug,
      title: course.title,
      subtitle: course.subtitle || '',
      lessonCount: countLessons(course),
      href: `/courses/${course.slug}`,
      accessLabel: 'Incluido',
      sourceLabel: 'Acceso por membresía',
      sortKey: 1,
    })
  }

  const clubAccess = getClubAccessFromGrants(activeGrants)
  const memberships = buildPublicMembershipSummary(clubAccess).map((membership) => ({
    ...membership,
    href: `/membresias/${membership.tierSlug}`,
  }))

  const purchases = (purchasesResult.data || []).map((grant) => ({
    id: grant.payment_reference ? String(grant.payment_reference) : `MEM-${String(grant.id || '').slice(0, 8)}`,
    date: grant.granted_at || grant.starts_at || null,
    items: grant.membership_tiers?.name || 'Membresía VeCKA',
    total: purchaseAmount(grant),
    status: purchaseStatusLabel(grant),
  }))

  const accountUser = {
    id: user.id,
    name: profile?.display_name || profile?.full_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario',
    email: user.email || profile?.email || '',
    avatar: initialsFromName(profile?.display_name || profile?.full_name || user.user_metadata?.full_name, user.email),
    isStaff: profile?.role === 'admin' || profile?.role === 'editorial',
  }

  const courses = [...coursesById.values()].sort((left, right) => {
    if (left.sortKey !== right.sortKey) return left.sortKey - right.sortKey
    return left.title.localeCompare(right.title, 'es')
  })

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/cuenta">
      <AccountScreen
        user={accountUser}
        memberships={memberships}
        courses={courses}
        purchases={purchases}
      />
    </PublicSiteShell>
  )
}
