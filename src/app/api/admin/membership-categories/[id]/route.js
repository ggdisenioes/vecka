import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateMemberships,
  toInteger,
  uniqueMembershipContentCategorySlug,
} from '@/lib/admin-api'

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    const { data: current, error: currentError } = await supabase
      .from('membership_content_categories')
      .select('id, tier_id')
      .eq('id', id)
      .maybeSingle()

    if (currentError) throw currentError
    if (!current) return jsonError('Categoría no encontrada', 404)

    const patch = {}

    if (payload.name !== undefined) {
      const name = requireText(payload.name, 'Name')
      patch.name = name
      patch.slug = await uniqueMembershipContentCategorySlug(current.tier_id, name, id)
    }
    if (payload.sortOrder !== undefined) {
      patch.sort_order = toInteger(payload.sortOrder, 0)
    }

    const { data, error } = await supabase
      .from('membership_content_categories')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ category: data })
  } catch (error) {
    return jsonError(error.message || 'Could not update membership category')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('membership_content_categories')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete membership category')
  }
}
