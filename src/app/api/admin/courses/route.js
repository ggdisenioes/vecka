import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateCourses,
  uniqueCourseSlug,
} from '@/lib/admin-api'

const COURSE_STATUSES = ['draft', 'published', 'archived']
const COURSE_VISIBILITIES = ['private', 'catalog', 'public']

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    const title = requireText(payload.title || 'Curso sin título', 'Course title')
    const slug = await uniqueCourseSlug(title)
    const supabase = getSupabaseAdmin()

    const subtitle = String(payload.subtitle || '').trim() || null
    const status = COURSE_STATUSES.includes(payload.status) ? payload.status : 'draft'
    const visibility = COURSE_VISIBILITIES.includes(payload.visibility) ? payload.visibility : 'private'

    const { data, error } = await supabase
      .from('courses')
      .insert({
        slug,
        title,
        subtitle,
        status,
        visibility,
        is_membership: Boolean(payload.isMembership),
      })
      .select('id, slug, title, subtitle, status, visibility, is_membership')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ course: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create course')
  }
}

export async function GET() {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('courses')
    .select('id, slug, title, status, visibility, updated_at, is_membership')
    .order('updated_at', { ascending: false })

  if (error) return jsonError(error.message)
  return NextResponse.json({ courses: data || [] })
}
