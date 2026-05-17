import Link from 'next/link'
import { notFound, redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import UserDetail from './UserDetail'
import '../../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminUserDetailPage({ params }) {
  const { user: currentUser, profile: currentProfile } = await getCurrentAuth()
  if (!currentUser) redirect('/login?next=/admin/usuarios')
  if (!isStaff(currentProfile)) redirect('/cuenta')

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const [profileResult, enrollmentsResult, grantsResult, coursesResult, tiersResult] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).maybeSingle(),
    supabase
      .from('course_enrollments')
      .select('id, course_id, access_status, granted_at, expires_at, courses(id, slug, title, status, category)')
      .eq('user_id', id)
      .order('granted_at', { ascending: false }),
    supabase
      .from('membership_grants')
      .select('id, tier_id, access_status, grant_type, granted_at, expires_at, notes, payment_reference, membership_tiers(id, slug, name, billing_period, price_ars)')
      .eq('user_id', id)
      .order('granted_at', { ascending: false }),
    supabase
      .from('courses')
      .select('id, title, status, category')
      .eq('status', 'published')
      .order('title', { ascending: true }),
    supabase
      .from('membership_tiers')
      .select('id, name, billing_period, price_ars, status')
      .in('status', ['published', 'draft'])
      .order('sort_order', { ascending: true }),
  ])

  if (!profileResult.data) notFound()

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header" style={{ marginBottom: 0 }}>
          <div>
            <div className="breadcrumb">
              <Link href="/admin/usuarios">← Volver a usuarios</Link>
            </div>
            <h1 style={{ marginBottom: 0 }}>
              {profileResult.data.display_name || profileResult.data.full_name || profileResult.data.email}
            </h1>
          </div>
        </header>

        <UserDetail
          profile={profileResult.data}
          enrollments={enrollmentsResult.data || []}
          grants={grantsResult.data || []}
          availableCourses={coursesResult.data || []}
          availableTiers={tiersResult.data || []}
          userId={id}
        />
      </div>
    </main>
  )
}
