import LegacyApp from '@/components/legacy/LegacyApp'
import { getLegacyFrontData } from '@/lib/legacy-front'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Talleres — VeCKA',
  description: 'Talleres online de costura y moldería de VeCKA.',
}

export default async function CoursesPage() {
  const data = await getLegacyFrontData()

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="escuela"
      initialProducts={data.products}
      initialUser={data.user}
    />
  )
}
