'use client'

import { useState } from 'react'
import { getSafeInternalPath } from '@/lib/auth-redirects'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

export default function ChangePasswordForm({ nextPath = '/cuenta' }) {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')

    if (password.length < 8) {
      setError('La contraseña debe tener al menos 8 caracteres.')
      return
    }

    if (password !== confirm) {
      setError('Las contraseñas no coinciden.')
      return
    }

    setLoading(true)
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password }),
      })
      const data = await res.json().catch(() => ({}))

      if (!res.ok) {
        setError(data.error || 'No pudimos actualizar la contraseña.')
        return
      }

      await getSupabaseBrowser().auth.refreshSession()
      window.location.assign(getSafeInternalPath(nextPath, '/cuenta'))
    } catch {
      setError('Error de conexión. Intentá de nuevo.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="lovable-form">
      <label className="lovable-field">
        <span>Nueva contraseña</span>
        <input
          className="lovable-input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          minLength={8}
          required
        />
      </label>
      <label className="lovable-field">
        <span>Repetir contraseña</span>
        <input
          className="lovable-input"
          type="password"
          value={confirm}
          onChange={(event) => setConfirm(event.target.value)}
          minLength={8}
          required
        />
      </label>

      {error ? <div className="lovable-message error">{error}</div> : null}

      <button type="submit" className="lovable-button" style={{ marginTop: 0 }} disabled={loading}>
        {loading ? 'Guardando...' : 'Guardar contraseña'}
      </button>
    </form>
  )
}
