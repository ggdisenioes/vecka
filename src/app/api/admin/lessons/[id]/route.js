import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  pickVideoFields,
  requireStaff,
  requireText,
  revalidateCourses,
  toInteger,
  uniqueLessonSlug,
} from '@/lib/admin-api'

const STATUSES = ['draft', 'published', 'archived']

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const title = requireText(payload.title, 'Lesson title')
    const status = STATUSES.includes(payload.status) ? payload.status : 'draft'
    const supabase = getSupabaseAdmin()

    const { data: current, error: lookupError } = await supabase
      .from('course_lessons')
      .select('id, module_id')
      .eq('id', id)
      .maybeSingle()

    if (lookupError) throw lookupError
    if (!current) throw new Error('Lesson not found')

    const slug = await uniqueLessonSlug(current.module_id, title, id)
    const { error } = await supabase
      .from('course_lessons')
      .update({
        slug,
        title,
        summary: String(payload.summary || '').trim() || null,
        body: String(payload.body || '').trim() || null,
        position: toInteger(payload.position, 1),
        status,
        is_preview: Boolean(payload.isPreview),
        ...pickVideoFields(payload),
      })
      .eq('id', id)

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not update lesson')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('course_lessons').delete().eq('id', id)
    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete lesson')
  }
}
