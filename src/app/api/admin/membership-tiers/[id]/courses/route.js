import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateMemberships,
  toInteger,
} from '@/lib/admin-api'

export async function POST(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const courseId = requireText(payload.courseId, 'Course id')
    const sortOrder = toInteger(payload.sortOrder, 0)
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('membership_tier_courses')
      .upsert(
        { tier_id: id, course_id: courseId, sort_order: sortOrder },
        { onConflict: 'tier_id,course_id' },
      )

    if (error) throw error

    // Marcar el curso como is_membership=true por consistencia: un curso que vive
    // dentro de una tier debería estar oculto del catálogo público.
    await supabase.from('courses').update({ is_membership: true }).eq('id', courseId)

    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not link course to tier')
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const url = new URL(request.url)
    const courseId = url.searchParams.get('courseId')
    if (!courseId) return jsonError('courseId is required')

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('membership_tier_courses')
      .delete()
      .eq('tier_id', id)
      .eq('course_id', courseId)

    if (error) throw error

    // Si el curso ya no pertenece a ningún tier, quitar la marca is_membership.
    const { count } = await supabase
      .from('membership_tier_courses')
      .select('*', { count: 'exact', head: true })
      .eq('course_id', courseId)
    if (count === 0) {
      await supabase.from('courses').update({ is_membership: false }).eq('id', courseId)
    }

    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not unlink course')
  }
}
