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

export async function GET(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const url = new URL(request.url)
  const tierId = url.searchParams.get('tierId')
  if (!tierId) return jsonError('tierId is required')

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('membership_content_categories')
    .select('*')
    .eq('tier_id', tierId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return jsonError(error.message)
  return NextResponse.json({ categories: data || [] })
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    const tierId = requireText(payload.tierId, 'Tier id')
    const name = requireText(payload.name, 'Name')
    const slug = await uniqueMembershipContentCategorySlug(tierId, name)

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('membership_content_categories')
      .insert({
        tier_id: tierId,
        name,
        slug,
        sort_order: toInteger(payload.sortOrder, 0),
      })
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ category: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create membership category')
  }
}
