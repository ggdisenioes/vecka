'use client'

import { useRef, useState } from 'react'

const ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif'

export default function ImageUploader({
  value,
  onChange,
  scope = 'misc',
  label = 'Imagen',
  hint = 'Arrastrá una imagen acá o hacé clic para elegir un archivo. Máx 8 MB.',
  onError,
}) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState('')

  function reportError(message) {
    setLocalError(message)
    if (typeof onError === 'function') onError(message)
  }

  async function uploadFile(file) {
    if (!file) return
    setLocalError('')
    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('scope', scope)
      const res = await fetch('/api/admin/uploads/image', { method: 'POST', body: formData })
      const data = await res.json()
      if (!res.ok) throw new Error(data?.error || 'No se pudo subir la imagen')
      onChange?.(data.url)
    } catch (error) {
      reportError(error.message || 'No se pudo subir la imagen')
    } finally {
      setUploading(false)
    }
  }

  function handleInput(event) {
    const file = event.target.files?.[0]
    event.target.value = ''
    if (file) uploadFile(file)
  }

  function handleDrop(event) {
    event.preventDefault()
    setDragOver(false)
    const file = event.dataTransfer.files?.[0]
    if (file) uploadFile(file)
  }

  function handleClear() {
    onChange?.('')
    setLocalError('')
  }

  return (
    <div className="image-uploader">
      {label ? <label className="image-uploader-label">{label}</label> : null}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT}
        onChange={handleInput}
        disabled={uploading}
        style={{ display: 'none' }}
      />

      {value ? (
        <div className="image-uploader-preview">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="Vista previa" />
          <div className="image-uploader-preview-actions">
            <button
              type="button"
              className="admin-button ghost"
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? 'Subiendo…' : 'Reemplazar'}
            </button>
            <button
              type="button"
              className="admin-button danger"
              onClick={handleClear}
              disabled={uploading}
            >
              Quitar
            </button>
          </div>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          className={`image-uploader-dropzone${dragOver ? ' drag-over' : ''}${uploading ? ' uploading' : ''}`}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') inputRef.current?.click() }}
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragEnter={() => setDragOver(true)}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
        >
          <span className="image-uploader-icon" aria-hidden>↑</span>
          <span className="image-uploader-hint">
            {uploading ? 'Subiendo…' : hint}
          </span>
        </div>
      )}

      {localError ? <p className="image-uploader-error">{localError}</p> : null}
    </div>
  )
}
