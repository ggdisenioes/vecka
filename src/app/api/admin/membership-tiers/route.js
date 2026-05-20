import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateMemberships,
  toInteger,
  uniqueTierSlug,
} from '@/lib/admin-api'

const BILLING_PERIODS = ['monthly', 'annual', 'lifetime', 'one_time']

function normalizeFeatures(value) {
  if (Array.isArray(value)) {
    return value.map((item) => String(item || '').trim()).filter(Boolean)
  }
  if (typeof value === 'string') {
    return value
      .split('\n')
      .map((item) => item.trim())
      .filter(Boolean)
  }
  return []
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    const name = requireText(payload.name || 'Nueva membresía', 'Tier name')
    const slug = await uniqueTierSlug(name)
    const billingPeriod = BILLING_PERIODS.includes(payload.billingPeriod)
      ? payload.billingPeriod
      : 'monthly'
    const supabase = getSupabaseAdmin()

    const { data, error } = await supabase
      .from('membership_tiers')
      .insert({
        slug,
        name,
        description: String(payload.description || '').trim() || null,
        sort_order: toInteger(payload.sortOrder, 0),
        status: 'draft',
        price_ars: Math.max(0, Number(payload.priceArs || 0)),
        price_usd: Math.max(0, Number(payload.priceUsd || 0)),
        billing_period: billingPeriod,
        trial_days: Math.max(0, toInteger(payload.trialDays, 0)),
        features: normalizeFeatures(payload.features),
        is_featured: Boolean(payload.isFeatured),
      })
      .select('id, slug, name, status')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ tier: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create tier')
  }
}

export async function GET() {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const supabase = getSupabaseAdmin()
  const { data: tiers, error } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, status, sort_order, updated_at')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  if (error) return jsonError(error.message)

  // Conteo de miembros activos por tier (consulta separada para no
  // depender de joins via PostgREST si la versión no los expone bien).
  const { data: grants, error: grantsError } = await supabase
    .from('membership_grants')
    .select('tier_id, access_status')
    .eq('access_status', 'active')

  if (grantsError) return jsonError(grantsError.message)

  const counts = new Map()
  for (const g of grants || []) {
    counts.set(g.tier_id, (counts.get(g.tier_id) || 0) + 1)
  }

  return NextResponse.json({
    tiers: (tiers || []).map((t) => ({ ...t, active_members: counts.get(t.id) || 0 })),
  })
}
