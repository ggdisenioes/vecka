import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateMemberships,
} from '@/lib/admin-api'

const EVENT_TYPES = ['live_class', 'content_release', 'other']
const STATUSES = ['scheduled', 'cancelled']

function textValue(value) {
  return String(value || '').trim() || null
}

function normalizeType(value) {
  return EVENT_TYPES.includes(value) ? value : 'live_class'
}

function normalizeStatus(value) {
  return STATUSES.includes(value) ? value : 'scheduled'
}

function toIso(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export async function GET(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const url = new URL(request.url)
  const tierId = url.searchParams.get('tierId')

  const supabase = getSupabaseAdmin()
  let query = supabase
    .from('membership_agenda_events')
    .select('*')
    .order('starts_at', { ascending: true })

  // Sin tierId → agenda global del Club (tier_id null).
  if (tierId) {
    query = query.eq('tier_id', tierId)
  } else {
    query = query.is('tier_id', null)
  }

  const { data, error } = await query
  if (error) return jsonError(error.message)
  return NextResponse.json({ events: data || [] })
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    // tierId es opcional: si no viene, el evento es global del Club.
    const tierId = textValue(payload.tierId)
    const title = requireText(payload.title, 'Título')
    const startsAt = toIso(payload.startsAt)
    if (!startsAt) throw new Error('La fecha y hora de inicio es obligatoria.')

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('membership_agenda_events')
      .insert({
        tier_id: tierId,
        title,
        description: textValue(payload.description),
        event_type: normalizeType(payload.eventType),
        starts_at: startsAt,
        ends_at: toIso(payload.endsAt),
        location_url: textValue(payload.locationUrl),
        status: normalizeStatus(payload.status),
      })
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ event: data })
  } catch (error) {
    return jsonError(error.message || 'No se pudo crear el evento')
  }
}
