import { notFound } from 'next/navigation'
import LegacyApp from '@/components/legacy/LegacyApp'
import { getLegacyFrontData } from '@/lib/legacy-front'

export const dynamic = 'force-dynamic'

export default async function CoursePage({ params }) {
  const { slug } = params
  const data = await getLegacyFrontData({ courseSlug: slug })

  if (!data.selectedCourseId) {
    notFound()
  }

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="curso"
      initialProducts={data.products}
      initialSelectedCourseId={data.selectedCourseId}
      initialUser={data.user}
    />
  )
}
