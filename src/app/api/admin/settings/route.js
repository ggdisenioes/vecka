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
    if (payload.bankHolderName !== undefined) patch.bank_holder_name = payload.bankHolderName || null
    if (payload.bankCbu !== undefined) patch.bank_cbu = payload.bankCbu || null
    if (payload.bankAlias !== undefined) patch.bank_alias = payload.bankAlias || null
    if (payload.bankContactEmail !== undefined) patch.bank_contact_email = payload.bankContactEmail || null
    if (payload.bankContactWhatsapp !== undefined) patch.bank_contact_whatsapp = payload.bankContactWhatsapp || null
    if (payload.checkoutNote !== undefined) patch.checkout_note = payload.checkoutNote || null

    const { error } = await supabase.from('platform_settings').update(patch).neq('id', '00000000-0000-0000-0000-000000000000')
    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo guardar la configuración')
  }
}
