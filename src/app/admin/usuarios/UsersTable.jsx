'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const ROLE_COLORS = {
  admin: { bg: '#fde8e8', color: '#7b1a1a' },
  editorial: { bg: '#eef2ff', color: '#1a3a6e' },
  student: { bg: '#d4f0e6', color: '#2e7d6a' },
}

export default function UsersTable({ initialUsers, initialTotal, initialSearch, initialRole, initialPage, pageSize, roleLabels }) {
  const router = useRouter()
  const [users, setUsers] = useState(initialUsers)
  const [total, setTotal] = useState(initialTotal)
  const [search, setSearch] = useState(initialSearch)
  const [role, setRole] = useState(initialRole)
  const [page, setPage] = useState(initialPage)
  const [loading, setLoading] = useState(false)

  const load = useCallback(async ({ s = search, r = role, p = page } = {}) => {
    setLoading(true)
    const params = new URLSearchParams()
    if (s) params.set('search', s)
    if (r) params.set('role', r)
    if (p) params.set('page', String(p))

    const res = await fetch(`/api/admin/users?${params}`)
    const data = await res.json()
    setUsers(data.profiles || [])
    setTotal(data.total || 0)
    setLoading(false)

    // Update URL without navigation
    const url = `/admin/usuarios${params.toString() ? '?' + params : ''}`
    router.replace(url, { scroll: false })
  }, [search, role, page, router])

  function handleSearch(e) {
    const val = e.target.value
    setSearch(val)
    setPage(0)
    load({ s: val, r: role, p: 0 })
  }

  function handleRole(val) {
    setRole(val)
    setPage(0)
    load({ s: search, r: val, p: 0 })
  }

  function handlePage(p) {
    setPage(p)
    load({ s: search, r: role, p })
  }

  const initials = (p) => {
    const name = p.display_name || p.full_name || p.email || '?'
    return name.split(' ').map((n) => n[0]?.toUpperCase()).filter(Boolean).slice(0, 2).join('')
  }

  const totalPages = Math.ceil(total / pageSize)

  return (
    <div>
      {/* Filters */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 18, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          type="search"
          placeholder="Buscar por nombre o email…"
          value={search}
          onChange={handleSearch}
          style={{ padding: '9px 14px', border: '1px solid #d0c8c0', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: 280, background: '#fff' }}
        />
        <div style={{ display: 'flex', gap: 6 }}>
          {[['', 'Todos'], ['admin', 'Admin'], ['editorial', 'Editorial'], ['student', 'Alumnas']].map(([val, label]) => (
            <button
              key={val}
              onClick={() => handleRole(val)}
              style={{
                padding: '7px 14px', border: '1px solid', borderRadius: 20, cursor: 'pointer',
                fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: role === val ? 700 : 400,
                background: role === val ? '#5e9e8a' : '#fff',
                borderColor: role === val ? '#5e9e8a' : '#d0c8c0',
                color: role === val ? '#fff' : 'var(--ink)',
              }}
            >{label}</button>
          ))}
        </div>
        <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', marginLeft: 'auto' }}>
          {total.toLocaleString('es-AR')} usuario{total !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Table */}
      <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden', opacity: loading ? 0.6 : 1, transition: 'opacity .2s' }}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 100px 80px 90px 60px', padding: '11px 20px', background: 'oklch(96% 0.012 60)', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, color: 'var(--muted)', letterSpacing: '0.06em', textTransform: 'uppercase', gap: 12 }}>
          <div />
          {['Nombre / Email', 'Email', 'Rol', 'Cursos', 'Membresía', ''].map((h, i) => <div key={i}>{h}</div>)}
        </div>

        {users.length === 0 ? (
          <div style={{ padding: '32px 20px', textAlign: 'center', fontFamily: 'DM Sans, sans-serif', color: 'var(--muted)', fontSize: 14 }}>
            {search || role ? 'No hay usuarios que coincidan.' : 'No hay usuarios registrados.'}
          </div>
        ) : (
          users.map((u) => {
            const rc = ROLE_COLORS[u.role] || ROLE_COLORS.student
            return (
              <div
                key={u.id}
                style={{ display: 'grid', gridTemplateColumns: '40px 1fr 1fr 100px 80px 90px 60px', padding: '13px 20px', borderTop: '1px solid oklch(93% 0.01 60)', alignItems: 'center', gap: 12, cursor: 'pointer', transition: 'background .12s' }}
                onMouseEnter={(e) => e.currentTarget.style.background = '#faf9f8'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                onClick={() => router.push(`/admin/usuarios/${u.id}`)}
              >
                {/* Avatar */}
                <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Cormorant Garamond, serif', fontSize: 14, fontWeight: 700, color: '#fff', flexShrink: 0 }}>
                  {initials(u)}
                </div>
                {/* Name */}
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {u.display_name || u.full_name || '—'}
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 12, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    Desde {new Date(u.created_at).toLocaleDateString('es-AR', { day: 'numeric', month: 'short', year: 'numeric' })}
                  </div>
                </div>
                {/* Email */}
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {u.email}
                </div>
                {/* Role */}
                <div>
                  <span style={{ fontSize: 11, padding: '2px 9px', borderRadius: 20, fontWeight: 700, background: rc.bg, color: rc.color }}>
                    {roleLabels[u.role] || u.role}
                  </span>
                </div>
                {/* Courses */}
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: u.courseCount > 0 ? 700 : 400, color: u.courseCount > 0 ? '#2e7d6a' : 'var(--muted)' }}>
                  {u.courseCount > 0 ? `${u.courseCount} curso${u.courseCount !== 1 ? 's' : ''}` : '—'}
                </div>
                {/* Membership */}
                <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: u.membershipCount > 0 ? 700 : 400, color: u.membershipCount > 0 ? '#1a3a6e' : 'var(--muted)' }}>
                  {u.membershipCount > 0 ? `${u.membershipCount} activa${u.membershipCount !== 1 ? 's' : ''}` : '—'}
                </div>
                {/* Arrow */}
                <div style={{ color: 'var(--muted)', fontSize: 16, textAlign: 'right' }}>›</div>
              </div>
            )
          })
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 20 }}>
          <button disabled={page === 0} onClick={() => handlePage(page - 1)} style={{ padding: '7px 16px', border: '1px solid #d0c8c0', borderRadius: 8, cursor: page === 0 ? 'not-allowed' : 'pointer', background: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>← Anterior</button>
          <span style={{ padding: '7px 14px', fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)' }}>{page + 1} / {totalPages}</span>
          <button disabled={page >= totalPages - 1} onClick={() => handlePage(page + 1)} style={{ padding: '7px 16px', border: '1px solid #d0c8c0', borderRadius: 8, cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer', background: '#fff', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}>Siguiente →</button>
        </div>
      )}
    </div>
  )
}
