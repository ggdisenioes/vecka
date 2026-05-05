'use client'

import { useEffect, useState } from 'react'

export default function LessonVideoPlayer({ lessonId }) {
  const [url, setUrl] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function loadSignedUrl() {
      try {
        const res = await fetch(`/api/videos/playback?scope=lesson&id=${encodeURIComponent(lessonId)}`)
        const data = await res.json()
        if (cancelled) return
        if (!res.ok) throw new Error(data?.error || 'No se pudo cargar el video')
        setUrl(data.url)
      } catch (err) {
        if (!cancelled) setError(err.message || 'Error al cargar el video')
      }
    }
    loadSignedUrl()
    return () => {
      cancelled = true
    }
  }, [lessonId])

  if (error) {
    return (
      <div className="video-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        {error}
      </div>
    )
  }

  if (!url) {
    return (
      <div className="video-frame" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
        Cargando video…
      </div>
    )
  }

  return (
    <div className="video-frame">
      <video src={url} controls controlsList="nodownload" />
    </div>
  )
}
