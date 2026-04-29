import { redirect } from 'next/navigation'
import LegacyApp from '@/components/legacy/LegacyApp'
import { getCurrentAuth } from '@/lib/auth'
import { getLegacyFrontData } from '@/lib/legacy-front'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const { user, profile } = await getCurrentAuth()

  if (!user) {
    redirect('/login?next=/admin')
  }

  if (!profile || !['admin', 'editorial'].includes(profile.role)) {
    redirect('/cuenta')
  }

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
