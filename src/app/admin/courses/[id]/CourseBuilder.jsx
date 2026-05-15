'use client'

import { useCallback, useEffect, useState } from 'react'
import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import Link from 'next/link'

const STATUS_LABELS = { draft: 'Borrador', published: 'Publicada', archived: 'Archivada' }
const STATUS_CLASS = { draft: 'draft', published: 'published', archived: 'archived' }

function statusPill(status) {
  return <span className={`status-pill ${STATUS_CLASS[status] || 'draft'}`}>{STATUS_LABELS[status] || status}</span>
}

function DragHandle({ listeners, attributes }) {
  return (
    <span className="drag-handle" {...listeners} {...attributes} title="Arrastrar">
      ⠿
    </span>
  )
}

function TypeIcon({ type }) {
  if (type === 'section') return <span className="builder-icon section-icon">§</span>
  if (type === 'lesson') return <span className="builder-icon lesson-icon">📖</span>
  if (type === 'topic') return <span className="builder-icon topic-icon">📄</span>
  if (type === 'quiz') return <span className="builder-icon quiz-icon">❓</span>
  return null
}

// ─── Sortable Quiz Row (non-sortable display, no DnD for quizzes) ────────────

function QuizRow({ quiz, courseId, onDelete }) {
  async function remove() {
    if (!window.confirm('¿Eliminar este quiz?')) return
    await fetch(`/api/admin/quizzes/${quiz.id}`, { method: 'DELETE' })
    onDelete(quiz.id)
  }

  return (
    <div className="builder-row quiz-row">
      <span className="drag-handle-placeholder" />
      <TypeIcon type="quiz" />
      <span className="builder-title">{quiz.title}</span>
      {statusPill(quiz.status)}
      <div className="builder-actions">
        <Link className="builder-btn" href={`/admin/courses/${courseId}/quiz/${quiz.id}`}>
          Editar
        </Link>
        <button type="button" className="builder-btn danger" onClick={remove}>✕</button>
      </div>
    </div>
  )
}

// ─── Sortable Topic Row ───────────────────────────────────────────────────────

function SortableTopicRow({ topic, courseId, onDelete }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `topic-${topic.id}`,
    data: { type: 'topic', item: topic },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }

  async function remove() {
    if (!window.confirm('¿Eliminar este tema?')) return
    await fetch(`/api/admin/topics/${topic.id}`, { method: 'DELETE' })
    onDelete(topic.id)
  }

  return (
    <div ref={setNodeRef} style={style} className="builder-row topic-row">
      <DragHandle listeners={listeners} attributes={attributes} />
      <TypeIcon type="topic" />
      <span className="builder-title">{topic.title}</span>
      {statusPill(topic.status)}
      <div className="builder-actions">
        <Link className="builder-btn" href={`/admin/courses/${courseId}/tema/${topic.id}`}>
          Editar
        </Link>
        <button type="button" className="builder-btn danger" onClick={remove}>✕</button>
      </div>
    </div>
  )
}

// ─── Sortable Lesson Row ──────────────────────────────────────────────────────

