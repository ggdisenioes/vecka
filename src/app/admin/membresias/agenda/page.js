import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import AgendaPanel from '../[id]/AgendaPanel'
import '../../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminAgendaPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias/agenda')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()

  const { data: events } = await supabase
    .from('membership_agenda_events')
    .select('*')
    .is('tier_id', null)
    .order('starts_at', { ascending: true })

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
          <AgendaPanel initialEvents={events || []} />
        </section>
      </div>
    </main>
  )
}
