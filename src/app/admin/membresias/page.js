import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import NewTierButton from './NewTierButton'
import '../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

export default async function AdminMembershipsListPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()
  const { data: tiers, error } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, description, status, sort_order, updated_at')
    .order('sort_order', { ascending: true })
    .order('updated_at', { ascending: false })

  const { data: grants } = await supabase
    .from('membership_grants')
    .select('tier_id')
    .eq('access_status', 'active')

  const counts = new Map()
  for (const g of grants || []) {
    counts.set(g.tier_id, (counts.get(g.tier_id) || 0) + 1)
  }

  if (error) {
    return (
      <main className="admin-shell">
        <div className="admin-container">
          <h1>Membresías</h1>
          <p style={{ color: '#b85c5c' }}>Error al cargar: {error.message}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin">← Volver al panel</Link>
            </div>
            <h1>Membresías</h1>
          </div>
          <NewTierButton />
        </header>

        {(!tiers || tiers.length === 0) ? (
          <div className="empty-state">
            Todavía no hay niveles de membresía. Hacé clic en <strong>Nueva membresía</strong> para crear el primero.
          </div>
        ) : (
          <div className="admin-grid">
            {tiers.map((tier) => (
              <Link
                key={tier.id}
                href={`/admin/membresias/${tier.id}`}
                className="course-card"
              >
                <div className="title">{tier.name}</div>
                <div className="meta">
                  <span className={`status-pill ${tier.status}`}>{tier.status}</span>
                  <span className="status-pill catalog">
                    {counts.get(tier.id) || 0} {counts.get(tier.id) === 1 ? 'miembro' : 'miembros'}
                  </span>
                </div>
                {tier.description ? (
                  <div className="meta" style={{ color: 'var(--muted)' }}>
                    {tier.description.slice(0, 120)}{tier.description.length > 120 ? '…' : ''}
                  </div>
                ) : null}
                <div className="meta">
                  Actualizado {tier.updated_at ? new Date(tier.updated_at).toLocaleDateString('es-AR') : '—'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
