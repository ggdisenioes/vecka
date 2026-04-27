import EditorialDashboard from '@/components/admin/EditorialDashboard'
import { requireRoles } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export default async function EditorialAdminPage() {
  await requireRoles(['admin', 'editorial'])

  return <EditorialDashboard />
}
