import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireAdmin,
  requireStaff,
  requireText,
  revalidateCourses,
  toFloat,
  toInteger,
  uniqueCourseSlug,
} from '@/lib/admin-api'

const VISIBILITIES = ['private', 'public', 'catalog']
const STATUSES = ['draft', 'published', 'archived']

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const title = requireText(payload.title, 'Course title')
    const status = STATUSES.includes(payload.status) ? payload.status : 'draft'
    const visibility = VISIBILITIES.includes(payload.visibility) ? payload.visibility : 'private'
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('courses')
      .update({
        slug: await uniqueCourseSlug(title, id),
        title,
        subtitle: String(payload.subtitle || '').trim() || null,
        description: String(payload.description || '').trim() || null,
        category: String(payload.category || '').trim() || null,
        level: String(payload.level || '').trim() || null,
        duration_label: String(payload.duration || '').trim() || null,
        cover_image_url: String(payload.coverImageUrl || '').trim() || null,
        price_ars: toInteger(payload.price),
        price_usd: toFloat(payload.priceUSD),
        is_membership: Boolean(payload.isMembership),
        status,
        visibility,
      })
      .eq('id', id)

    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not update course')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) throw error
    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete course')
  }
}
