import { requireRoles } from '@/lib/auth'
import LegacyApp from '@/components/legacy/LegacyApp'
import { getLegacyFrontData } from '@/lib/legacy-front'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  await requireRoles(['admin', 'editorial'])
  const data = await getLegacyFrontData()

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="admin"
      initialProducts={data.products}
      initialUser={data.user}
    />
  )
}
