'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { signIn, signUp } from '../auth/actions'

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

export default function LoginScreen({ nextPath = '/', initialError = null, initialSuccess = null, initialMode = 'login' }) {
  const [mode, setMode] = useState(initialMode === 'signup' ? 'signup' : 'login')
  const heading = useMemo(() => (mode === 'login' ? 'Iniciar sesión' : 'Crear cuenta'), [mode])

  return (
    <main className="lovable-login">
      <h1>{heading}</h1>
      <p className="lovable-login-subtitle">
        {mode === 'login' ? 'Bienvenida de vuelta a VeCKA.' : 'Creá tu acceso para comprar y ver tus clases.'}
      </p>

      <button type="button" className="lovable-google-button" disabled>
        <GoogleMark />
        Continuar con Google
      </button>

      <div className="lovable-divider">o</div>

      {(initialError || initialSuccess) ? (
        <div className={`lovable-message ${initialError ? 'error' : 'success'}`}>
          {initialError || initialSuccess}
        </div>
      ) : null}

      <form action={mode === 'login' ? signIn : signUp} className="lovable-form">
        {mode === 'signup' ? <AuthField label="Nombre completo" name="full_name" placeholder="Tu nombre" /> : null}
        <AuthField label="Email" name="email" type="email" required />
        <AuthField label="Contraseña" name="password" type="password" required />
        <input name="next" type="hidden" value={nextPath} />
        <input name="auth_page" type="hidden" value="/login" />

        <button type="submit" className="lovable-button" style={{ marginTop: 0 }}>
          {mode === 'login' ? 'Entrar' : 'Crear cuenta'}
        </button>
      </form>

      <p className="lovable-auth-link">
        {mode === 'login' ? '¿No tenés cuenta?' : '¿Ya tenés cuenta?'}{' '}
        {mode === 'login' ? (
          <button type="button" onClick={() => setMode('signup')}>
            Crear cuenta
          </button>
        ) : (
          <button type="button" onClick={() => setMode('login')}>
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
