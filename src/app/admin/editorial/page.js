import { redirect } from 'next/navigation'
import EditorialDashboard from '@/components/admin/EditorialDashboard'
import { getCurrentAuth } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function EditorialAdminPage() {
  const { user, profile } = await getCurrentAuth()

  if (!user) {
    redirect('/login?next=/admin/editorial')
  }

  if (!profile || !['admin', 'editorial'].includes(profile.role)) {
    redirect('/cuenta')
  }

  return <EditorialDashboard />
}
