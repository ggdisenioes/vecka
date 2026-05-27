'use client'

import { useState } from 'react'
import Link from 'next/link'

function metricLabel(count, singular, plural) {
  return `${count} ${count === 1 ? singular : plural}`
}

export default function AccountScreen({ user, memberships, courses, purchases }) {
  const [fullName, setFullName] = useState(user.name || '')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSuccess('')

    const trimmedName = fullName.trim()
    if (!trimmedName) {
      setError('Ingresá tu nombre completo.')
      return
    }

    if (password || confirmPassword) {
      if (password.length < 8) {
        setError('La contraseña debe tener al menos 8 caracteres.')
        return
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.')
        return
      }
    }

    setSaving(true)
    try {
      const response = await fetch('/api/account/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName: trimmedName,
          password: password || undefined,
        }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(data.error || 'No se pudo actualizar el perfil.')
      }

      setPassword('')
      setConfirmPassword('')
      setSuccess('Perfil actualizado correctamente.')
    } catch (submitError) {
      setError(submitError.message || 'No pudimos guardar los cambios.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="account-shell">
      <section className="account-hero">
        <div className="account-avatar">{user.avatar}</div>
        <div className="account-hero-copy">
          <p className="membership-kicker">Mi cuenta</p>
          <h1>{user.name}</h1>
          <p>{user.email}</p>
        </div>
        <div className="account-hero-actions">
          {user.isStaff ? (
            <Link href="/admin" prefetch={false} className="vk-button">
              Panel de control
            </Link>
          ) : null}
          <Link href="/logout" className="vk-button secondary">
            Cerrar sesión
          </Link>
        </div>
      </section>

      <section className="account-metrics">
        <article className="account-metric-card">
          <strong>{courses.length}</strong>
          <span>{metricLabel(courses.length, 'taller disponible', 'talleres disponibles')}</span>
        </article>
        <article className="account-metric-card">
          <strong>{memberships.length}</strong>
          <span>{metricLabel(memberships.length, 'membresía activa', 'membresías activas')}</span>
        </article>
        <article className="account-metric-card">
          <strong>{purchases.length}</strong>
          <span>{metricLabel(purchases.length, 'compra registrada', 'compras registradas')}</span>
        </article>
      </section>

      <div className="account-grid">
        <section className="membership-section">
          <h2>Membresías activas</h2>
          {memberships.length === 0 ? (
            <div className="membership-locked">Todavía no tenés membresías activas.</div>
          ) : (
            <div className="account-stack">
              {memberships.map((membership) => (
                <article key={membership.id} className="account-card">
                  <div className="account-card-header">
                    <div>
                      <h3>{membership.tierName}</h3>
                      {membership.description ? <p className="item-meta">{membership.description}</p> : null}
                    </div>
                    <span className="membership-pill active">Activa</span>
                  </div>
                  <div className="account-inline-meta">
                    {membership.startsAt ? <span>Inicio: {new Date(membership.startsAt).toLocaleDateString('es-AR')}</span> : null}
                    {membership.expiresAt ? (
                      <span>Vence: {new Date(membership.expiresAt).toLocaleDateString('es-AR')}</span>
                    ) : (
                      <span>Sin vencimiento</span>
                    )}
                  </div>
                  {membership.features?.length ? (
                    <ul className="membership-detail-list">
                      {membership.features.map((feature, index) => (
                        <li key={`${membership.id}-${index}`}>{feature}</li>
                      ))}
                    </ul>
                  ) : null}
                  {membership.href ? (
                    <Link href={membership.href} className="vk-button">
                      Ver membresía
                    </Link>
                  ) : null}
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="membership-section">
          <h2>Mis talleres</h2>
          {courses.length === 0 ? (
            <div className="membership-locked">Todavía no tenés talleres disponibles en tu cuenta.</div>
          ) : (
            <div className="account-stack">
              {courses.map((course) => (
                <article key={course.id} className="account-card">
                  <div className="account-card-header">
                    <div>
                      <h3>{course.title}</h3>
                      {course.subtitle ? <p className="item-meta">{course.subtitle}</p> : null}
                    </div>
                    <span className="membership-pill active">{course.accessLabel}</span>
                  </div>
                  <div className="account-inline-meta">
                    {course.lessonCount ? <span>{metricLabel(course.lessonCount, 'clase', 'clases')}</span> : null}
                    {course.sourceLabel ? <span>{course.sourceLabel}</span> : null}
                  </div>
                  <Link href={course.href} className="vk-button">
                    Entrar al curso
                  </Link>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      <div className="account-grid">
        <section className="membership-section">
          <h2>Historial de compras</h2>
          {purchases.length === 0 ? (
            <div className="membership-locked">Todavía no hay compras registradas.</div>
          ) : (
            <div className="account-stack">
              {purchases.map((purchase) => (
                <article key={purchase.id} className="account-card">
                  <div className="account-card-header">
                    <div>
                      <h3>{purchase.items}</h3>
                      <p className="item-meta">
                        {purchase.date ? new Date(purchase.date).toLocaleDateString('es-AR') : 'Sin fecha'}
                      </p>
                    </div>
                    <span className="membership-pill active">{purchase.status}</span>
                  </div>
                  <div className="account-inline-meta">
                    <span>Ref: {purchase.id}</span>
                    <span>${Number(purchase.total || 0).toLocaleString('es-AR')}</span>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>

        <section className="membership-section">
          <h2>Mi perfil</h2>
          <form className="account-form" onSubmit={handleSubmit}>
            <label className="account-field">
              <span>Nombre completo</span>
              <input value={fullName} onChange={(event) => setFullName(event.target.value)} required />
            </label>
            <label className="account-field">
              <span>Email</span>
              <input value={user.email} readOnly />
            </label>
            <label className="account-field">
              <span>Nueva contraseña</span>
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                minLength={8}
                placeholder="Dejala vacía si no querés cambiarla"
              />
            </label>
            <label className="account-field">
              <span>Repetir nueva contraseña</span>
              <input
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                placeholder="Repetí la contraseña nueva"
              />
            </label>
            {error ? <div className="lovable-message error">{error}</div> : null}
            {success ? <div className="lovable-message success">{success}</div> : null}
            <div className="account-form-actions">
              {user.isStaff ? (
                <Link href="/admin" prefetch={false} className="vk-button secondary">
                  Panel de control
                </Link>
              ) : null}
              <button type="submit" className="vk-button" disabled={saving}>
                {saving ? 'Guardando...' : 'Guardar cambios'}
              </button>
              <Link href="/logout" className="vk-button secondary">
                Cerrar sesión
              </Link>
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
