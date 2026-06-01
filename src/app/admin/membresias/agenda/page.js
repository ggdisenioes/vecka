import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import AgendaPanel from '../[id]/AgendaPanel'
import AgendaVisibility from './AgendaVisibility'
import '../../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminAgendaPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias/agenda')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()

  const [{ data: events }, { data: settings }] = await Promise.all([
    supabase
      .from('membership_agenda_events')
      .select('*')
      .is('tier_id', null)
      .order('starts_at', { ascending: true }),
    supabase
      .from('platform_settings')
      .select('club_agenda_visible, club_next_live_visible')
      .maybeSingle(),
  ])

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin/membresias">← Volver a membresías</Link>
            </div>
            <h1>Agenda del Club</h1>
            <p style={{ color: '#596567', marginTop: 6, maxWidth: 620 }}>
              Cargá las próximas clases en vivo y publicaciones de contenido del Club.
              Las socias con membresía activa las ven en la página del Club: la agenda
              del mes, los próximos acontecimientos y la próxima clase en vivo.
            </p>
          </div>
        </header>

        <section className="admin-card editor-section">
          <AgendaVisibility
            initialAgendaVisible={settings?.club_agenda_visible ?? true}
            initialNextLiveVisible={settings?.club_next_live_visible ?? true}
          />
          <AgendaPanel initialEvents={events || []} />
        </section>
      </div>
    </main>
  )
}
