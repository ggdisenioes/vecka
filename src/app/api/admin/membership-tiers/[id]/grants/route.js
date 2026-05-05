import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateMemberships,
} from '@/lib/admin-api'

const GRANT_STATUSES = ['active', 'expired', 'revoked']

function parseExpiry(value) {
  if (!value) return null
  const parsed = new Date(value)
  if (Number.isNaN(parsed.getTime())) return null
  return parsed.toISOString()
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

  // Fallback: buscar en auth.users via admin API si el profile no estuviera creado todavía.
  try {
    const { data, error } = await supabase.auth.admin.listUsers({ perPage: 200 })
    if (error) return null
    const match = (data?.users || []).find(
      (u) => (u.email || '').toLowerCase() === normalized,
    )
    return match?.id || null
  } catch {
    return null
  }
}

export async function GET(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const { id } = await params
  const supabase = getSupabaseAdmin()

  const { data: grants, error } = await supabase
    .from('membership_grants')
    .select('id, user_id, access_status, granted_at, expires_at, notes, granted_by')
    .eq('tier_id', id)
    .order('granted_at', { ascending: false })

  if (error) return jsonError(error.message)

  const userIds = (grants || []).map((g) => g.user_id)
  let profilesById = new Map()
  if (userIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds)
    profilesById = new Map((profiles || []).map((p) => [p.id, p]))
  }

  return NextResponse.json({
    grants: (grants || []).map((g) => ({ ...g, profile: profilesById.get(g.user_id) || null })),
  })
}

export async function POST(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    let userId = String(payload.userId || '').trim()
    if (!userId && payload.email) {
      userId = await findUserIdByEmail(supabase, payload.email)
    }
    if (!userId) {
      return jsonError(
        'No se encontró un usuario con ese email. Pedile que se registre primero.',
        404,
      )
    }

    const expires = parseExpiry(payload.expiresAt)
    const status = GRANT_STATUSES.includes(payload.accessStatus)
      ? payload.accessStatus
      : 'active'
    const notes = String(payload.notes || '').trim() || null
    const { user: actor } = await getCurrentAuth()

    const { data, error } = await supabase
      .from('membership_grants')
      .upsert(
        {
          tier_id: id,
          user_id: userId,
          access_status: status,
          expires_at: expires,
          granted_at: new Date().toISOString(),
          granted_by: actor?.id || null,
          notes,
        },
        { onConflict: 'tier_id,user_id' },
      )
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ grant: data })
  } catch (error) {
    return jsonError(error.message || 'Could not grant membership')
  }
}

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const userId = requireText(payload.userId, 'User id')
    const status = GRANT_STATUSES.includes(payload.accessStatus)
      ? payload.accessStatus
      : 'active'
    const expires = parseExpiry(payload.expiresAt)
    const supabase = getSupabaseAdmin()

    const { error } = await supabase
      .from('membership_grants')
      .update({ access_status: status, expires_at: expires })
      .eq('tier_id', id)
      .eq('user_id', userId)

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not update grant')
  }
}

export async function DELETE(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const url = new URL(request.url)
    const userId = url.searchParams.get('userId')
    if (!userId) return jsonError('userId is required')

    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('membership_grants')
      .delete()
      .eq('tier_id', id)
      .eq('user_id', userId)

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not revoke membership')
  }
}
