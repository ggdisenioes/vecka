'use client'

import { useMemo, useState } from 'react'

const MONTH_SUBTITLES = {
  'mi-club': 'Bienvenida al Club · Cosé desde Cero',
  'noviembre': 'Vestido Bohemio · talles 38 al 58',
  'diciembre': 'Traje de baño · talles 38 al 58',
  'enero': 'Mini Tote Bag · proyecto especial',
  'febrero': 'Conjunto deportivo · talles 38 al 58',
  'marzo': 'Camisa clásica · talles 38 al 58',
  'abril': 'Campera Bomber · talles 38 al 58',
  'mayo': 'Trench Corto · próximamente',
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
    return (items || []).filter((item) => item.category_id === activeId)
  }, [activeId, items])

  const videos = filteredItems.filter((i) => i.type === 'embed')
  const downloads = filteredItems.filter((i) => i.type === 'download')
  const others = filteredItems.filter((i) => i.type !== 'embed' && i.type !== 'download')

  const activeCat = sortedCats.find((c) => c.id === activeId)
  const subtitle = activeCat ? MONTH_SUBTITLES[activeCat.slug] : null

  if ((items || []).length === 0) {
    return (
      <div className="membership-locked">Aún no hay contenido publicado. Volvé pronto.</div>
    )
  }

  return (
    <section className="membership-section" style={{ paddingTop: 0 }}>
      {/* Month tabs — scrollable horizontal row */}
      <div className="club-month-tabs-wrap">
        <div className="club-month-tabs">
          {sortedCats.map((cat) => (
            <button
              key={cat.id}
              type="button"
              className={`club-month-tab${activeId === cat.id ? ' active' : ''}`}
              onClick={() => setActiveId(cat.id)}
            >
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      {/* Active month header */}
      {activeCat && (
        <div className="club-month-header">
          <h2 className="club-month-title">{activeCat.name}</h2>
          {subtitle && <p className="club-month-subtitle">{subtitle}</p>}
        </div>
      )}

      {filteredItems.length === 0 ? (
        <div className="membership-locked" style={{ marginTop: 12 }}>
          No hay contenido en esta sección todavía.
        </div>
      ) : (
        <>
          {/* Videos / Clases en Vivo */}
          {videos.length > 0 && (
            <div className="club-content-block">
              <h3 className="club-block-title">Clases</h3>
              <div className="club-video-grid">
                {videos.map((item) => (
                  <div key={item.id} className="club-video-card">
                    <div className="club-video-frame">
                      <iframe
                        src={item.media_url}
                        allow="autoplay; fullscreen; picture-in-picture"
                        allowFullScreen
                        title={item.title}
                      />
                    </div>
                    <div className="club-video-meta">
                      <p className="club-video-title">{item.title}</p>
                      {item.summary && <p className="club-video-summary">{item.summary}</p>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Text items (Mayo "próximamente", etc.) */}
          {others.length > 0 && (
            <div className="club-content-block">
              {others.map((item) => (
                <div key={item.id} className="club-text-card">
                  <p className="club-video-title">{item.title}</p>
                  {item.summary && <p className="club-video-summary">{item.summary}</p>}
                </div>
              ))}
            </div>
          )}

          {/* PDFs / Descargas */}
          {downloads.length > 0 && (
            <div className="club-content-block">
              <h3 className="club-block-title">Moldes y materiales</h3>
              <div className="club-downloads-grid">
                {downloads.map((item) => (
                  <a
                    key={item.id}
                    href={item.media_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="club-download-card"
                  >
                    <span className="club-download-icon">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                        <polyline points="14 2 14 8 20 8"/>
                        <line x1="12" y1="18" x2="12" y2="12"/>
                        <polyline points="9 15 12 18 15 15"/>
                      </svg>
                    </span>
                    <div className="club-download-info">
                      <span className="club-download-name">{item.title}</span>
                      {item.summary && <span className="club-download-desc">{item.summary}</span>}
                    </div>
                    <span className="club-download-action">Descargar PDF</span>
                  </a>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}
