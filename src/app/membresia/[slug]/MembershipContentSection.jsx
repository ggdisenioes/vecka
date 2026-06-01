'use client'

import { useMemo, useState } from 'react'

// Short tab labels (month only) — content name shows in the header
const TAB_LABELS = {
  'mi-club':   'Mi Club',
  'noviembre': 'Noviembre',
  'diciembre': 'Diciembre',
  'enero':     'Enero',
  'febrero':   'Febrero',
  'marzo':     'Marzo',
  'abril':     'Abril',
  'mayo':      'Mayo',
}

// Subtitle shown under the category name in the header
const PROJECT_NAMES = {
  'mi-club':   'Bienvenida · Cosé desde Cero',
  'noviembre': 'Vestido Bohemio',
  'diciembre': 'Traje de baño',
  'enero':     'Mini Tote Bag',
  'febrero':   'Conjunto deportivo',
  'marzo':     'Camisa clásica',
  'abril':     'Campera Bomber',
  'mayo':      'Trench Corto',
}

function DownloadIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
      <line x1="12" y1="18" x2="12" y2="12"/>
      <polyline points="9 15 12 18 15 15"/>
    </svg>
  )
}

export default function MembershipContentSection({ items, categories }) {
  const sortedCats = useMemo(
    () => [...(categories || [])].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0)),
    [categories]
  )

  const [activeId, setActiveId] = useState(() => {
    if (sortedCats.length === 0) return 'all'
    return sortedCats[0].id
  })

  const filteredItems = useMemo(() => {
    if (activeId === 'all') return items || []
    return (items || []).filter((i) => i.category_id === activeId)
  }, [activeId, items])

  const videos   = filteredItems.filter((i) => i.type === 'embed')
  const downloads = filteredItems.filter((i) => i.type === 'download')
  const others   = filteredItems.filter((i) => i.type !== 'embed' && i.type !== 'download')

  const activeCat  = sortedCats.find((c) => c.id === activeId)
  const tabLabel   = activeCat ? (TAB_LABELS[activeCat.slug] || activeCat.name) : ''
  const projectName = activeCat ? (PROJECT_NAMES[activeCat.slug] || '') : ''

  if ((items || []).length === 0) {
    return <div className="membership-locked">Aún no hay contenido publicado. Volvé pronto.</div>
  }

  return (
    <div className="club-wrap">
      {/* ── Tab bar ── */}
      <nav className="club-tabs-bar" aria-label="Meses del Club">
        {sortedCats.map((cat) => {
          const label = TAB_LABELS[cat.slug] || cat.name
          const isActive = cat.id === activeId
          return (
            <button
              key={cat.id}
              type="button"
              className={`club-tab${isActive ? ' is-active' : ''}`}
              onClick={() => setActiveId(cat.id)}
              aria-current={isActive ? 'page' : undefined}
            >
              {label}
            </button>
          )
        })}
      </nav>

      {/* ── Month header ── */}
      {activeCat && (
        <header className="club-month-header">
          <div>
            <h2 className="club-month-name">{tabLabel}</h2>
            {projectName && <p className="club-month-project">{projectName}</p>}
          </div>
          <span className="club-month-count">
            {videos.length > 0 && `${videos.length} ${videos.length === 1 ? 'clase' : 'clases'}`}
            {videos.length > 0 && downloads.length > 0 && ' · '}
            {downloads.length > 0 && `${downloads.length} ${downloads.length === 1 ? 'descarga' : 'descargas'}`}
          </span>
        </header>
      )}

      {filteredItems.length === 0 ? (
        <div className="club-empty">Próximamente — volvé cuando esté disponible.</div>
      ) : (
        <div className="club-content">

          {/* ── Videos ── */}
          {videos.length > 0 && (
            <section className="club-block">
              <h3 className="club-block-label">Clases</h3>
              <div className="club-video-grid">
                {videos.map((item) => (
                  <div key={item.id} className="club-video-card">
                    <div className="club-video-player">
                      <iframe
                        src={item.media_url}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={item.title}
                        loading="lazy"
                      />
                    </div>
                    <div className="club-video-info">
                      <p className="club-video-title">{item.title}</p>
                      {item.summary && <p className="club-video-note">{item.summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* ── Text items (Próximamente, etc.) ── */}
          {others.length > 0 && (
            <section className="club-block">
              {others.map((item) => (
                <div key={item.id} className="club-coming-soon">
                  <p className="club-video-title">{item.title}</p>
                  {item.summary && <p className="club-video-note">{item.summary}</p>}
                </div>
              ))}
            </section>
          )}

          {/* ── Downloads ── */}
          {downloads.length > 0 && (
            <section className="club-block">
              <h3 className="club-block-label">Moldes y materiales</h3>
              <div className="club-dl-grid">
                {downloads.map((item) => (
                  <a
                    key={item.id}
                    href={item.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="club-dl-card"
                  >
                    <span className="club-dl-icon" aria-hidden="true"><DownloadIcon /></span>
                    <div className="club-dl-text">
                      <span className="club-dl-name">{item.title}</span>
                      {item.summary && <span className="club-dl-sub">{item.summary}</span>}
                    </div>
                    <span className="club-dl-cta">PDF ↓</span>
                  </a>
                ))}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  )
}
