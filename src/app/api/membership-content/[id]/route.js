import { NextResponse } from 'next/server'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

function hasValidGrant(grant) {
  return (
    grant?.access_status === 'active' &&
    (!grant.expires_at || new Date(grant.expires_at) > new Date())
  )
}

export async function GET(_request, { params }) {
  const { user, profile } = await getCurrentAuth()
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: item, error } = await supabase
    .from('membership_content_items')
    .select('id, tier_id, status, bucket_name, storage_path')
    .eq('id', id)
    .maybeSingle()

  if (error || !item?.bucket_name || !item?.storage_path) {
    return NextResponse.json({ error: 'Content not found' }, { status: 404 })
  }

  if (!isStaff(profile)) {
    if (item.status !== 'published') {
      return NextResponse.json({ error: 'Content not found' }, { status: 404 })
    }

    const { data: grant } = await supabase
      .from('membership_grants')
      .select('access_status, expires_at')
      .eq('tier_id', item.tier_id)
      .eq('user_id', user.id)
      .maybeSingle()

    if (!hasValidGrant(grant)) {
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
