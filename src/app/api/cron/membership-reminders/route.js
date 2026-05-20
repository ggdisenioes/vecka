import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendExpiryWarningEmail, sendExpiryExpiredEmail } from '@/lib/email'

// Vercel cron calls this daily at 09:00 AR time (12:00 UTC)
export async function GET(request) {
  const authHeader = request.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date()

  // Expiring in 7 days
  const in7 = new Date(now.getTime() + 7 * 86400000).toISOString()
  // Expired in the last 24 hours
  const yesterday = new Date(now.getTime() - 86400000).toISOString()

  const [warningResult, expiredResult] = await Promise.all([
    supabase
      .from('membership_grants')
      .select('id, user_id, tier_id, expires_at, membership_tiers(slug, name, billing_period)')
      .eq('access_status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', in7)
      .gte('expires_at', now.toISOString()),
    supabase
      .from('membership_grants')
      .select('id, user_id, tier_id, expires_at, membership_tiers(slug, name)')
      .eq('access_status', 'active')
      .not('expires_at', 'is', null)
      .lt('expires_at', now.toISOString())
      .gte('expires_at', yesterday),
  ])

  const warningGrants = warningResult.data || []
  const expiredGrants = expiredResult.data || []

  const allUserIds = [...new Set([
    ...warningGrants.map((g) => g.user_id),
    ...expiredGrants.map((g) => g.user_id),
  ])]

  let profilesById = new Map()
  if (allUserIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, display_name')
      .in('id', allUserIds)
    profilesById = new Map((profiles || []).map((p) => [p.id, p]))
  }

  let sent = 0
  const errors = []

  for (const g of warningGrants) {
    const profile = profilesById.get(g.user_id)
    if (!profile?.email || !g.membership_tiers) continue
    const daysLeft = Math.ceil((new Date(g.expires_at) - now) / 86400000)
    try {
      await sendExpiryWarningEmail({
        to: profile.email,
        name: profile.display_name || profile.full_name || '',
        tierName: g.membership_tiers.name,
        expiresAt: g.expires_at,
        tierSlug: g.membership_tiers.slug,
        daysLeft,
      })
      sent++
    } catch (err) {
      errors.push({ grantId: g.id, error: err.message })
    }
  }

  // Mark expired grants and send expired emails
  const expiredIds = expiredGrants.map((g) => g.id)
  if (expiredIds.length) {
    await supabase
      .from('membership_grants')
      .update({ access_status: 'expired' })
      .in('id', expiredIds)
  }

  for (const g of expiredGrants) {
    const profile = profilesById.get(g.user_id)
    if (!profile?.email || !g.membership_tiers) continue
    try {
      await sendExpiryExpiredEmail({
        to: profile.email,
        name: profile.display_name || profile.full_name || '',
        tierName: g.membership_tiers.name,
        tierSlug: g.membership_tiers.slug,
      })
      sent++
    } catch (err) {
      errors.push({ grantId: g.id, error: err.message })
    }
  }

  return NextResponse.json({
    ok: true,
    warnings: warningGrants.length,
    expired: expiredGrants.length,
    emailsSent: sent,
    errors,
  })
}
