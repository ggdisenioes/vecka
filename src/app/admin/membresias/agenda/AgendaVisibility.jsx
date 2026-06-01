'use client'

import { useState } from 'react'

function Toggle({ checked, onChange, disabled, label, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, padding: '16px 0', borderBottom: '1px solid #ece3da' }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        disabled={disabled}
        aria-pressed={checked}
        style={{
          flexShrink: 0,
          width: 46,
          height: 26,
          borderRadius: 13,
          border: 'none',
          cursor: disabled ? 'wait' : 'pointer',
          background: checked ? '#1d5f55' : '#d0c8c0',
          position: 'relative',
          transition: 'background 0.2s',
          marginTop: 2,
        }}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 20,
          height: 20,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
      <div>
        <div style={{ fontSize: 14, fontWeight: 600, color: '#2a2420' }}>
          {label} <span style={{ fontWeight: 500, color: checked ? '#1d5f55' : '#a8763e' }}>· {checked ? 'Visible' : 'Oculto'}</span>
        </div>
        {description && <div style={{ fontSize: 13, color: '#8a7f78', marginTop: 3 }}>{description}</div>}
      </div>
    </div>
  )
}

export default function AgendaVisibility({ initialAgendaVisible = true, initialNextLiveVisible = true }) {
  const [agendaVisible, setAgendaVisible] = useState(initialAgendaVisible)
  const [nextLiveVisible, setNextLiveVisible] = useState(initialNextLiveVisible)
  const [saving, setSaving] = useState(null)
  const [toast, setToast] = useState('')

  async function save(patch, optimistic) {
    setSaving(Object.keys(patch)[0])
    setToast('')
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(patch),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || 'No se pudo guardar')
      }
      setToast('Cambios guardados ✓')
      setTimeout(() => setToast(''), 2500)
    } catch (err) {
      // revertir
      optimistic()
      setToast(err.message)
    } finally {
      setSaving(null)
    }
  }

  function toggleAgenda(value) {
    setAgendaVisible(value)
    save({ clubAgendaVisible: value }, () => setAgendaVisible(!value))
  }
  function toggleNextLive(value) {
    setNextLiveVisible(value)
    save({ clubNextLiveVisible: value }, () => setNextLiveVisible(!value))
  }

  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{ fontSize: 16, margin: '0 0 4px' }}>Visibilidad en la página del Club</h2>
      <p style={{ color: '#596567', fontSize: 13, margin: '0 0 8px' }}>
        Activá o desactivá cada bloque. Si están ocultos, las socias no los ven aunque haya eventos cargados.
      </p>
      <Toggle
        checked={agendaVisible}
        onChange={toggleAgenda}
        disabled={saving === 'clubAgendaVisible'}
        label="Agenda del mes y próximos acontecimientos"
        description="La barra con los dos paneles de eventos."
      />
      <Toggle
        checked={nextLiveVisible}
        onChange={toggleNextLive}
        disabled={saving === 'clubNextLiveVisible'}
        label="Próxima clase en vivo"
        description="El banner verde con la cuenta regresiva y el botón para entrar."
      />
      {toast && (
        <p style={{ fontSize: 13, color: toast.includes('✓') ? '#1d5f55' : '#b85c5c', marginTop: 10 }}>{toast}</p>
      )}
    </div>
  )
}
