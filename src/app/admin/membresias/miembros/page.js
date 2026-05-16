import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import MembersPanel from './MembersPanel'
import '../../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminMembersPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias/miembros')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()

  const [tiersResult, grantsResult] = await Promise.all([
    supabase
      .from('membership_tiers')
      .select('id, name, billing_period, price_ars, status')
      .order('sort_order', { ascending: true }),
    supabase
      .from('membership_grants')
      .select('id, tier_id, user_id, access_status, granted_at, expires_at, starts_at, cancelled_at, notes, payment_reference, membership_tiers(id, name, billing_period, price_ars)')
      .order('granted_at', { ascending: false }),
  ])

  const tiers = tiersResult.data || []
  const grants = grantsResult.data || []

  // Hydrate profiles
  const userIds = [...new Set(grants.map((g) => g.user_id))]
  let profilesById = new Map()
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('id', userIds)
    profilesById = new Map((profiles || []).map((p) => [p.id, p]))
  }

  const grantsHydrated = grants.map((g) => ({
    ...g,
    tier: g.membership_tiers || null,
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
            <h1>Todos los miembros</h1>
          </div>
        </header>

        <MembersPanel initialGrants={grantsHydrated} tiers={tiers} />
      </div>
    </main>
  )
}
