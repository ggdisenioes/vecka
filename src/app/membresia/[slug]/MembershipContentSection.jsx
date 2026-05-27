'use client'

import { useMemo, useState } from 'react'

function RichBody({ html }) {
  if (!html) return null
  return <div className="article-body" dangerouslySetInnerHTML={{ __html: html }} />
}

function contentTypeLabel(type) {
  if (type === 'download') return 'Descargable'
  if (type === 'image') return 'Imagen'
  if (type === 'link') return 'Link'
  if (type === 'embed') return 'Video'
  return 'Texto'
}

export default function MembershipContentSection({ items, categories }) {
  const [activeCategory, setActiveCategory] = useState('all')

  const availableCategories = useMemo(() => {
    const categoryMap = new Map((categories || []).map((category) => [category.id, category]))
    const counts = new Map()
    let uncategorizedCount = 0

    for (const item of items || []) {
      if (item.category_id && categoryMap.has(item.category_id)) {
        counts.set(item.category_id, (counts.get(item.category_id) || 0) + 1)
      } else {
        uncategorizedCount += 1
      }
    }

    const result = []
    for (const category of categories || []) {
      const count = counts.get(category.id) || 0
      if (count > 0) result.push({ id: category.id, name: category.name, count })
    }
    if (uncategorizedCount > 0) {
      result.push({ id: 'uncategorized', name: 'Sin categoría', count: uncategorizedCount })
    }
    return result
  }, [categories, items])

  const filteredItems = useMemo(() => {
    if (activeCategory === 'all') return items || []
    if (activeCategory === 'uncategorized') {
      return (items || []).filter((item) => !item.category_id)
    }
    return (items || []).filter((item) => item.category_id === activeCategory)
  }, [activeCategory, items])

  return (
    <section className="membership-section">
      <div className="membership-section-header">
        <div>
          <h2>Contenido exclusivo</h2>
          <p className="item-meta" style={{ marginTop: 6 }}>
            Filtrá por categoría para encontrar más rápido lo que necesitás.
          </p>
        </div>
      </div>

      {availableCategories.length > 0 ? (
        <div className="membership-filter-row">
          <button
            type="button"
            className={`membership-filter-chip${activeCategory === 'all' ? ' active' : ''}`}
            onClick={() => setActiveCategory('all')}
          >
            Todo <span>{items.length}</span>
          </button>
          {availableCategories.map((category) => (
            <button
              key={category.id}
              type="button"
              className={`membership-filter-chip${activeCategory === category.id ? ' active' : ''}`}
              onClick={() => setActiveCategory(category.id)}
            >
              {category.name} <span>{category.count}</span>
            </button>
          ))}
        </div>
      ) : null}

      {filteredItems.length === 0 ? (
        <div className="membership-locked" style={{ marginTop: 12 }}>
          No hay contenido en esta categoría todavía.
        </div>
      ) : (
        <div className="membership-content-grid">
          {filteredItems.map((item) => {
            const privateFileUrl = item.storage_path ? `/api/membership-content/${item.id}` : null
            const mediaHref = privateFileUrl || item.media_url
            const category = categories.find((entry) => entry.id === item.category_id)
            return (
              <article key={item.id} className={`membership-resource-card type-${item.type || 'text'}`}>
                <div className="item-meta">
                  {contentTypeLabel(item.type)}
                  {category?.name ? ` · ${category.name}` : ''}
                </div>
                <h3>{item.title}</h3>
                {item.summary ? <p>{item.summary}</p> : null}

                {item.type === 'image' && mediaHref ? (
                  <img src={mediaHref} alt={item.title} className="membership-resource-image" />
                ) : null}

                {item.type === 'embed' && item.media_url ? (
                  <div className="video-frame">
                    <iframe src={item.media_url} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />
                  </div>
                ) : null}

                {item.body ? <RichBody html={item.body} /> : null}

                {item.type === 'download' && mediaHref ? (
                  <a className="membership-cta secondary" href={mediaHref} target="_blank" rel="noopener noreferrer">
                    Descargar {item.file_name || 'archivo'}
                  </a>
                ) : null}

                {item.type === 'link' && item.media_url ? (
                  <a className="membership-cta secondary" href={item.media_url} target="_blank" rel="noopener noreferrer">
                    Abrir recurso
                  </a>
                ) : null}
              </article>
            )
          })}
        </div>
      )}
    </section>
  )
}
