import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { sendWelcomeEmail } from '@/lib/email'
import { revalidateMemberships } from '@/lib/admin-api'

export async function POST(request) {
  const { user } = await getCurrentAuth()
  if (!user) {
    return NextResponse.json({ error: 'Debés iniciar sesión para continuar.' }, { status: 401 })
  }

  const payload = await request.json().catch(() => ({}))
  if (!payload.tierId) {
    return NextResponse.json({ error: 'tierId es requerido' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()

  const { data: tier } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, price_ars, billing_period, trial_days, status')
    .eq('id', payload.tierId)
    .eq('status', 'published')
    .maybeSingle()

  if (!tier) return NextResponse.json({ error: 'Membresía no encontrada.' }, { status: 404 })
  if (!tier.trial_days || tier.trial_days <= 0) return NextResponse.json({ error: 'Esta membresía no tiene período de prueba.' }, { status: 400 })

  // Check if user already used a trial for this tier
  const { data: existing } = await supabase
    .from('membership_grants')
    .select('id, grant_type')
    .eq('tier_id', tier.id)
    .eq('user_id', user.id)
    .maybeSingle()

  if (existing) {
    return NextResponse.json({ error: 'Ya tuviste acceso a esta membresía anteriormente.' }, { status: 400 })
  }

  const now = new Date()
  const trialEnd = new Date(now.getTime() + tier.trial_days * 86400000).toISOString()

  const { data: grant, error } = await supabase
    .from('membership_grants')
    .insert({
      tier_id: tier.id,
      user_id: user.id,
      access_status: 'active',
      grant_type: 'trial',
      granted_at: now.toISOString(),
      starts_at: now.toISOString(),
      expires_at: trialEnd,
      trial_ends_at: trialEnd,
      notes: `Prueba gratuita · ${tier.trial_days} días`,
    })
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  revalidateMemberships()

  // Send welcome email (non-blocking)
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('email, full_name, display_name')
      .eq('id', user.id)
      .maybeSingle()

    if (profile?.email) {
      sendWelcomeEmail({
        to: profile.email,
        name: profile.display_name || profile.full_name || '',
        tierName: tier.name,
        billingPeriod: tier.billing_period,
        expiresAt: trialEnd,
        tierSlug: tier.slug,
      }).catch(() => {})
    }
  } catch {
    // Welcome email is best-effort.
  }

  return NextResponse.json({ grant, trialDays: tier.trial_days })
}
