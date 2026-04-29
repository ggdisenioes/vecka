import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateCourses,
  uniqueCourseSlug,
} from '@/lib/admin-api'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    const title = requireText(payload.title || 'Curso sin título', 'Course title')
    const slug = await uniqueCourseSlug(title)
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('courses')
      .insert({
        slug,
        title,
        status: 'draft',
        visibility: 'private',
      })
      .select('id, slug, title, status, visibility')
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
