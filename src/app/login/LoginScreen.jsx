'use client'

import { useMemo, useState } from 'react'
import { signIn, signUp } from '../auth/actions'

function AuthField({ label, ...props }) {
  return (
    <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, color: '#6f5b4d' }}>
        {label}
      </span>
      <input
        {...props}
        style={{
          padding: '13px 16px',
          border: '1.5px solid #dfd2c8',
          borderRadius: 10,
          fontFamily: "'DM Sans', sans-serif",
          fontSize: 14,
          outline: 'none',
          width: '100%',
          boxSizing: 'border-box',
          background: '#fff',
        }}
      />
    </label>
  )
}

export default function LoginScreen({ nextPath = '/', initialError = null, initialSuccess = null }) {
  const [tab, setTab] = useState('login')
  const [error] = useState(initialError)
  const [success] = useState(initialSuccess)

  const heading = useMemo(() => (tab === 'login' ? 'Iniciar sesión' : 'Crear cuenta'), [tab])

  return (
    <main
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #fffaf3 0%, #f7efe6 100%)',
        display: 'grid',
        placeItems: 'center',
        padding: '32px 16px',
      }}
    >
      <section
        style={{
          width: '100%',
          maxWidth: 460,
          background: '#fff',
          border: '1px solid #dfd2c8',
          borderRadius: 24,
          boxShadow: '0 18px 48px rgba(23,33,34,.08)',
          padding: 28,
        }}
      >
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img
            src="/logo-VeCKA.jpg"
            alt="VeCKA"
            style={{ height: 58, width: 58, objectFit: 'cover', borderRadius: 12, marginBottom: 10 }}
          />
          <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 42, margin: '0 0 8px', lineHeight: 1 }}>
            {heading}
          </h1>
          <p style={{ margin: 0, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: '#6f5b4d' }}>
            {tab === 'login' ? 'Entrá a tu cuenta de VeCKA' : 'Creá tu acceso para comprar y ver tus clases'}
          </p>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            background: '#f5ede4',
            padding: 4,
            borderRadius: 12,
            marginBottom: 22,
          }}
        >
          <button
            type="button"
            onClick={() => setTab('login')}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: tab === 'login' ? '#fff' : 'transparent',
              color: tab === 'login' ? '#1d5f55' : '#6f5b4d',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: tab === 'login' ? '0 2px 10px rgba(0,0,0,.06)' : 'none',
            }}
          >
            Iniciar sesión
          </button>
          <button
            type="button"
            onClick={() => setTab('register')}
            style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: 'none',
              background: tab === 'register' ? '#fff' : 'transparent',
              color: tab === 'register' ? '#1d5f55' : '#6f5b4d',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              boxShadow: tab === 'register' ? '0 2px 10px rgba(0,0,0,.06)' : 'none',
            }}
          >
            Registrarme
          </button>
        </div>

        {(error || success) ? (
          <div
            style={{
              marginBottom: 18,
              padding: '12px 14px',
              borderRadius: 12,
              background: error ? '#fce8e1' : '#e7f4ed',
              color: error ? '#8a3b26' : '#2f6b4f',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 13,
              lineHeight: 1.5,
            }}
          >
            {error || success}
          </div>
        ) : null}

        <form action={tab === 'login' ? signIn : signUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' ? <AuthField label="Nombre completo" name="full_name" placeholder="Tu nombre" /> : null}
          <AuthField label="Email" name="email" type="email" placeholder="tu@email.com" required />
          <AuthField label="Contraseña" name="password" type="password" placeholder="********" required />
          <input name="next" type="hidden" value={nextPath} />

          <button
            type="submit"
            style={{
              padding: '14px 18px',
              borderRadius: 12,
              border: 'none',
              background: '#5e9e8a',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontSize: 15,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            {tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </button>
        </form>
      </section>
    </main>
  )
}
