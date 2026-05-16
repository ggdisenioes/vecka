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
    .select('id, slug, name, description, status, sort_order, updated_at, price_ars, price_usd, billing_period, is_featured')
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
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <Link href="/admin/membresias/estadisticas" className="admin-button ghost">
              Estadísticas
            </Link>
            <Link href="/admin/membresias/cupones" className="admin-button ghost">
              Cupones
            </Link>
            <Link href="/admin/membresias/miembros" className="admin-button ghost">
              Ver todos los miembros
            </Link>
            <NewTierButton />
          </div>
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
                <div className="title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  {tier.name}
                  {tier.is_featured && <span style={{ fontSize: 11, background: '#cce5ff', color: '#004085', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Destacada</span>}
                </div>
                {tier.price_ars > 0 && (
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--accent-deep)', margin: '4px 0' }}>
                    ${tier.price_ars.toLocaleString('es-AR')} ARS
                    <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
                      / {tier.billing_period === 'monthly' ? 'mes' : tier.billing_period === 'annual' ? 'año' : tier.billing_period === 'lifetime' ? 'vitalicia' : 'único'}
                    </span>
                  </div>
                )}
                <div className="meta">
                  <span className={`status-pill ${tier.status}`}>
                    {tier.status === 'published' ? 'Publicada' : tier.status === 'archived' ? 'Archivada' : 'Borrador'}
                  </span>
                  <span className="status-pill catalog">
                    {counts.get(tier.id) || 0} {counts.get(tier.id) === 1 ? 'miembro activo' : 'miembros activos'}
                  </span>
                </div>
                {tier.description && (
                  <div className="meta" style={{ color: 'var(--muted)' }}>
                    {tier.description.slice(0, 100)}{tier.description.length > 100 ? '…' : ''}
                  </div>
                )}
                <div className="card-footer">
                  Actualizado {tier.updated_at ? new Date(tier.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  )
}
