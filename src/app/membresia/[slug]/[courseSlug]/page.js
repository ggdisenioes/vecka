import { redirect } from 'next/navigation'

export const dynamic = 'force-dynamic'

export default async function MembershipCourseRedirect({ params }) {
  const { slug } = await params
  // El listado de clases del curso ya se muestra en /membresias/[slug]; la URL
  // /membresias/[slug]/[courseSlug] redirige al nivel para evitar duplicar la
  // navegación. Las clases individuales viven en /membresia/[slug]/[courseSlug]/[lessonSlug].
  redirect(`/membresias/${slug}`)
}
