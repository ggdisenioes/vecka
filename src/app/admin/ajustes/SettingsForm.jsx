'use client'

import { useState } from 'react'

const inputStyle = { padding: '9px 12px', border: '1px solid #d0c8c0', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: '100%', boxSizing: 'border-box', background: '#fff' }
const labelStyle = { fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: 'var(--muted)', marginBottom: 4, display: 'block' }
const sectionTitle = { fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginTop: 0, marginBottom: 18 }

export default function SettingsForm({ initialSettings: s }) {
  const [form, setForm] = useState({
    bankHolderName: s.bank_holder_name || '',
    bankCbu: s.bank_cbu || '',
    bankAlias: s.bank_alias || '',
    bankContactEmail: s.bank_contact_email || '',
    bankContactWhatsapp: s.bank_contact_whatsapp || '',
    checkoutNote: s.checkout_note || '',
  })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function field(key) {
    return (e) => setForm((f) => ({ ...f, [key]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Error al guardar')
      setMsg({ type: 'success', text: 'Ajustes guardados correctamente.' })
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      {msg && (
        <div style={{ padding: '12px 18px', borderRadius: 10, marginBottom: 18, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, background: msg.type === 'error' ? '#fde8e8' : '#d4f0e6', color: msg.type === 'error' ? '#7b1a1a' : '#2e7d6a' }}>
          {msg.text}
        </div>
      )}

      {/* Bank transfer */}
      <div style={{ background: '#fff', borderRadius: 14, padding: '24px 26px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 20 }}>
        <h3 style={sectionTitle}>Transferencia bancaria</h3>
        <p style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: 'var(--muted)', marginTop: -10, marginBottom: 18 }}>
          Estos datos se muestran en el checkout cuando la alumna selecciona pago por transferencia.
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
          <div>
            <label style={labelStyle}>Titular de la cuenta</label>
            <input style={inputStyle} value={form.bankHolderName} onChange={field('bankHolderName')} placeholder="Nombre Apellido / Razón Social" />
          </div>
          <div>
            <label style={labelStyle}>CBU / CVU</label>
            <input style={inputStyle} value={form.bankCbu} onChange={field('bankCbu')} placeholder="0000000000000000000000" />
          </div>
          <div>
            <label style={labelStyle}>Alias</label>
            <input style={inputStyle} value={form.bankAlias} onChange={field('bankAlias')} placeholder="ALIAS.EJEMPLO" />
          </div>
          <div>
            <label style={labelStyle}>Email de contacto para comprobantes</label>
            <input style={inputStyle} type="email" value={form.bankContactEmail} onChange={field('bankContactEmail')} placeholder="hola@vecka.com.ar" />
          </div>
          <div>
            <label style={labelStyle}>WhatsApp (con código de país, sin +)</label>
            <input style={inputStyle} value={form.bankContactWhatsapp} onChange={field('bankContactWhatsapp')} placeholder="5491112345678" />
          </div>
          <div style={{ gridColumn: '1 / -1' }}>
            <label style={labelStyle}>Nota en el checkout (opcional)</label>
            <input style={inputStyle} value={form.checkoutNote} onChange={field('checkoutNote')} placeholder="Ej: Pagando por transferencia obtenés 10% de descuento." />
          </div>
        </div>
      </div>

      <button type="submit" disabled={saving} className="admin-button">
        {saving ? 'Guardando…' : 'Guardar ajustes'}
      </button>
    </form>
  )
}
