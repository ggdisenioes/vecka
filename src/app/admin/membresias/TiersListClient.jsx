'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Todos los estados' },
  { value: 'draft', label: 'Borradores' },
  { value: 'published', label: 'Publicadas' },
  { value: 'archived', label: 'Archivadas' },
]

function normalize(value) {
  return String(value || '').toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '')
}

export default function TiersListClient({ tiers }) {
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')

  const filtered = useMemo(() => {
    const q = normalize(query.trim())
    return (tiers || []).filter((tier) => {
      if (statusFilter !== 'all' && tier.status !== statusFilter) return false
      if (!q) return true
      const haystack = `${normalize(tier.name)} ${normalize(tier.description)} ${normalize(tier.slug)}`
      return haystack.includes(q)
    })
  }, [tiers, query, statusFilter])

  const hasTiers = (tiers || []).length > 0
  const hasResults = filtered.length > 0

  return (
    <>
      <div className="admin-toolbar">
        <input
          type="search"
          className="admin-search"
          placeholder="Buscar por nombre o descripción…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select
          className="admin-select"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
        {(query || statusFilter !== 'all') && (
          <button
            type="button"
            className="admin-button ghost"
            onClick={() => { setQuery(''); setStatusFilter('all') }}
          >
            Limpiar
          </button>
        )}
        <span className="admin-toolbar-count">
          {filtered.length} de {tiers?.length || 0}
        </span>
      </div>

      {!hasTiers ? (
        <div className="empty-state">
          Todavía no hay niveles de membresía. Hacé clic en <strong>Nueva membresía</strong> para crear el primero.
        </div>
      ) : !hasResults ? (
        <div className="empty-state">
          No hay membresías que coincidan con tu búsqueda.
        </div>
      ) : (
        <div className="admin-grid">
          {filtered.map((tier) => (
            <Link
              key={tier.id}
              href={`/admin/membresias/${tier.id}`}
              className="course-card"
            >
              <div className="title" style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                {tier.name}
                {tier.is_featured && <span style={{ fontSize: 11, background: '#cce5ff', color: '#004085', borderRadius: 4, padding: '1px 6px', fontWeight: 600 }}>Destacada</span>}
              </div>
              {tier.price_ars > 0 && (
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 15, fontWeight: 700, color: 'var(--accent-deep)', margin: '4px 0' }}>
                  ${tier.price_ars.toLocaleString('es-AR')} ARS
                  <span style={{ fontSize: 12, fontWeight: 400, color: 'var(--muted)', marginLeft: 6 }}>
                    / {tier.billing_period === 'monthly' ? 'mes' : tier.billing_period === 'annual' ? 'año' : tier.billing_period === 'lifetime' ? 'vitalicia' : 'único'}
                  </span>
                </div>
              )}
              <div className="meta">
                <span className={`status-pill ${tier.status}`}>
                  {tier.status === 'published' ? 'Publicada' : tier.status === 'archived' ? 'Archivada' : 'Borrador'}
                </span>
                <span className={`status-pill ${tier.course_count ? 'catalog' : 'draft'}`}>
                  {tier.course_count || 0} cursos
                </span>
                <span className={`status-pill ${tier.content_count ? 'catalog' : 'draft'}`}>
                  {tier.content_count || 0} recursos
                </span>
                <span className={`status-pill ${tier.published_count ? 'published' : 'draft'}`}>
                  {tier.published_count || 0} publicados
                </span>
                <span className="status-pill catalog">
                  {tier.active_members || 0} {tier.active_members === 1 ? 'miembro activo' : 'miembros activos'}
                </span>
              </div>
              {tier.description && (
                <div className="meta" style={{ color: 'var(--muted)' }}>
                  {tier.description.slice(0, 100)}{tier.description.length > 100 ? '…' : ''}
                </div>
              )}
              <div className="card-footer">
                Actualizado {tier.updated_at ? new Date(tier.updated_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  )
}
