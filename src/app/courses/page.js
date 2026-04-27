import Link from 'next/link'
import { getPublishedCourses } from '@/lib/lms'

export const dynamic = 'force-dynamic'

export default async function CoursesPage() {
  const courses = await getPublishedCourses()

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <div className="eyebrow">Cursos</div>
          <h1 className="section-title">Catálogo de formación</h1>
        </div>
      </div>
      {courses.length === 0 ? (
        <div className="empty">No hay cursos publicados todavía.</div>
      ) : (
        <div className="grid course-grid">
          {courses.map((course) => (
            <article className="card" key={course.id}>
              <span className="badge">{course.category || 'Curso'}</span>
              <h3>{course.title}</h3>
              <p className="body-copy">{course.description}</p>
              <p className="muted">{course.level} · {course.duration_label || 'Duración a definir'}</p>
              <Link className="btn btn-primary" href={`/courses/${course.slug}`}>Abrir curso</Link>
            </article>
          ))}
        </div>
      )}
    </main>
  )
}
