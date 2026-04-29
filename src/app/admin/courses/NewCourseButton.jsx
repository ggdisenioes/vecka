'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewCourseButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    const title = window.prompt('Título del nuevo curso:', 'Curso sin título')
    if (title === null) return
    setLoading(true)
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title || 'Curso sin título' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'No se pudo crear el curso')
      router.push(`/admin/courses/${data.course.id}`)
    } catch (error) {
      alert(error.message || 'Error al crear el curso')
      setLoading(false)
    }
  }

  return (
    <button type="button" className="admin-button" onClick={handleClick} disabled={loading}>
      {loading ? 'Creando…' : 'Nuevo curso'}
    </button>
  )
}
