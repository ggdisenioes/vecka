import LegacyApp from '@/components/legacy/LegacyApp'
import { getLegacyFrontData } from '@/lib/legacy-front'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function CheckoutPage() {
  const [data, settingsResult] = await Promise.all([
    getLegacyFrontData(),
    getSupabaseAdmin()
      .from('platform_settings')
      .select('bank_holder_name, bank_cbu, bank_alias, bank_contact_email, bank_contact_whatsapp, checkout_note')
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

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="checkout"
      initialProducts={data.products}
      initialUser={data.user}
      bankInfo={bankInfo}
    />
  )
}
