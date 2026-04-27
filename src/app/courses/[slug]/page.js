import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getCourseBySlug } from '@/lib/lms'

export const dynamic = 'force-dynamic'

function findLesson(course, requestedLessonId) {
  const allLessons = (course.modules || []).flatMap((module) => module.lessons || [])
  if (!allLessons.length) return null
  if (!requestedLessonId) return allLessons[0]
  return allLessons.find((lesson) => lesson.id === requestedLessonId) || allLessons[0]
}

function renderVideo(lesson) {
  if (!lesson) return null

  const url = lesson.video_provider === 'vimeo'
    ? lesson.vimeo_url
    : lesson.external_video_url

  if (!url) {
    return <div className="empty">Esta clase todavía no tiene video asociado.</div>
  }

  return (
    <iframe
      className="lesson-frame"
      src={url}
      allow="autoplay; fullscreen; picture-in-picture"
      allowFullScreen
      title={lesson.title}
    />
  )
}

export default async function CourseDetailPage({ params, searchParams }) {
  const course = await getCourseBySlug(params.slug)

  if (!course) {
    notFound()
  }

  const lesson = findLesson(course, searchParams.lesson)

  return (
    <main className="shell section">
      <div className="section-head">
        <div>
          <div className="eyebrow">{course.category || 'Curso'}</div>
          <h1 className="section-title">{course.title}</h1>
          <p className="lede">{course.description}</p>
        </div>
      </div>

      <div className="course-shell">
        <aside className="panel">
          <h3>Módulos</h3>
          <div className="module-list">
            {(course.modules || []).map((module) => (
              <div className="list-row" key={module.id}>
                <strong>{module.position}. {module.title}</strong>
                <div className="lesson-list" style={{ marginTop: 12 }}>
                  {(module.lessons || []).map((item) => (
                    <Link
                      className="attachment-item"
                      href={`/courses/${course.slug}?lesson=${item.id}`}
                      key={item.id}
                    >
                      <span>{item.title}</span>
                      <span className="muted">{item.status}</span>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </aside>

        <section className="panel lesson-player">
          <span className="badge">{lesson?.video_provider || 'Sin video'}</span>
          <h2>{lesson?.title || 'Clase no disponible'}</h2>
          <p className="body-copy">{lesson?.summary || 'Definí una lección en el admin para empezar a cargar contenido.'}</p>
          {renderVideo(lesson)}
          {lesson?.body && (
            <div className="section">
              <h3>Texto de la clase</h3>
              <p className="body-copy">{lesson.body}</p>
            </div>
          )}
          <div className="attachment-list">
            {(lesson?.attachments || []).map((attachment) => (
              <Link className="attachment-item" href={`/api/attachments/${attachment.id}`} key={attachment.id}>
                <span>{attachment.file_name}</span>
                <span className="muted">Descargar</span>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
