'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const defaultForm = {
  name: '',
  description: '',
  priceArs: '',
  billingPeriod: 'monthly',
  trialDays: '0',
  features: [
    'Acceso al contenido exclusivo de la membresía',
    'Materiales descargables',
    'Actualizaciones durante el período activo',
  ].join('\n'),
  isFeatured: false,
}

function featuresFromText(value) {
  return String(value || '')
    .split('\n')
    .map((item) => item.trim())
    .filter(Boolean)
}

export default function NewTierButton() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(defaultForm)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  function update(key) {
    return (event) => {
      const value = event.target.type === 'checkbox' ? event.target.checked : event.target.value
      setForm((current) => ({ ...current, [key]: value }))
    }
  }

  function close() {
    if (loading) return
    setOpen(false)
    setError(null)
    setForm(defaultForm)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const response = await fetch('/api/admin/membership-tiers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name || 'Membresía sin título',
          description: form.description,
          priceArs: Number(form.priceArs || 0),
          billingPeriod: form.billingPeriod,
          trialDays: Number(form.trialDays || 0),
          features: featuresFromText(form.features),
          isFeatured: form.isFeatured,
        }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data?.error || 'No se pudo crear la membresía')
      router.push(`/admin/membresias/${data.tier.id}`)
    } catch (err) {
      setError(err.message || 'Error al crear la membresía')
      setLoading(false)
    }
  }

  return (
    <>
      <button type="button" className="admin-button" onClick={() => setOpen(true)} disabled={loading}>
        Nueva membresía
      </button>

      {open ? (
        <div className="modal-backdrop" role="dialog" aria-modal="true" aria-labelledby="new-tier-title">
          <div className="modal-box">
            <div className="modal-header">
              <h2 id="new-tier-title">Nueva membresía</h2>
              <button type="button" className="modal-close" onClick={close} aria-label="Cerrar">
                ×
              </button>
            </div>

            <form className="modal-body" onSubmit={handleSubmit}>
              <div className="editor-field">
                <label>Nombre del plan</label>
                <input
                  value={form.name}
                  onChange={update('name')}
                  placeholder="Ej: Club VeCKA anual"
                  autoFocus
                  required
                />
              </div>

              <div className="editor-field">
                <label>Descripción pública</label>
                <textarea
                  rows={3}
                  value={form.description}
                  onChange={update('description')}
                  placeholder="Resumen breve de lo que incluye esta membresía"
                />
              </div>

              <div className="editor-row">
                <div className="editor-field">
                  <label>Precio ARS</label>
                  <input
                    type="number"
                    min="0"
                    value={form.priceArs}
                    onChange={update('priceArs')}
                    placeholder="0"
                  />
                </div>
                <div className="editor-field">
                  <label>Período</label>
                  <select value={form.billingPeriod} onChange={update('billingPeriod')}>
                    <option value="monthly">Mensual</option>
                    <option value="annual">Anual</option>
                    <option value="lifetime">Vitalicia</option>
                    <option value="one_time">Pago único</option>
                  </select>
                </div>
                <div className="editor-field">
                  <label>Días de prueba</label>
                  <input
                    type="number"
                    min="0"
                    value={form.trialDays}
                    onChange={update('trialDays')}
                  />
                </div>
              </div>

              <div className="editor-field">
                <label>Beneficios</label>
                <textarea
                  rows={4}
                  value={form.features}
                  onChange={update('features')}
                />
              </div>

              <label className="editor-field" style={{ flexDirection: 'row', alignItems: 'center' }}>
                <input
                  type="checkbox"
                  checked={form.isFeatured}
                  onChange={update('isFeatured')}
                  style={{ width: 'auto' }}
                />
                <span>Plan destacado</span>
              </label>

              {error ? <p className="modal-error">{error}</p> : null}

              <div className="modal-footer">
                <button type="button" className="admin-button ghost" onClick={close} disabled={loading}>
                  Cancelar
                </button>
                <button type="submit" className="admin-button" disabled={loading}>
                  {loading ? 'Creando…' : 'Crear y configurar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </>
  )
}
