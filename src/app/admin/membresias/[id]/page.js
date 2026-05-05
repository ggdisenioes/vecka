import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import MembershipTierEditor from './MembershipTierEditor'
import '../../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminMembershipTierPage({ params }) {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias')
  if (!isStaff(profile)) redirect('/cuenta')

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: tier, error } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error || !tier) {
    return (
      <main className="admin-shell">
        <div className="admin-container">
          <h1>Membresía</h1>
          <p style={{ color: '#b85c5c' }}>{error?.message || 'No encontrada'}</p>
          <Link href="/admin/membresias" className="admin-button ghost">← Volver</Link>
        </div>
      </main>
    )
  }

  // Cursos enlazados al tier.
  const { data: tierCourseRows } = await supabase
    .from('membership_tier_courses')
    .select('course_id, sort_order, courses(id, slug, title, status, visibility)')
    .eq('tier_id', id)
    .order('sort_order', { ascending: true })

  const tierCourses = (tierCourseRows || []).map((row) => ({
    sort_order: row.sort_order,
    ...(row.courses || { id: row.course_id }),
  }))

  // Todos los cursos (para selector de "agregar curso").
  const { data: allCourses } = await supabase
    .from('courses')
    .select('id, slug, title, status, is_membership')
    .order('updated_at', { ascending: false })

  // Miembros (grants) con perfil.
  const { data: grants } = await supabase
    .from('membership_grants')
    .select('id, user_id, access_status, granted_at, expires_at, notes')
    .eq('tier_id', id)
    .order('granted_at', { ascending: false })

  const userIds = (grants || []).map((g) => g.user_id)
  let profilesById = new Map()
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    profilesById = new Map((profiles || []).map((p) => [p.id, p]))
  }

  const grantsHydrated = (grants || []).map((g) => ({
    ...g,
    profile: profilesById.get(g.user_id) || null,
  }))

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin/membresias">← Volver a membresías</Link>
            </div>
            <h1>{tier.name}</h1>
          </div>
        </header>

        <MembershipTierEditor
          tier={tier}
          initialCourses={tierCourses}
          allCourses={allCourses || []}
          initialGrants={grantsHydrated}
        />
      </div>
    </main>
  )
}