function SortableLessonRow({ lesson, courseId, topics, quizzes, onDeleteLesson, onTopicsChange, onAddTopic, onAddQuiz, onDeleteQuiz }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `lesson-${lesson.id}`,
    data: { type: 'lesson', item: lesson },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [addingTopic, setAddingTopic] = useState(false)
  const [addingQuiz, setAddingQuiz] = useState(false)

  const lessonTopics = topics.filter((t) => t.lesson_id === lesson.id)
  const lessonQuizzes = quizzes.filter((q) => q.lesson_id === lesson.id && !q.topic_id)
  const topicIds = lessonTopics.map((t) => `topic-${t.id}`)

  async function remove() {
    if (!window.confirm('¿Eliminar esta lección y todos sus temas?')) return
    await fetch(`/api/admin/lessons/${lesson.id}`, { method: 'DELETE' })
    onDeleteLesson(lesson.id)
  }

  async function addTopic() {
    setAddingTopic(true)
    try {
      const res = await fetch('/api/admin/topics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lessonId: lesson.id, title: 'Nuevo tema' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onAddTopic(data.topic)
    } finally {
      setAddingTopic(false)
    }
  }

  async function addQuiz() {
    setAddingQuiz(true)
    try {
      const res = await fetch('/api/admin/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ courseId: lesson.course_id, lessonId: lesson.id, title: 'Nuevo quiz' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onAddQuiz(data.quiz)
    } finally {
      setAddingQuiz(false)
    }
  }

  return (
    <div ref={setNodeRef} style={style} className="builder-lesson-wrapper">
      <div className="builder-row lesson-row">
        <DragHandle listeners={listeners} attributes={attributes} />
        <TypeIcon type="lesson" />
        <span className="builder-title">{lesson.title}</span>
        {statusPill(lesson.status)}
        <div className="builder-actions">
          <button type="button" className="builder-btn subtle" onClick={addTopic} disabled={addingTopic}>
            {addingTopic ? '…' : '+ Tema'}
          </button>
          <button type="button" className="builder-btn subtle" onClick={addQuiz} disabled={addingQuiz}>
            {addingQuiz ? '…' : '+ Quiz'}
          </button>
          <Link className="builder-btn" href={`/admin/courses/${courseId}/leccion/${lesson.id}`}>
            Editar
          </Link>
          <button type="button" className="builder-btn danger" onClick={remove}>✕</button>
        </div>
      </div>

      {(lessonTopics.length > 0 || lessonQuizzes.length > 0) && (
        <div className="builder-children">
          <SortableContext items={topicIds} strategy={verticalListSortingStrategy}>
            {lessonTopics.map((topic) => (
              <SortableTopicRow
                key={topic.id}
                topic={topic}
                courseId={courseId}
                onDelete={(id) => onTopicsChange(topics.filter((t) => t.id !== id))}
              />
            ))}
          </SortableContext>
          {lessonQuizzes.map((quiz) => (
            <QuizRow
              key={quiz.id}
              quiz={quiz}
              courseId={courseId}
              onDelete={onDeleteQuiz}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Sortable Section Row ─────────────────────────────────────────────────────

function SortableSectionRow({ section, onDelete, onRename }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: `section-${section.id}`,
    data: { type: 'section', item: section },
  })
  const style = { transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }
  const [editing, setEditing] = useState(false)
  const [title, setTitle] = useState(section.title)

  async function saveTitle() {
    setEditing(false)
    if (title === section.title) return
    await fetch(`/api/admin/sections/${section.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title }),
    })
    onRename(section.id, title)
  }

  async function remove() {
    if (!window.confirm('¿Eliminar esta sección? Las lecciones quedarán sin sección asignada.')) return
    await fetch(`/api/admin/sections/${section.id}`, { method: 'DELETE' })
    onDelete(section.id)
  }

  return (
    <div ref={setNodeRef} style={style} className="builder-section-row">
      <DragHandle listeners={listeners} attributes={attributes} />
      <TypeIcon type="section" />
      {editing ? (
        <input
          className="section-title-input"
          value={title}
          autoFocus
          onChange={(e) => setTitle(e.target.value)}
          onBlur={saveTitle}
          onKeyDown={(e) => { if (e.key === 'Enter') saveTitle() }}
        />
      ) : (
        <span className="section-title" onClick={() => setEditing(true)}>{section.title}</span>
      )}
      <div className="builder-actions">
        <button type="button" className="builder-btn" onClick={() => setEditing(true)}>Renombrar</button>
        <button type="button" className="builder-btn danger" onClick={remove}>✕</button>
      </div>
    </div>
  )
}

// ─── Main Course Builder ──────────────────────────────────────────────────────

export default function CourseBuilder({ courseId }) {
  const [sections, setSections] = useState([])
  const [lessons, setLessons] = useState([])
  const [topics, setTopics] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeId, setActiveId] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  )

  useEffect(() => {
    fetch(`/api/admin/builder/${courseId}`)
      .then((r) => r.json())
      .then((data) => {
        setSections(data.sections || [])
        setLessons(data.lessons || [])
        setTopics(data.topics || [])
        setQuizzes(data.quizzes || [])
      })
      .finally(() => setLoading(false))
  }, [courseId])

  async function persistOrder(newSections, newLessons, newTopics) {
    setSaving(true)
    const items = [
      ...newSections.map((s, i) => ({ type: 'section', id: s.id, sortOrder: i * 100 })),
      ...newLessons.map((l, i) => ({ type: 'lesson', id: l.id, sortOrder: i * 100, sectionId: l.section_id })),
      ...newTopics.map((t, i) => ({ type: 'topic', id: t.id, sortOrder: i * 100 })),
    ]
    await fetch(`/api/admin/builder/${courseId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ items }),
    })
    setSaving(false)
  }

  function handleDragEnd(event) {
    const { active, over } = event
    setActiveId(null)
    if (!over || active.id === over.id) return

    const activeType = active.data.current?.type
    const overType = over.data.current?.type

    if (activeType === 'section' && overType === 'section') {
      const oldIndex = sections.findIndex((s) => `section-${s.id}` === active.id)
      const newIndex = sections.findIndex((s) => `section-${s.id}` === over.id)
      const next = arrayMove(sections, oldIndex, newIndex)
      setSections(next)
      persistOrder(next, lessons, topics)
      return
    }

    if (activeType === 'lesson' && overType === 'lesson') {
      const oldIndex = lessons.findIndex((l) => `lesson-${l.id}` === active.id)
      const newIndex = lessons.findIndex((l) => `lesson-${l.id}` === over.id)
      const next = arrayMove(lessons, oldIndex, newIndex)
      setLessons(next)
      persistOrder(sections, next, topics)
      return
    }

    if (activeType === 'topic' && overType === 'topic') {
      const oldIndex = topics.findIndex((t) => `topic-${t.id}` === active.id)
      const newIndex = topics.findIndex((t) => `topic-${t.id}` === over.id)
      const next = arrayMove(topics, oldIndex, newIndex)
      setTopics(next)
      persistOrder(sections, lessons, next)
      return
    }
  }

  function handleDragStart(event) {
    setActiveId(event.active.id)
  }

  async function addSection() {
    const res = await fetch('/api/admin/sections', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, title: 'Nueva sección' }),
    })
    const data = await res.json()
    if (res.ok) setSections((prev) => [...prev, data.section])
  }

  async function addLesson(sectionId = null) {
    const res = await fetch('/api/admin/lessons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, sectionId, title: 'Nueva lección' }),
    })
    const data = await res.json()
    if (res.ok) setLessons((prev) => [...prev, data.lesson])
  }

  // Group lessons by section
  const lessonsBySection = {}
  const unattachedLessons = []
  for (const lesson of lessons) {
    if (lesson.section_id) {
      lessonsBySection[lesson.section_id] = lessonsBySection[lesson.section_id] || []
      lessonsBySection[lesson.section_id].push(lesson)
    } else {
      unattachedLessons.push(lesson)
    }
  }

  const allSortableIds = [
    ...sections.map((s) => `section-${s.id}`),
    ...lessons.map((l) => `lesson-${l.id}`),
    ...topics.map((t) => `topic-${t.id}`),
  ]

  if (loading) return <div className="empty-state">Cargando constructor…</div>

  return (
    <div className="course-builder">
      <div className="builder-toolbar">
        <button type="button" className="admin-button" onClick={addSection}>+ Nueva sección</button>
        <button type="button" className="admin-button subtle" onClick={() => addLesson(null)}>+ Nueva lección (sin sección)</button>
        {saving && <span className="file-meta">Guardando…</span>}
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={allSortableIds} strategy={verticalListSortingStrategy}>
          {/* Unattached lessons */}
          {unattachedLessons.map((lesson) => (
            <SortableLessonRow
              key={lesson.id}
              lesson={lesson}
              courseId={courseId}
              topics={topics}
              quizzes={quizzes}
              onDeleteLesson={(id) => setLessons((prev) => prev.filter((l) => l.id !== id))}
              onTopicsChange={setTopics}
              onAddTopic={(t) => setTopics((prev) => [...prev, t])}
              onAddQuiz={(q) => setQuizzes((prev) => [...prev, q])}
              onDeleteQuiz={(id) => setQuizzes((prev) => prev.filter((q) => q.id !== id))}
            />
          ))}

          {/* Sections with their lessons */}
          {sections.map((section) => (
            <div key={section.id} className="builder-section-block">
              <SortableSectionRow
                section={section}
                onDelete={(id) => setSections((prev) => prev.filter((s) => s.id !== id))}
                onRename={(id, title) =>
                  setSections((prev) => prev.map((s) => (s.id === id ? { ...s, title } : s)))
                }
              />
              <div className="builder-section-lessons">
                {(lessonsBySection[section.id] || []).map((lesson) => (
                  <SortableLessonRow
                    key={lesson.id}
                    lesson={lesson}
                    courseId={courseId}
                    topics={topics}
                    quizzes={quizzes}
                    onDeleteLesson={(id) => setLessons((prev) => prev.filter((l) => l.id !== id))}
                    onTopicsChange={setTopics}
                    onAddTopic={(t) => setTopics((prev) => [...prev, t])}
                    onAddQuiz={(q) => setQuizzes((prev) => [...prev, q])}
                    onDeleteQuiz={(id) => setQuizzes((prev) => prev.filter((q) => q.id !== id))}
                  />
                ))}
                <button
                  type="button"
                  className="builder-btn subtle add-lesson-to-section"
                  onClick={() => addLesson(section.id)}
                >
                  + Añadir lección a esta sección
                </button>
              </div>
            </div>
          ))}
        </SortableContext>

        <DragOverlay>
          {activeId && (
            <div className="builder-drag-overlay">
              {activeId.startsWith('section-')
                ? sections.find((s) => `section-${s.id}` === activeId)?.title
                : activeId.startsWith('lesson-')
                ? lessons.find((l) => `lesson-${l.id}` === activeId)?.title
                : topics.find((t) => `topic-${t.id}` === activeId)?.title}
            </div>
          )}
        </DragOverlay>
      </DndContext>

      {sections.length === 0 && lessons.length === 0 && (
        <div className="empty-state" style={{ marginTop: 16 }}>
          Aún no hay contenido. Hacé clic en <strong>+ Nueva sección</strong> o <strong>+ Nueva lección</strong> para empezar.
        </div>
      )}
    </div>
  )
}
