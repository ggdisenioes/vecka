import Link from 'next/link'
import PublicSiteShell from '@/components/site/PublicSiteShell'
import { ButtonLink, Card, EmptyState, PageHeader } from '@/components/ui/VeckaUI'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import '../membresia/membership.css'

export const dynamic = 'force-dynamic'

export const metadata = {
  title: 'Escuela VeCKA',
  description: 'Cursos, talleres y membresías de la escuela VeCKA.',
}

export default async function EscuelaPage() {
  const { user, profile } = await getCurrentAuth()
  const supabase = getSupabaseAdmin()
  const [coursesResult, membershipsResult] = await Promise.all([
    supabase
      .from('courses')
      .select('id, slug, title, subtitle, category, cover_image_url, updated_at')
      .eq('status', 'published')
      .order('updated_at', { ascending: false })
      .limit(6),
    supabase
      .from('membership_tiers')
      .select('id, slug, name, description, sort_order')
      .eq('status', 'published')
      .order('sort_order', { ascending: true })
      .limit(3),
  ])

  const courses = coursesResult.data || []
  const memberships = membershipsResult.data || []

  return (
    <PublicSiteShell user={user} userRole={profile?.role || null} loginHref="/login?next=/escuela">
      <main className="vk-page">
        <div className="vk-container">
          <PageHeader
            kicker="Escuela"
            title="Aprendé costura en VeCKA"
            lede="Talleres, membresías y recursos organizados en una experiencia más clara para alumnas nuevas y actuales."
            actions={(
              <>
                <ButtonLink href="/membresias">Club VeCKA</ButtonLink>
                <ButtonLink href="/talleres" variant="secondary">Talleres</ButtonLink>
              </>
            )}
          />

          <section className="vk-card vk-card-padded">
            <div className="vk-section-heading">
              <h2>Membresías</h2>
              <Link href="/membresias" className="vk-button secondary">Ver todas</Link>
            </div>
            {memberships.length ? (
              <div className="vk-action-grid">
                {memberships.map((membership) => (
                  <Link key={membership.id} href={`/membresias/${membership.slug}`} className="vk-card vk-card-padded vk-card-link">
                    <span className="vk-pill">Club VeCKA</span>
                    <h3 style={{ margin: 0, fontSize: 28 }}>{membership.name}</h3>
                    {membership.description ? <p style={{ margin: 0, color: 'var(--muted)' }}>{membership.description}</p> : null}
                  </Link>
                ))}
              </div>
            ) : (
              <EmptyState>No hay membresías publicadas por el momento.</EmptyState>
            )}
          </section>

          <section className="vk-card vk-card-padded" style={{ marginTop: 22 }}>
            <div className="vk-section-heading">
              <h2>Talleres recientes</h2>
              <Link href="/talleres" className="vk-button secondary">Ver talleres</Link>
            </div>
            {courses.length ? (
              <div className="vk-action-grid">
                {courses.map((course) => (
                  <Card key={course.id} as={Link} href={`/courses/${course.slug}`} className="vk-card-link">
                    {course.cover_image_url ? (
                      <img src={course.cover_image_url} alt={course.title} style={{ borderRadius: 12, aspectRatio: '16 / 9', objectFit: 'cover' }} />
                    ) : null}
                    <span className="vk-pill warm">{course.category || 'Taller'}</span>
                    <h3 style={{ margin: 0, fontSize: 28 }}>{course.title}</h3>
                    {course.subtitle ? <p style={{ margin: 0, color: 'var(--muted)' }}>{course.subtitle}</p> : null}
                  </Card>
                ))}
              </div>
            ) : (
              <EmptyState>No hay talleres publicados por el momento.</EmptyState>
            )}
          </section>
        </div>
      </main>
    </PublicSiteShell>
  )
}
