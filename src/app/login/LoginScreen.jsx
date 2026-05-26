'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { getPostLoginPath, getSafeInternalPath } from '@/lib/auth-redirects'
import { getSupabaseBrowser } from '@/lib/supabase/browser'

function GoogleMark() {
  return (
    <svg className="lovable-google-mark" viewBox="0 0 24 24" aria-hidden="true">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
      <path fill="#FBBC05" d="M5.84 14.1A6.6 6.6 0 0 1 5.5 12c0-.73.13-1.44.34-2.1V7.07H2.18A11 11 0 0 0 1 12c0 1.77.42 3.45 1.18 4.93l3.66-2.83z" />
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.83C6.71 7.31 9.14 5.38 12 5.38z" />
    </svg>
  )
}

function AuthField({ label, ...props }) {
  return (
    <label className="lovable-field">
      <span>{label}</span>
      <input {...props} className="lovable-input" />
    </label>
  )
}

function getFriendlyAuthError(error) {
  const message = error?.message || ''

  if (message.toLowerCase().includes('invalid login credentials')) {
    return 'Email o contraseña incorrectos.'
  }

  if (message.toLowerCase().includes('email not confirmed')) {
    return 'Tenés que confirmar tu email antes de entrar.'
  }

  return message || 'No pudimos iniciar sesión. Probá nuevamente.'
}

export default function LoginScreen({ nextPath = '/', initialError = null, initialSuccess = null, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login')
  const [message, setMessage] = useState(initialSuccess || initialError || '')
  const [messageType, setMessageType] = useState(initialError ? 'error' : initialSuccess ? 'success' : '')
  const [loading, setLoading] = useState(false)
  const [oauthLoading, setOauthLoading] = useState(false)
  const heading = useMemo(() => (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'), [mode])

  async function readProfileRole(userId) {
    const supabase = getSupabaseBrowser()
    const { data } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle()

    return data?.role || 'student'
  }

  async function handleLogin(email, password) {
    const supabase = getSupabaseBrowser()
    let result = await supabase.auth.signInWithPassword({ email, password })

    if (result.error) {
      const migration = await fetch('/api/auth/legacy-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      if (migration.ok) {
        const migrated = await migration.json().catch(() => ({}))
        result = await supabase.auth.signInWithPassword({
          email: migrated.email || email,
          password,
        })
      }
    }

    if (result.error) {
      throw new Error(getFriendlyAuthError(result.error))
    }

    const userId = result.data?.user?.id
    if (!userId) {
      throw new Error('No se pudo recuperar la sesión.')
    }

    if (result.data?.user?.user_metadata?.requires_password_change) {
      window.location.assign(`/cambiar-contrasena?next=${encodeURIComponent(nextPath)}`)
      return
    }

    const role = await readProfileRole(userId)
    window.location.assign(getPostLoginPath(role, nextPath))
  }

  async function handleSignup(formData) {
    const supabase = getSupabaseBrowser()
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')
    const fullName = String(formData.get('full_name') || '').trim()

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    })

    if (error) {
      throw new Error(getFriendlyAuthError(error))
    }

    setMode('login')
    setMessageType('success')
    setMessage('Cuenta creada. Ya podés iniciar sesión.')
  }

  async function handleGoogleLogin() {
    setOauthLoading(true)
    setMessage('')
    setMessageType('')

    try {
      const supabase = getSupabaseBrowser()
      const safeNextPath = getSafeInternalPath(nextPath, '/')
      const redirectTo = `${window.location.origin}/auth/callback?next=${encodeURIComponent(safeNextPath)}`

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo,
          queryParams: {
            prompt: 'select_account',
          },
        },
      })

      if (error) {
        throw new Error(getFriendlyAuthError(error))
      }
    } catch (error) {
      setOauthLoading(false)
      setMessageType('error')
      setMessage(error.message || 'No pudimos iniciar sesión con Google.')
    }
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setMessage('')
    setMessageType('')

    const formData = new FormData(event.currentTarget)
    const email = String(formData.get('email') || '').trim()
    const password = String(formData.get('password') || '')

    try {
      if (mode === 'login') {
        await handleLogin(email, password)
      } else {
        await handleSignup(formData)
      }
    } catch (error) {
      setMessageType('error')
      setMessage(error.message || 'No pudimos procesar la solicitud.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="lovable-login">
      <h1>{heading}</h1>
      <p className="lovable-login-subtitle">
        {mode === 'login' ? 'Bienvenida de vuelta a VeCKA.' : 'Creá tu acceso para comprar y ver tus clases.'}
      </p>

      <button type="button" className="lovable-google-button" onClick={handleGoogleLogin} disabled={loading || oauthLoading}>
        <GoogleMark />
        {oauthLoading ? 'Conectando con Google...' : 'Continuar con Google'}
      </button>

      <div className="lovable-divider">o</div>

      {message ? (
        <div className={`lovable-message ${messageType}`}>
          {message}
        </div>
      ) : null}

      <form onSubmit={handleSubmit} className="lovable-form">
        {mode === 'signup' ? <AuthField label="Nombre completo" name="full_name" placeholder="Tu nombre" /> : null}
        <AuthField label="Email" name="email" type="email" required />
        <AuthField label="Contraseña" name="password" type="password" required />
        <input name="next" type="hidden" value={nextPath} />

        <button type="submit" className="lovable-button" style={{ marginTop: 0 }} disabled={loading || oauthLoading}>
          {loading ? 'Procesando...' : mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <p className="lovable-auth-link">
        {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
        {mode === 'login' ? (
          <button
            type="button"
            onClick={() => {
              setMode('signup')
              setMessage('')
              setMessageType('')
            }}
          >
            Crear cuenta
          </button>
        ) : (
          <button
            type="button"
            onClick={() => {
              setMode('login')
              setMessage('')
              setMessageType('')
            }}
          >
            Iniciar sesión
          </button>
        )}
      </p>

      <p className="lovable-auth-link" style={{ marginTop: 10 }}>
        <Link href="/">Volver al inicio</Link>
      </p>
    </main>
  )
}
