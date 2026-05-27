import { redirect } from 'next/navigation'
import AdminShell from '@/components/site/AdminShell'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import './courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminLayout({ children }) {
  const { user, profile } = await getCurrentAuth()

  if (!user) {
    redirect('/login?next=/admin')
  }

  if (!isStaff(profile)) {
    redirect('/cuenta')
  }

  return (
    <AdminShell user={user} profile={profile}>
      {children}
    </AdminShell>
  )
}
