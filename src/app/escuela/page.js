import LegacyApp from '@/components/legacy/LegacyApp'
import { getLegacyFrontData } from '@/lib/legacy-front'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function EscuelaPage() {
  const data = await getLegacyFrontData()

  const supabase = getSupabaseAdmin()
  const { data: memberships } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, cover_image_url, sort_order')
    .eq('status', 'published')
    .order('sort_order', { ascending: true })

  return (
    <LegacyApp
      initialCourses={data.courses}
      initialPage="escuela"
      initialProducts={data.products}
      initialUser={data.user}
      initialMemberships={memberships || []}
    />
  )
}
