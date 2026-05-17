import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'

export async function PATCH(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    const supabase = getSupabaseAdmin()

    const patch = { updated_at: new Date().toISOString() }

    // General
    if (payload.brandName !== undefined) patch.brand_name = payload.brandName || null
    if (payload.tagline !== undefined) patch.tagline = payload.tagline || null
    if (payload.contactEmail !== undefined) patch.contact_email = payload.contactEmail || null
    if (payload.contactWhatsapp !== undefined) patch.contact_whatsapp = payload.contactWhatsapp || null
    if (payload.socialInstagram !== undefined) patch.social_instagram = payload.socialInstagram || null
    if (payload.socialWhatsapp !== undefined) patch.social_whatsapp = payload.socialWhatsapp || null

    // Pagos
    if (payload.checkoutBankEnabled !== undefined) patch.checkout_bank_enabled = Boolean(payload.checkoutBankEnabled)
    if (payload.checkoutArsEnabled !== undefined) patch.checkout_ars_enabled = Boolean(payload.checkoutArsEnabled)
    if (payload.checkoutUsdEnabled !== undefined) patch.checkout_usd_enabled = Boolean(payload.checkoutUsdEnabled)
    if (payload.bankHolderName !== undefined) patch.bank_holder_name = payload.bankHolderName || null
    if (payload.bankCbu !== undefined) patch.bank_cbu = payload.bankCbu || null
    if (payload.bankAlias !== undefined) patch.bank_alias = payload.bankAlias || null
    if (payload.bankUsdHolderName !== undefined) patch.bank_usd_holder_name = payload.bankUsdHolderName || null
    if (payload.bankUsdCbu !== undefined) patch.bank_usd_cbu = payload.bankUsdCbu || null
    if (payload.bankUsdAlias !== undefined) patch.bank_usd_alias = payload.bankUsdAlias || null
    if (payload.bankContactEmail !== undefined) patch.bank_contact_email = payload.bankContactEmail || null
    if (payload.bankContactWhatsapp !== undefined) patch.bank_contact_whatsapp = payload.bankContactWhatsapp || null
    if (payload.checkoutNote !== undefined) patch.checkout_note = payload.checkoutNote || null

    // Correo
    if (payload.resendFromName !== undefined) patch.resend_from_name = payload.resendFromName || null
    if (payload.resendFromEmail !== undefined) patch.resend_from_email = payload.resendFromEmail || null
    if (payload.notifyAdminOnSale !== undefined) patch.notify_admin_on_sale = Boolean(payload.notifyAdminOnSale)
    if (payload.notifyAdminEmail !== undefined) patch.notify_admin_email = payload.notifyAdminEmail || null
    if (payload.membershipRemindersEnabled !== undefined) patch.membership_reminders_enabled = Boolean(payload.membershipRemindersEnabled)

    // Videos
    if (payload.videoProvider !== undefined) patch.video_provider = payload.videoProvider || 'youtube'

    // Acceso
    if (payload.courseAccessModel !== undefined) patch.course_access_model = payload.courseAccessModel || 'enrollment'

    const { error } = await supabase.from('platform_settings').update(patch).neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo guardar la configuración')
  }
}
