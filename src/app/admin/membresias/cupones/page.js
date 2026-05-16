import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import CouponsPanel from './CouponsPanel'
import '../../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminCouponsPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias/cupones')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()

  const [couponsResult, tiersResult] = await Promise.all([
    supabase.from('membership_coupons').select('*').order('created_at', { ascending: false }),
    supabase.from('membership_tiers').select('id, name').order('sort_order', { ascending: true }),
  ])

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin/membresias">← Volver a membresías</Link>
            </div>
            <h1>Cupones de descuento</h1>
          </div>
        </header>

        <CouponsPanel initialCoupons={couponsResult.data || []} tiers={tiersResult.data || []} />
      </div>
    </main>
  )
}
