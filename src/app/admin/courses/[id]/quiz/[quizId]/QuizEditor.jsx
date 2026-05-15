'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

function normalizeQuiz(q) {
  return {
    id: q.id,
    title: q.title || '',
    description: q.description || '',
    passPercentage: q.pass_percentage ?? 80,
    timeLimitMinutes: q.time_limit_minutes || '',
    showCorrectAnswers: q.show_correct_answers !== false,
    randomizeQuestions: Boolean(q.randomize_questions),
    status: q.status || 'draft',
    questions: (q.questions || []).sort((a, b) => a.sort_order - b.sort_order).map(normalizeQuestion),
  }
}

function normalizeQuestion(q) {
  return {
    id: q.id,
    questionText: q.question_text || '',
    points: q.points ?? 1,
    sortOrder: q.sort_order ?? 0,
    answers: (q.answers || []).sort((a, b) => a.sort_order - b.sort_order).map((a) => ({
      id: a.id,
      answerText: a.answer_text || '',
      isCorrect: Boolean(a.is_correct),
      sortOrder: a.sort_order ?? 0,
    })),
  }
}

function QuestionCard({ question, index, onChange, onDelete }) {
  const [saving, setSaving] = useState(false)

  function updateAnswer(answerId, partial) {
    onChange({
      ...question,
      answers: question.answers.map((a) => (a.id === answerId ? { ...a, ...partial } : a)),
    })
  }

  function setCorrect(answerId) {
    onChange({
      ...question,
      answers: question.answers.map((a) => ({ ...a, isCorrect: a.id === answerId })),
    })
  }

  async function save() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/questions/${question.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          questionText: question.questionText,
          points: question.points,
          answers: question.answers.map((a, i) => ({ ...a, sortOrder: i * 100 })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      onChange(normalizeQuestion(data.question))
    } catch (e) {
      alert(e.message || 'Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  async function remove() {
    if (!window.confirm('¿Eliminar esta pregunta?')) return
    await fetch(`/api/admin/questions/${question.id}`, { method: 'DELETE' })
    onDelete(question.id)
  }

  return (
    <div className="question-card">
      <div className="question-header">
        <span style={{ color: 'var(--muted)', fontSize: 13 }}>Pregunta {index + 1}</span>
        <div style={{ display: 'flex', gap: 8, marginLeft: 'auto' }}>
          <div className="editor-field" style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <label style={{ whiteSpace: 'nowrap', fontSize: 12 }}>Puntos:</label>
            <input
              type="number"
              min={1}
              style={{ width: 60, padding: '4px 8px', borderRadius: 8, border: '1px solid var(--line)', fontSize: 12 }}
              value={question.points}
              onChange={(e) => onChange({ ...question, points: Number(e.target.value) || 1 })}
            />
          </div>
          <button type="button" className="builder-btn" onClick={save} disabled={saving}>{saving ? '…' : 'Guardar'}</button>
          <button type="button" className="builder-btn danger" onClick={remove}>Eliminar</button>
        </div>
      </div>

      <div className="editor-field" style={{ marginBottom: 14 }}>
        <label>Pregunta</label>
        <textarea
          value={question.questionText}
          onChange={(e) => onChange({ ...question, questionText: e.target.value })}
          style={{ minHeight: 72 }}
        />
      </div>

      <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 8 }}>
        Respuestas — seleccioná la correcta
      </div>

      {question.answers.map((answer) => (
        <div key={answer.id} className="answer-row">
          <input
            type="radio"
            name={`correct-${question.id}`}
            checked={answer.isCorrect}
            onChange={() => setCorrect(answer.id)}
            title="Marcar como correcta"
          />
          <input
            type="text"
            value={answer.answerText}
            placeholder="Opción de respuesta…"
            onChange={(e) => updateAnswer(answer.id, { answerText: e.target.value })}
          />
          {answer.isCorrect && <span className="correct-label">Correcta</span>}
        </div>
      ))}
    </div>
  )
}

