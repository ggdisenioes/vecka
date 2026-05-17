import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import SettingsForm from './SettingsForm'
import '../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminSettingsPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/ajustes')
  if (!isStaff(profile)) redirect('/cuenta')

  const { data: settings } = await getSupabaseAdmin()
    .from('platform_settings')
    .select('*')
    .maybeSingle()

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">← Volver al panel</Link>
            </div>
            <h1>Ajustes del sitio</h1>
          </div>
        </header>

        <SettingsForm initialSettings={settings || {}} />
      </div>
    </main>
  )
}
