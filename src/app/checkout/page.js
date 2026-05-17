import LegacyApp from '@/components/legacy/LegacyApp'
import { getLegacyFrontData } from '@/lib/legacy-front'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const [data, settingsResult] = await Promise.all([
    getLegacyFrontData(),
    getSupabaseAdmin()
      .from('platform_settings')
      .select('bank_holder_name, bank_cbu, bank_alias, bank_usd_holder_name, bank_usd_cbu, bank_usd_alias, bank_contact_email, bank_contact_whatsapp, checkout_note, checkout_ars_enabled, checkout_usd_enabled')
      .maybeSingle(),
  ])

  const s = settingsResult.data || {}

  const bankInfo = {
    holderName: s.bank_holder_name || null,
    cbu: s.bank_cbu || null,
    alias: s.bank_alias || null,
    contactEmail: s.bank_contact_email || null,
    contactWhatsapp: s.bank_contact_whatsapp || null,
    checkoutNote: s.checkout_note || null,
  }

  const bankInfoUsd = {
    holderName: s.bank_usd_holder_name || null,
    cbu: s.bank_usd_cbu || null,
    alias: s.bank_usd_alias || null,
    contactEmail: s.bank_contact_email || null,
    contactWhatsapp: s.bank_contact_whatsapp || null,
    checkoutNote: s.checkout_note || null,
  }

  const acceptedCurrencies = [
    ...(s.checkout_ars_enabled !== false ? ['ARS'] : []),
    ...(s.checkout_usd_enabled ? ['USD'] : []),
  ]
  if (acceptedCurrencies.length === 0) acceptedCurrencies.push('ARS')

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="checkout"
      initialProducts={data.products}
      initialUser={data.user}
      bankInfo={bankInfo}
      bankInfoUsd={bankInfoUsd}
      acceptedCurrencies={acceptedCurrencies}
    />
  )
}
