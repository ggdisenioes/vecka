'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewTierButton() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  async function handleClick() {
    if (loading) return
    const name = window.prompt('Nombre de la membresía:', 'Membresía sin título')
    if (name === null) return
    setLoading(true)
    try {
      const response = await fetch('/api/admin/membership-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name || 'Membresía sin título' }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'No se pudo crear la membresía')
      router.push(`/admin/membresias/${data.tier.id}`)
    } catch (error) {
      alert(error.message || 'Error al crear la membresía')
      setLoading(false)
    }
  }

  return (
    <button type="button" className="admin-button" onClick={handleClick} disabled={loading}>
      {loading ? 'Creando…' : 'Nueva membresía'}
    </button>
  )
}
