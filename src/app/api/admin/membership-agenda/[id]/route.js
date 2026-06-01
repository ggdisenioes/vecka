import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, revalidateMemberships } from '@/lib/admin-api'

const EVENT_TYPES = ['live_class', 'content_release', 'other']
const STATUSES = ['scheduled', 'cancelled']

function textValue(value) {
  return String(value || '').trim() || null
}

function toIso(value) {
  if (!value) return null
  const parsed = new Date(value)
  return Number.isNaN(parsed.getTime()) ? null : parsed.toISOString()
}

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const patch = {}

    if (payload.title !== undefined) {
      const title = textValue(payload.title)
      if (!title) throw new Error('El título no puede quedar vacío.')
      patch.title = title
    }
    if (payload.description !== undefined) patch.description = textValue(payload.description)
    if (payload.eventType !== undefined) {
      patch.event_type = EVENT_TYPES.includes(payload.eventType) ? payload.eventType : 'live_class'
    }
    if (payload.status !== undefined) {
      patch.status = STATUSES.includes(payload.status) ? payload.status : 'scheduled'
    }
    if (payload.startsAt !== undefined) {
      const startsAt = toIso(payload.startsAt)
      if (!startsAt) throw new Error('Fecha de inicio inválida.')
      patch.starts_at = startsAt
    }
    if (payload.endsAt !== undefined) patch.ends_at = toIso(payload.endsAt)
    if (payload.locationUrl !== undefined) patch.location_url = textValue(payload.locationUrl)

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('membership_agenda_events')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ event: data })
  } catch (error) {
    return jsonError(error.message || 'No se pudo actualizar el evento')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()
    const { error } = await supabase
      .from('membership_agenda_events')
      .delete()
      .eq('id', id)

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'No se pudo eliminar el evento')
  }
}
