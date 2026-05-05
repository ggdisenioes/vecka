import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireAdmin,
  requireStaff,
  requireText,
  revalidateMemberships,
  toInteger,
  uniqueTierSlug,
} from '@/lib/admin-api'

const STATUSES = ['draft', 'published', 'archived']

export async function GET(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: tier, error } = await supabase
    .from('membership_tiers')
    .select('*')
    .eq('id', id)
    .maybeSingle()

  if (error) return jsonError(error.message)
  if (!tier) return jsonError('Tier not found', 404)

  const { data: tierCourses, error: tcErr } = await supabase
    .from('membership_tier_courses')
    .select('course_id, sort_order, courses(id, slug, title, status, visibility)')
    .eq('tier_id', id)
    .order('sort_order', { ascending: true })

  if (tcErr) return jsonError(tcErr.message)

  const { data: grants, error: grantsErr } = await supabase
    .from('membership_grants')
    .select('id, user_id, access_status, granted_at, expires_at, notes')
    .eq('tier_id', id)
    .order('granted_at', { ascending: false })

  if (grantsErr) return jsonError(grantsErr.message)

  // Hidratar perfiles de los miembros para mostrar email/nombre.
  const userIds = (grants || []).map((g) => g.user_id)
  let profilesById = new Map()
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('id', userIds)
    profilesById = new Map((profiles || []).map((p) => [p.id, p]))
  }

  return NextResponse.json({
    tier,
    courses: (tierCourses || []).map((row) => ({
      sort_order: row.sort_order,
      ...(row.courses || { id: row.course_id }),
    })),
    grants: (grants || []).map((g) => ({
      ...g,
      profile: profilesById.get(g.user_id) || null,
    })),
  })
}

export async function PUT(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json()
    const name = requireText(payload.name, 'Tier name')
    const status = STATUSES.includes(payload.status) ? payload.status : 'draft'
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('membership_tiers')
      .update({
        slug: await uniqueTierSlug(name, id),
        name,
        description: String(payload.description || '').trim() || null,
        cover_image_url: String(payload.coverImageUrl || '').trim() || null,
        sort_order: toInteger(payload.sortOrder, 0),
        status,
      })
      .eq('id', id)

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not update tier')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireAdmin()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('membership_tiers').delete().eq('id', id)
    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete tier')
  }
}
