import { redirect } from 'next/navigation'
import LegacyApp from '@/components/legacy/LegacyApp'
import { getCurrentAuth } from '@/lib/auth'
import { getLegacyFrontData } from '@/lib/legacy-front'

export const dynamic = 'force-dynamic'

export default async function AccountPage() {
  const { user } = await getCurrentAuth()

  if (!user) {
    redirect('/login?next=/cuenta')
  }

  const data = await getLegacyFrontData()

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="cuenta"
      initialProducts={data.products}
      initialUser={data.user}
    />
  )
}
