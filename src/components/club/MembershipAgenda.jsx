'use client'

import { useEffect, useMemo, useState } from 'react'

const MONTHS = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
]

function typeMeta(type) {
  if (type === 'live_class') return { label: 'Clase en vivo', dot: '#1d5f55' }
  if (type === 'content_release') return { label: 'Nuevo contenido', dot: '#5b3f79' }
  return { label: 'Evento', dot: '#a8763e' }
}

function fmtDay(d) {
  return d.toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })
}
function fmtTime(d) {
  return d.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })
}
function fmtFull(d) {
  return d.toLocaleString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' })
}

function Countdown({ target }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(t)
  }, [])

  const diff = Math.max(0, target - now)
  const live = diff === 0
  const d = Math.floor(diff / 86400000)
  const h = Math.floor((diff / 3600000) % 24)
  const m = Math.floor((diff / 60000) % 60)
  const s = Math.floor((diff / 1000) % 60)

  if (live) return <span className="club-live-now">● En vivo ahora</span>

  return (
    <div className="club-countdown">
      {d > 0 && <span><strong>{d}</strong>d</span>}
      <span><strong>{String(h).padStart(2, '0')}</strong>h</span>
      <span><strong>{String(m).padStart(2, '0')}</strong>m</span>
      <span><strong>{String(s).padStart(2, '0')}</strong>s</span>
    </div>
  )
}

export default function MembershipAgenda({ events = [] }) {
  // Normalizamos a objetos con Date y filtramos cancelados.
  const parsed = useMemo(() => {
    return (events || [])
      .filter((e) => e.status !== 'cancelled')
      .map((e) => ({ ...e, start: new Date(e.starts_at), end: e.ends_at ? new Date(e.ends_at) : null }))
      .filter((e) => !Number.isNaN(e.start.getTime()))
      .sort((a, b) => a.start - b.start)
  }, [events])

  const [nowRef] = useState(() => new Date())
  const now = nowRef.getTime()

  const monthName = MONTHS[nowRef.getMonth()]
  const monthEvents = parsed.filter(
    (e) => e.start.getMonth() === nowRef.getMonth() && e.start.getFullYear() === nowRef.getFullYear()
  )
  const upcoming = parsed.filter((e) => e.start.getTime() >= now)
  const nextLive = upcoming.find((e) => e.event_type === 'live_class')

  if (parsed.length === 0) return null

  return (
    <div className="club-agenda">
      <div className="club-agenda-heading">
        <span className="club-agenda-eyebrow">Tu agenda</span>
        <h2>Qué se viene en el Club</h2>
      </div>

      {/* Barra horizontal: Agenda del Mes | Próximos acontecimientos */}
      <div className="club-agenda-bar">
        <section className="club-agenda-panel">
          <header className="club-agenda-head">
            <h3><span className="club-agenda-ic" aria-hidden="true">🗓</span> Agenda del mes</h3>
            <span className="club-agenda-month">{monthName}</span>
          </header>
          {monthEvents.length === 0 ? (
            <p className="club-agenda-empty">No hay eventos cargados este mes.</p>
          ) : (
            <ul className="club-agenda-list">
              {monthEvents.map((e) => {
                const meta = typeMeta(e.event_type)
                const isPast = e.start.getTime() < now
                return (
                  <li key={e.id} className={`club-agenda-item${isPast ? ' is-past' : ''}`}>
                    <span className="club-agenda-date">
                      <strong>{e.start.toLocaleDateString('es-AR', { day: '2-digit' })}</strong>
                      <small>{e.start.toLocaleDateString('es-AR', { month: 'short' })}</small>
                    </span>
                    <span className="club-agenda-body">
                      <span className="club-agenda-title">{e.title}</span>
                      <span className="club-agenda-meta">
                        <span className="club-dot" style={{ background: meta.dot }} />
                        {meta.label} · {fmtTime(e.start)}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>

        <section className="club-agenda-panel">
          <header className="club-agenda-head">
            <h3><span className="club-agenda-ic" aria-hidden="true">✨</span> Próximos acontecimientos</h3>
          </header>
          {upcoming.length === 0 ? (
            <p className="club-agenda-empty">Pronto vamos a anunciar nuevas fechas.</p>
          ) : (
            <ul className="club-agenda-list">
              {upcoming.slice(0, 6).map((e) => {
                const meta = typeMeta(e.event_type)
                return (
                  <li key={e.id} className="club-agenda-item">
                    <span className="club-agenda-date">
                      <strong>{e.start.toLocaleDateString('es-AR', { day: '2-digit' })}</strong>
                      <small>{e.start.toLocaleDateString('es-AR', { month: 'short' })}</small>
                    </span>
                    <span className="club-agenda-body">
                      <span className="club-agenda-title">{e.title}</span>
                      <span className="club-agenda-meta">
                        <span className="club-dot" style={{ background: meta.dot }} />
                        {meta.label} · {fmtTime(e.start)}
                      </span>
                    </span>
                  </li>
                )
              })}
            </ul>
          )}
        </section>
      </div>

      {/* Próxima clase en vivo (full width, solo si existe) */}
      {nextLive && (
        <section className="club-next-live">
          <div className="club-next-live-info">
            <span className="club-next-live-tag">Próxima clase en vivo</span>
            <h3 className="club-next-live-title">{nextLive.title}</h3>
            <p className="club-next-live-when">{fmtFull(nextLive.start)} hs</p>
            {nextLive.description && <p className="club-next-live-desc">{nextLive.description}</p>}
          </div>
          <div className="club-next-live-action">
            <Countdown target={nextLive.start.getTime()} />
            {nextLive.location_url && (
              <a
                className="club-next-live-cta"
                href={nextLive.location_url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Entrar a la clase →
              </a>
            )}
          </div>
        </section>
      )}
    </div>
  )
}
