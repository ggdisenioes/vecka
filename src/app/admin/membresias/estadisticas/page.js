import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import '../../courses/admin-courses.css'

export const dynamic = 'force-dynamic'

function calcMRR(grants) {
  let mrr = 0
  for (const g of grants) {
    const price = Number(g.membership_tiers?.price_ars || 0)
    const period = g.membership_tiers?.billing_period
    if (period === 'monthly') mrr += price
    else if (period === 'annual') mrr += price / 12
  }
  return mrr
}

function StatCard({ label, value, sub, accent }) {
  return (
    <div style={{ background: '#fff', borderRadius: 14, padding: '22px 26px', border: '1px solid oklch(90% 0.012 60)', flex: '1 1 160px', minWidth: 160 }}>
      <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', marginBottom: 6 }}>{label}</div>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 34, fontWeight: 700, color: accent || 'var(--ink)', lineHeight: 1 }}>{value}</div>
      {sub && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{sub}</div>}
    </div>
  )
}

export default async function MembershipStatsPage() {
  const { user, profile } = await getCurrentAuth()
  if (!user) redirect('/login?next=/admin/membresias/estadisticas')
  if (!isStaff(profile)) redirect('/cuenta')

  const supabase = getSupabaseAdmin()
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString()
  const in7 = new Date(now.getTime() + 7 * 86400000).toISOString()

  const [grantsResult, tiersResult, newThisMonthResult, expiringResult, recentResult] = await Promise.all([
    supabase
      .from('membership_grants')
      .select('id, user_id, access_status, granted_at, expires_at, grant_type, membership_tiers(id, name, price_ars, billing_period)')
      .eq('access_status', 'active'),
    supabase
      .from('membership_tiers')
      .select('id, name, price_ars, billing_period, status')
      .order('sort_order', { ascending: true }),
    supabase
      .from('membership_grants')
      .select('id')
      .eq('access_status', 'active')
      .gte('granted_at', startOfMonth),
    supabase
      .from('membership_grants')
      .select('id, expires_at, user_id, membership_tiers(name)')
      .eq('access_status', 'active')
      .not('expires_at', 'is', null)
      .lte('expires_at', in7)
      .gte('expires_at', now.toISOString()),
    supabase
      .from('membership_grants')
      .select('id, user_id, access_status, grant_type, granted_at, cancelled_at, membership_tiers(name)')
      .order('granted_at', { ascending: false })
      .limit(25),
  ])

  const activeGrants = grantsResult.data || []
  const tiers = tiersResult.data || []
  const newThisMonth = newThisMonthResult.data?.length || 0
  const expiringGrants = expiringResult.data || []
  const recentGrants = recentResult.data || []

  const mrr = calcMRR(activeGrants)

  // Per-tier stats
  const tierStats = tiers.map((tier) => {
    const tierGrants = activeGrants.filter((g) => g.membership_tiers?.id === tier.id)
    return {
      ...tier,
      activeCount: tierGrants.length,
      tierMrr: calcMRR(tierGrants),
    }
  }).filter((t) => t.status === 'published' || t.activeCount > 0)

  // Hydrate recent grants user IDs
  const recentUserIds = [...new Set(recentGrants.map((g) => g.user_id))]
  let profilesById = new Map()
  if (recentUserIds.length) {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, display_name')
      .in('id', recentUserIds)
    profilesById = new Map((profiles || []).map((p) => [p.id, p]))
  }

  const statusColor = { active: '#2e7d6a', expired: '#8a5c2e', revoked: '#7b1a1a' }
  const statusLabel = { active: 'Activa', expired: 'Expirada', revoked: 'Revocada' }
  const grantTypeLabel = { manual: 'Manual', payment: 'Pago MP', trial: 'Prueba', admin: 'Admin' }

  return (
    <main className="admin-shell">
      <div className="admin-container">
        <header className="admin-header">
          <div>
            <div className="breadcrumb">
              <Link href="/admin/membresias">← Volver a membresías</Link>
            </div>
            <h1>Estadísticas de membresías</h1>
          </div>
        </header>

        {/* KPI cards */}
        <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', marginBottom: 32 }}>
          <StatCard
            label="Miembros activos"
            value={activeGrants.length}
            sub="con acceso vigente"
            accent="#2e7d6a"
          />
          <StatCard
            label="MRR estimado"
            value={`$${Math.round(mrr).toLocaleString('es-AR')}`}
            sub="ingreso mensual recurrente ARS"
            accent="#1a3a6e"
          />
          <StatCard
            label="Nuevos este mes"
            value={newThisMonth}
            sub={`desde el ${new Date(startOfMonth).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}`}
          />
          <StatCard
            label="Vencen en 7 días"
            value={expiringGrants.length}
            sub="potencial churn"
            accent={expiringGrants.length > 0 ? '#c0392b' : undefined}
          />
        </div>

        {/* Per-tier breakdown */}
        <section style={{ marginBottom: 36 }}>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, marginBottom: 14 }}>Por plan</h2>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', padding: '11px 20px', background: 'oklch(96% 0.012 60)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {['Plan', 'Activos', 'Período', 'MRR'].map((h) => <div key={h}>{h}</div>)}
            </div>
            {tierStats.length === 0 ? (
              <div style={{ padding: '24px 20px', fontFamily: 'DM Sans, sans-serif', color: 'var(--muted)', fontSize: 14 }}>Sin datos.</div>
            ) : tierStats.map((t) => (
              <div key={t.id} style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', padding: '14px 20px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600 }}>
                  <Link href={`/admin/membresias/${t.id}`} style={{ color: 'var(--ink)', textDecoration: 'none' }}>{t.name}</Link>
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700, color: '#2e7d6a' }}>{t.activeCount}</div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)' }}>
                  {t.billing_period === 'monthly' ? 'Mensual' : t.billing_period === 'annual' ? 'Anual' : t.billing_period === 'lifetime' ? 'Vitalicia' : '—'}
                </div>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600 }}>
                  {t.tierMrr > 0 ? `$${Math.round(t.tierMrr).toLocaleString('es-AR')}` : '—'}
                </div>
              </div>
            ))}
            {tierStats.length > 0 && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 100px 100px 120px', padding: '12px 20px', borderTop: '2px solid oklch(88% 0.012 60)', background: 'oklch(97% 0.008 60)' }}>
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: 700 }}>Total</div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, fontWeight: 700 }}>{activeGrants.length}</div>
                <div />
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: '#1a3a6e' }}>
                  ${Math.round(mrr).toLocaleString('es-AR')}/mes
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Expiring soon */}
        {expiringGrants.length > 0 && (
          <section style={{ marginBottom: 36 }}>
            <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, marginBottom: 14, color: '#c0392b' }}>
              ⚠ Vencen en los próximos 7 días ({expiringGrants.length})
            </h2>
            <div style={{ background: '#fff8f8', borderRadius: 14, border: '1px solid #f5c6c6', overflow: 'hidden' }}>
              {expiringGrants.map((g, i) => {
                const daysLeft = Math.ceil((new Date(g.expires_at) - now) / 86400000)
                return (
                  <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: i === 0 ? 'none' : '1px solid #fde8e8', fontFamily: 'DM Sans, sans-serif', fontSize: 14 }}>
                    <span>{g.membership_tiers?.name || 'Plan'}</span>
                    <span style={{ color: daysLeft <= 3 ? '#c0392b' : '#e67e22', fontWeight: 700 }}>
                      {daysLeft === 0 ? 'Hoy' : `${daysLeft}d`} · {new Date(g.expires_at).toLocaleDateString('es-AR')}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Recent activity */}
        <section>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, marginBottom: 14 }}>Actividad reciente</h2>
          <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 90px 110px', padding: '11px 20px', background: 'oklch(96% 0.012 60)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
              {['Alumna', 'Plan', 'Tipo', 'Estado', 'Fecha'].map((h) => <div key={h}>{h}</div>)}
            </div>
            {recentGrants.map((g) => {
              const p = profilesById.get(g.user_id)
              return (
                <div key={g.id} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 100px 90px 110px', padding: '13px 20px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p?.display_name || p?.full_name || p?.email || g.user_id.slice(0, 8) + '…'}
                  </div>
                  <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--muted)' }}>
                    {g.membership_tiers?.name || '—'}
                  </div>
                  <div>
                    <span style={{ fontSize: 11, background: '#eef2ff', color: '#1a3a6e', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
                      {grantTypeLabel[g.grant_type] || g.grant_type}
                    </span>
                  </div>
                  <div>
                    <span style={{ fontSize: 11, background: g.access_status === 'active' ? '#d4f0e6' : '#fde8e8', color: statusColor[g.access_status] || 'var(--ink)', borderRadius: 4, padding: '2px 7px', fontWeight: 600 }}>
                      {statusLabel[g.access_status] || g.access_status}
                    </span>
                  </div>
                  <div style={{ color: 'var(--muted)', fontSize: 12 }}>
                    {new Date(g.granted_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })}
                  </div>
                </div>
              )
            })}
          </div>
        </section>
      </div>
    </main>
  )
}
