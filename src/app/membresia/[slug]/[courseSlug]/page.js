import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MembershipCourseRedirect({ params }) {
  const { slug } = await params
  // El listado de clases del curso ya se muestra en /membresia/[slug]; la URL
  // /membresia/[slug]/[courseSlug] redirige al nivel para evitar duplicar la
  // navegación. Las clases individuales viven en /membresia/[slug]/[courseSlug]/[lessonSlug].
  redirect(`/membresia/${slug}`)
}