export default function QuizEditor({ quiz: initial, courseId }) {
  const router = useRouter()
  const [quiz, setQuiz] = useState(() => normalizeQuiz(initial))
  const [saving, setSaving] = useState(false)
  const [addingQ, setAddingQ] = useState(false)
  const [msg, setMsg] = useState(null)

  function flash(text, type = 'ok') {
    setMsg({ text, type })
    setTimeout(() => setMsg(null), 2800)
  }

  function updateQuestion(questionId, next) {
    setQuiz((prev) => ({
      ...prev,
      questions: prev.questions.map((q) => (q.id === questionId ? next : q)),
    }))
  }

  function deleteQuestion(questionId) {
    setQuiz((prev) => ({ ...prev, questions: prev.questions.filter((q) => q.id !== questionId) }))
  }

  async function saveSettings() {
    setSaving(true)
    try {
      const res = await fetch(`/api/admin/quizzes/${quiz.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: quiz.title,
          description: quiz.description,
          passPercentage: quiz.passPercentage,
          timeLimitMinutes: quiz.timeLimitMinutes || null,
          showCorrectAnswers: quiz.showCorrectAnswers,
          randomizeQuestions: quiz.randomizeQuestions,
          status: quiz.status,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      flash('Quiz guardado')
    } catch (e) {
      flash(e.message || 'Error', 'error')
    } finally {
      setSaving(false)
    }
  }

  async function addQuestion() {
    setAddingQ(true)
    try {
      const res = await fetch('/api/admin/questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ quizId: quiz.id }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setQuiz((prev) => ({ ...prev, questions: [...prev.questions, normalizeQuestion(data.question)] }))
    } catch (e) {
      flash(e.message || 'Error al agregar pregunta', 'error')
    } finally {
      setAddingQ(false)
    }
  }

  return (
    <div className="quiz-builder">
      {/* Settings */}
      <div className="admin-card editor-section">
        <div className="section-heading" style={{ marginBottom: 14 }}>
          <h3>Configuración del quiz</h3>
          <button type="button" className="admin-button" onClick={saveSettings} disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar configuración'}
          </button>
        </div>

        <div className="editor-row">
          <div className="editor-field">
            <label>Título</label>
            <input value={quiz.title} onChange={(e) => setQuiz((p) => ({ ...p, title: e.target.value }))} />
          </div>
          <div className="editor-field">
            <label>Estado</label>
            <select value={quiz.status} onChange={(e) => setQuiz((p) => ({ ...p, status: e.target.value }))}>
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </div>
          <div className="editor-field">
            <label>% para aprobar</label>
            <input type="number" min={0} max={100} value={quiz.passPercentage} onChange={(e) => setQuiz((p) => ({ ...p, passPercentage: Number(e.target.value) || 80 }))} />
          </div>
          <div className="editor-field">
            <label>Tiempo límite (min, opcional)</label>
            <input type="number" min={1} value={quiz.timeLimitMinutes} onChange={(e) => setQuiz((p) => ({ ...p, timeLimitMinutes: e.target.value }))} placeholder="Sin límite" />
          </div>
        </div>

        <div className="editor-field">
          <label>Descripción</label>
          <input value={quiz.description} onChange={(e) => setQuiz((p) => ({ ...p, description: e.target.value }))} />
        </div>

        <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginTop: 4 }}>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={quiz.showCorrectAnswers} onChange={(e) => setQuiz((p) => ({ ...p, showCorrectAnswers: e.target.checked }))} />
            Mostrar respuestas correctas al finalizar
          </label>
          <label style={{ display: 'flex', gap: 8, alignItems: 'center', fontSize: 13 }}>
            <input type="checkbox" checked={quiz.randomizeQuestions} onChange={(e) => setQuiz((p) => ({ ...p, randomizeQuestions: e.target.checked }))} />
            Aleatorizar orden de preguntas
          </label>
        </div>

        {msg && <div style={{ fontSize: 13, color: msg.type === 'error' ? '#b85c5c' : 'var(--accent-deep)', marginTop: 8 }}>{msg.text}</div>}
      </div>

      {/* Questions */}
      <div className="section-heading" style={{ marginTop: 8 }}>
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 20 }}>
          Preguntas ({quiz.questions.length})
        </h3>
        <button type="button" className="admin-button" onClick={addQuestion} disabled={addingQ}>
          {addingQ ? 'Agregando…' : '+ Agregar pregunta'}
        </button>
      </div>

      {quiz.questions.length === 0 && (
        <div className="empty-state">Aún no hay preguntas. Hacé clic en <strong>+ Agregar pregunta</strong> para empezar.</div>
      )}

      {quiz.questions.map((q, i) => (
        <QuestionCard
          key={q.id}
          question={q}
          index={i}
          onChange={(next) => updateQuestion(q.id, next)}
          onDelete={deleteQuestion}
        />
      ))}

      <div style={{ display: 'flex', gap: 10 }}>
        <button type="button" className="admin-button ghost" onClick={() => router.push(`/admin/courses/${courseId}`)}>
          ← Volver al curso
        </button>
      </div>
    </div>
  )
}
