import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import UsersTable from './UsersTable'
import '../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminUsersPage({ searchParams }) {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/usuarios')
  if (!isStaff(profile)) redirect('/cuenta')

  const sp = await searchParams
  const search = sp?.search || ''
  const role = sp?.role || ''
  const page = Math.max(0, Number(sp?.page || 0))
  const pageSize = 50

  const supabase = getSupabaseAdmin()

  let query = supabase
    .from('profiles')
    .select('id, email, full_name, display_name, role, created_at', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(page * pageSize, (page + 1) * pageSize - 1)

  if (search) query = query.or(`email.ilike.%${search}%,full_name.ilike.%${search}%,display_name.ilike.%${search}%`)
  if (role) query = query.eq('role', role)

  const { data: profiles, count } = await query

  // Count courses and memberships per user
  const ids = (profiles || []).map((p) => p.id)
  let enrollCounts = new Map()
  let grantCounts = new Map()

  if (ids.length) {
    const [enrollResult, grantResult] = await Promise.all([
      supabase.from('course_enrollments').select('user_id').eq('access_status', 'active').in('user_id', ids),
      supabase.from('membership_grants').select('user_id').eq('access_status', 'active').in('user_id', ids),
    ])
    for (const e of enrollResult.data || []) enrollCounts.set(e.user_id, (enrollCounts.get(e.user_id) || 0) + 1)
    for (const g of grantResult.data || []) grantCounts.set(g.user_id, (grantCounts.get(g.user_id) || 0) + 1)
  }

  const users = (profiles || []).map((p) => ({
    ...p,
    courseCount: enrollCounts.get(p.id) || 0,
    membershipCount: grantCounts.get(p.id) || 0,
  }))

  const roleLabels = { admin: 'Admin', editorial: 'Editorial', student: 'Alumna' }
  const total = count || 0

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">← Volver al panel</Link>
            </div>
            <h1>Usuarios ({total.toLocaleString('es-AR')})</h1>
          </div>
          <Link href="/admin/ajustes" className="admin-button ghost">Ajustes</Link>
        </header>

        <UsersTable
          initialUsers={users}
          initialTotal={total}
          initialSearch={search}
          initialRole={role}
          initialPage={page}
          pageSize={pageSize}
          roleLabels={roleLabels}
        />
      </div>
    </main>
  )
}
