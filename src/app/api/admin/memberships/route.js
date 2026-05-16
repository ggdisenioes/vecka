import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, revalidateMemberships } from '@/lib/admin-api'
import { sendWelcomeEmail } from '@/lib/email'

const GRANT_STATUSES = ['active', 'expired', 'revoked']

function parseExpiry(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

async function findUserIdByEmail(supabase, email) {
  const normalized = String(email || '').trim().toLowerCase()
  if (!normalized) return null
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .ilike('email', normalized)
    .maybeSingle()
  if (profile?.id) return profile.id
  try {
    const { data } = await supabase.auth.admin.listUsers({ perPage: 500 })
    const match = (data?.users || []).find((u) => (u.email || '').toLowerCase() === normalized)
    return match?.id || null
  } catch {
    return null
  }
}

export async function GET(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const supabase = getSupabaseAdmin()
  const url = new URL(request.url)
  const tierId = url.searchParams.get('tierId')
  const status = url.searchParams.get('status')

  let query = supabase
    .from('membership_grants')
    .select('id, tier_id, user_id, access_status, granted_at, expires_at, starts_at, cancelled_at, notes, granted_by, payment_reference, membership_tiers(id, name, billing_period, price_ars)')
    .order('granted_at', { ascending: false })

  if (tierId) query = query.eq('tier_id', tierId)
  if (status) query = query.eq('access_status', status)

  const { data: grants, error } = await query
  if (error) return jsonError(error.message)

  const userIds = [...new Set((grants || []).map((g) => g.user_id))]
  let profilesById = new Map()
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, role')
      .in('id', userIds)
    profilesById = new Map((profiles || []).map((p) => [p.id, p]))
  }

  return NextResponse.json({
    grants: (grants || []).map((g) => ({
      ...g,
      tier: g.membership_tiers || null,
      profile: profilesById.get(g.user_id) || null,
    })),
  })
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    if (!payload.tierId) return jsonError('tierId es requerido')
    if (!payload.email) return jsonError('email es requerido')

    const supabase = getSupabaseAdmin()
    const userId = await findUserIdByEmail(supabase, payload.email)
    if (!userId) {
      return jsonError('No se encontró un usuario con ese email. La alumna debe registrarse primero.', 404)
    }

    const status = GRANT_STATUSES.includes(payload.accessStatus) ? payload.accessStatus : 'active'
    const { user: actor } = await getCurrentAuth()

    const { data, error } = await supabase
      .from('membership_grants')
      .upsert({
        tier_id: payload.tierId,
        user_id: userId,
        access_status: status,
        grant_type: 'manual',
        expires_at: parseExpiry(payload.expiresAt),
        starts_at: parseExpiry(payload.startsAt) || new Date().toISOString(),
        granted_at: new Date().toISOString(),
        granted_by: actor?.id || null,
        notes: String(payload.notes || '').trim() || null,
      }, { onConflict: 'tier_id,user_id' })
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()

    // Send welcome email (non-blocking)
    try {
      const { data: tierData } = await supabase
        .from('membership_tiers')
        .select('name, slug, billing_period')
        .eq('id', payload.tierId)
        .maybeSingle()
      const { data: profile } = await supabase
        .from('profiles')
        .select('email, full_name, display_name')
        .eq('id', userId)
        .maybeSingle()
      if (profile?.email && tierData && status === 'active') {
        sendWelcomeEmail({
          to: profile.email,
          name: profile.display_name || profile.full_name || '',
          tierName: tierData.name,
          billingPeriod: tierData.billing_period,
          expiresAt: data.expires_at,
          tierSlug: tierData.slug,
        }).catch(() => {})
      }
    } catch {}

    return NextResponse.json({ grant: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create membership')
  }
}
