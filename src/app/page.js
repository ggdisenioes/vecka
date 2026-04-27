import Link from 'next/link'
import { getAdminDashboardData, getPublishedCourses, getPublishedProducts } from '@/lib/lms'

export const dynamic = 'force-dynamic'

export default async function HomePage() {
  const [dashboard, courses, products] = await Promise.all([
    getAdminDashboardData(),
    getPublishedCourses(),
    getPublishedProducts(),
  ])

  return (
    <main className="shell">
      <section className="hero">
        <div className="hero-card hero-copy">
          <div className="eyebrow">Migración confirmada</div>
          <h1 className="display">Vecka ya tiene base full-stack para convertirse en una escuela escalable.</h1>
          <p className="lede">
            Esta nueva base corre sobre Next.js App Router y Supabase. Ya queda preparada para cursos,
            módulos, clases, archivos adjuntos y `vimeo_url` por lección.
          </p>
          <div className="cta-stack">
            <Link className="btn btn-primary" href="/admin">Abrir panel editorial</Link>
            <Link className="btn btn-secondary" href="/courses">Ver catálogo de cursos</Link>
          </div>
          <div className="hero-stats">
            <div className="hero-stat">
              <strong>{dashboard.metrics.courses}</strong>
              <span className="muted">cursos en base</span>
            </div>
            <div className="hero-stat">
              <strong>{dashboard.metrics.lessons}</strong>
              <span className="muted">clases modeladas</span>
            </div>
            <div className="hero-stat">
              <strong>{dashboard.metrics.products}</strong>
              <span className="muted">productos listos</span>
            </div>
          </div>
        </div>
        <aside className="hero-card hero-aside">
          <div className="card">
            <span className="badge">Video ready</span>
            <h3>Vimeo queda configurado como proveedor principal</h3>
            <p className="body-copy">Cada clase ya tiene campos específicos para `video_provider`, `vimeo_url` y `external_video_url`.</p>
          </div>
          <div className="card">
            <span className="badge">Storage ready</span>
            <h3>Adjuntos en Supabase Storage</h3>
            <p className="body-copy">La base incluye `lesson_attachments` y buckets privados para PDFs, moldes y recursos de clase.</p>
          </div>
        </aside>
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Cursos publicados</div>
            <h2 className="section-title">Escuela Vecka</h2>
          </div>
          <Link className="btn btn-secondary" href="/courses">Explorar todos</Link>
        </div>
        {courses.length === 0 ? (
          <div className="empty">Todavía no hay cursos publicados en Supabase. Podés crearlos desde el admin.</div>
        ) : (
          <div className="grid course-grid">
            {courses.slice(0, 3).map((course) => (
              <article className="card" key={course.id}>
                <span className="badge">{course.category || 'Curso'}</span>
                <h3>{course.title}</h3>
                <p className="body-copy">{course.subtitle || course.description}</p>
                <p className="muted">{course.level} · {course.duration_label || 'Duración a definir'}</p>
                <Link className="btn btn-primary" href={`/courses/${course.slug}`}>Entrar al curso</Link>
              </article>
            ))}
          </div>
        )}
      </section>

      <section className="section">
        <div className="section-head">
          <div>
            <div className="eyebrow">Productos publicados</div>
            <h2 className="section-title">Catálogo comercial</h2>
          </div>
          <Link className="btn btn-secondary" href="/products">Ver productos</Link>
        </div>
        {products.length === 0 ? (
          <div className="empty">Todavía no hay productos publicados en Supabase.</div>
        ) : (
          <div className="grid product-grid">
            {products.slice(0, 4).map((product) => (
              <article className="card" key={product.id}>
                <span className="badge">{product.category || 'Producto'}</span>
                <h4>{product.title}</h4>
                <p className="body-copy">{product.subcategory || product.product_type}</p>
                <p className="muted">ARS {Number(product.price_ars || 0).toLocaleString('es-AR')}</p>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  )
}
