import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  pickLessonTypeFields,
  pickVideoFields,
  requireStaff,
  requireText,
  revalidateCourses,
  toInteger,
  uniqueTopicSlug,
} from '@/lib/admin-api'

const STATUSES = ['draft', 'published', 'archived']

export async function GET(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: topic, error } = await supabase
      .from('course_topics')
      .select('*, materials:course_materials!course_materials_topic_id_fkey(*)')
      .eq('id', id)
      .maybeSingle()

    if (error) throw error
    if (!topic) return jsonError('Topic not found', 404)
    return NextResponse.json({ topic })
  } catch (error) {
    return jsonError(error.message || 'Could not load topic')
  }
}

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const title = requireText(payload.title, 'Topic title')
    const status = STATUSES.includes(payload.status) ? payload.status : 'draft'
    const supabase = getSupabaseAdmin()

    const { data: current, error: lookupError } = await supabase
      .from('course_topics')
      .select('id, lesson_id')
      .eq('id', id)
      .maybeSingle()

    if (lookupError) throw lookupError
    if (!current) throw new Error('Topic not found')

    const slug = await uniqueTopicSlug(current.lesson_id, title, id)

    const { data, error } = await supabase
      .from('course_topics')
      .update({
        slug,
        title,
        summary: String(payload.summary || '').trim() || null,
        body: String(payload.body || '').trim() || null,
        status,
        is_preview: Boolean(payload.isPreview),
        ...pickVideoFields(payload),
        ...pickLessonTypeFields(payload),
      })
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ topic: data })
  } catch (error) {
    return jsonError(error.message || 'Could not update topic')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('course_topics').delete().eq('id', id)
    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete topic')
  }
}
