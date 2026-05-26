import { NextResponse } from 'next/server'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { canAccessMembershipContentItem, getClubAccessFromGrants } from '@/lib/memberships'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function GET(_request, { params }) {
  const { user, profile } = await getCurrentAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: item, error } = await supabase
    .from('membership_content_items')
    .select('id, tier_id, status, bucket_name, storage_path, legacy_wp_id, created_at')
    .eq('id', id)
    .maybeSingle()

  if (error || !item?.bucket_name || !item?.storage_path) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (!isStaff(profile)) {
    if (item.status !== 'published') {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const { data: grants } = await supabase
      .from('membership_grants')
      .select('tier_id, access_status, granted_at, starts_at, expires_at, membership_tiers(slug, billing_period, price_ars, features, description)')
      .eq('user_id', user.id)

    const access = getClubAccessFromGrants(grants || [])
    if (!canAccessMembershipContentItem(item, access)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }

  const { data: signed, error: signedError } = await supabase.storage
    .from(item.bucket_name)
    .createSignedUrl(item.storage_path, 60)

  if (signedError || !signed?.signedUrl) {
    return NextResponse.json({ error: 'Could not sign content URL' }, { status: 500 })
  }

  return NextResponse.redirect(signed.signedUrl)
}
