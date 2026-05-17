'use client'

import { useState } from 'react'

const TABS = [
  { id: 'general', label: 'General', icon: '🏠' },
  { id: 'pagos', label: 'Pagos', icon: '💳' },
  { id: 'correo', label: 'Correo', icon: '✉️' },
  { id: 'videos', label: 'Videos', icon: '▶️' },
  { id: 'acceso', label: 'Acceso', icon: '🔐' },
]

const input = { padding: '9px 12px', border: '1px solid #d0c8c0', borderRadius: 8, fontFamily: 'DM Sans, sans-serif', fontSize: 14, width: '100%', boxSizing: 'border-box', background: '#fff', outline: 'none' }
const label = { fontFamily: 'DM Sans, sans-serif', fontSize: 12, fontWeight: 600, color: '#8a7f78', marginBottom: 4, display: 'block', textTransform: 'uppercase', letterSpacing: '0.04em' }
const card = { background: '#fff', borderRadius: 14, padding: '24px 26px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 20 }
const cardTitle = { fontFamily: 'Cormorant Garamond, serif', fontSize: 20, marginTop: 0, marginBottom: 6, color: '#2a2420' }
const cardSub = { fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#8a7f78', marginTop: 0, marginBottom: 18 }
const grid2 = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }

function Field({ label: lbl, children }) {
  return (
    <div>
      <label style={label}>{lbl}</label>
      {children}
    </div>
  )
}

function Toggle({ checked, onChange, label: lbl, description }) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        style={{
          flexShrink: 0,
          width: 44,
          height: 24,
          borderRadius: 12,
          border: 'none',
          cursor: 'pointer',
          background: checked ? '#5e9e8a' : '#d0c8c0',
          position: 'relative',
          transition: 'background 0.2s',
          marginTop: 2,
        }}
        aria-pressed={checked}
      >
        <span style={{
          position: 'absolute',
          top: 3,
          left: checked ? 23 : 3,
          width: 18,
          height: 18,
          borderRadius: '50%',
          background: '#fff',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
        }} />
      </button>
      <div>
        <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: '#2a2420' }}>{lbl}</div>
        {description && <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#8a7f78', marginTop: 2 }}>{description}</div>}
      </div>
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      style={{ ...input, appearance: 'none', backgroundImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'12\' height=\'8\' fill=\'none\'%3E%3Cpath d=\'M1 1l5 5 5-5\' stroke=\'%238a7f78\' stroke-width=\'1.5\' stroke-linecap=\'round\'/%3E%3C/svg%3E")', backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center', paddingRight: 32 }}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  )
}

export default function SettingsForm({ initialSettings: s }) {
  const [tab, setTab] = useState('general')
  const [form, setForm] = useState({
    // General
    brandName: s.brand_name || '',
    tagline: s.tagline || '',
    contactEmail: s.contact_email || '',
    contactWhatsapp: s.contact_whatsapp || '',
    socialInstagram: s.social_instagram || '',
    socialWhatsapp: s.social_whatsapp || '',
    // Pagos
    checkoutBankEnabled: s.checkout_bank_enabled ?? true,
    bankHolderName: s.bank_holder_name || '',
    bankCbu: s.bank_cbu || '',
    bankAlias: s.bank_alias || '',
    bankUsdHolderName: s.bank_usd_holder_name || '',
    bankUsdCbu: s.bank_usd_cbu || '',
    bankUsdAlias: s.bank_usd_alias || '',
    bankContactEmail: s.bank_contact_email || '',
    bankContactWhatsapp: s.bank_contact_whatsapp || '',
    checkoutNote: s.checkout_note || '',
    checkoutArsEnabled: s.checkout_ars_enabled ?? true,
    checkoutUsdEnabled: s.checkout_usd_enabled ?? false,
    // Correo
    resendFromName: s.resend_from_name || '',
    resendFromEmail: s.resend_from_email || '',
    notifyAdminOnSale: s.notify_admin_on_sale ?? true,
    notifyAdminEmail: s.notify_admin_email || '',
    membershipRemindersEnabled: s.membership_reminders_enabled ?? true,
    // Videos
    videoProvider: s.video_provider || 'youtube',
    // Acceso
    courseAccessModel: s.course_access_model || 'enrollment',
  })

  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState(null)

  function set(key) {
    return (val) => setForm(f => ({ ...f, [key]: val }))
  }
  function setInput(key) {
    return (e) => setForm(f => ({ ...f, [key]: e.target.value }))
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
      setTimeout(() => setMsg(null), 4000)
    } catch (err) {
      setMsg({ type: 'error', text: err.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSave}>
      {/* Tab nav */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 24, background: '#fff', padding: 6, borderRadius: 12, border: '1px solid oklch(88% 0.012 60)', width: 'fit-content' }}>
        {TABS.map(t => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
              fontFamily: 'DM Sans, sans-serif', fontSize: 13, fontWeight: tab === t.id ? 700 : 500,
              background: tab === t.id ? '#f3f0ed' : 'transparent',
              color: tab === t.id ? '#2a2420' : '#8a7f78',
              transition: 'all 0.15s',
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{ padding: '12px 18px', borderRadius: 10, marginBottom: 18, fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, background: msg.type === 'error' ? '#fde8e8' : '#d4f0e6', color: msg.type === 'error' ? '#7b1a1a' : '#2e7d6a' }}>
          {msg.text}
        </div>
      )}

      {/* ── GENERAL ── */}
      {tab === 'general' && (
        <>
          <div style={card}>
            <h3 style={cardTitle}>Identidad de la plataforma</h3>
            <p style={cardSub}>El nombre y descripción que aparecen en el sitio y correos.</p>
            <div style={grid2}>
              <Field label="Nombre de la plataforma">
                <input style={input} value={form.brandName} onChange={setInput('brandName')} placeholder="Vecka" />
              </Field>
              <Field label="Tagline / descripción corta">
                <input style={input} value={form.tagline} onChange={setInput('tagline')} placeholder="Cursos de bienestar para mujeres" />
              </Field>
            </div>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>Contacto</h3>
            <p style={cardSub}>Email y WhatsApp de contacto general de la plataforma.</p>
            <div style={grid2}>
              <Field label="Email de contacto">
                <input style={input} type="email" value={form.contactEmail} onChange={setInput('contactEmail')} placeholder="hola@vecka.com.ar" />
              </Field>
              <Field label="WhatsApp (con código de país, sin +)">
                <input style={input} value={form.contactWhatsapp} onChange={setInput('contactWhatsapp')} placeholder="5491112345678" />
              </Field>
            </div>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>Redes sociales</h3>
            <p style={cardSub}>Links que se muestran en el footer y otras partes del sitio.</p>
            <div style={grid2}>
              <Field label="Instagram (usuario, sin @)">
                <input style={input} value={form.socialInstagram} onChange={setInput('socialInstagram')} placeholder="vecka.ar" />
              </Field>
              <Field label="WhatsApp (número completo con código de país)">
                <input style={input} value={form.socialWhatsapp} onChange={setInput('socialWhatsapp')} placeholder="5491112345678" />
              </Field>
            </div>
          </div>
        </>
      )}

      {/* ── PAGOS ── */}
      {tab === 'pagos' && (
        <>
          <div style={card}>
            <h3 style={cardTitle}>Métodos de pago</h3>
            <p style={cardSub}>Habilitá o deshabilitá los métodos disponibles en el checkout.</p>
            <Toggle
              checked={form.checkoutBankEnabled}
              onChange={set('checkoutBankEnabled')}
              label="Transferencia bancaria"
              description="Los clientes pueden pagar con transferencia y enviarte el comprobante."
            />
            <Toggle
              checked={false}
              onChange={() => {}}
              label="MercadoPago / tarjeta"
              description="Próximamente — requiere configuración de credenciales."
            />
          </div>

          {form.checkoutBankEnabled && (
            <>
              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ background: '#e8f5f0', color: '#2e7d6a', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>ARS · PESOS</span>
                  <h3 style={{ ...cardTitle, marginBottom: 0 }}>Cuenta en pesos</h3>
                </div>
                <p style={cardSub}>Datos que se muestran en el checkout cuando la alumna elige transferencia en pesos.</p>
                <div style={grid2}>
                  <Field label="Titular">
                    <input style={input} value={form.bankHolderName} onChange={setInput('bankHolderName')} placeholder="Nombre Apellido / Razón Social" />
                  </Field>
                  <Field label="CBU / CVU">
                    <input style={input} value={form.bankCbu} onChange={setInput('bankCbu')} placeholder="0000000000000000000000" />
                  </Field>
                  <Field label="Alias">
                    <input style={input} value={form.bankAlias} onChange={setInput('bankAlias')} placeholder="ALIAS.EJEMPLO" />
                  </Field>
                </div>
              </div>

              <div style={card}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <span style={{ background: '#eef2fb', color: '#3a5bbf', fontFamily: 'DM Sans, sans-serif', fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20, letterSpacing: '0.05em' }}>USD · DÓLARES</span>
                  <h3 style={{ ...cardTitle, marginBottom: 0 }}>Cuenta en dólares</h3>
                </div>
                <p style={cardSub}>Datos que se muestran en el checkout cuando la alumna elige transferencia en dólares. Dejá vacío si no aceptás pagos en USD.</p>
                <div style={grid2}>
                  <Field label="Titular">
                    <input style={input} value={form.bankUsdHolderName} onChange={setInput('bankUsdHolderName')} placeholder="Nombre Apellido / Razón Social" />
                  </Field>
                  <Field label="CBU / CVU">
                    <input style={input} value={form.bankUsdCbu} onChange={setInput('bankUsdCbu')} placeholder="0000000000000000000000" />
                  </Field>
                  <Field label="Alias">
                    <input style={input} value={form.bankUsdAlias} onChange={setInput('bankUsdAlias')} placeholder="ALIAS.USD.EJEMPLO" />
                  </Field>
                </div>
              </div>

              <div style={card}>
                <h3 style={cardTitle}>Contacto para comprobantes</h3>
                <p style={cardSub}>Email y WhatsApp donde las alumnas envían el comprobante de pago (compartido para ARS y USD).</p>
                <div style={grid2}>
                  <Field label="Email">
                    <input style={input} type="email" value={form.bankContactEmail} onChange={setInput('bankContactEmail')} placeholder="pagos@vecka.com.ar" />
                  </Field>
                  <Field label="WhatsApp (con código de país, sin +)">
                    <input style={input} value={form.bankContactWhatsapp} onChange={setInput('bankContactWhatsapp')} placeholder="5491112345678" />
                  </Field>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <Field label="Nota en el checkout (opcional)">
                      <input style={input} value={form.checkoutNote} onChange={setInput('checkoutNote')} placeholder="Pagando por transferencia obtenés 10% de descuento." />
                    </Field>
                  </div>
                </div>
              </div>
            </>
          )}

          <div style={card}>
            <h3 style={cardTitle}>Monedas aceptadas</h3>
            <p style={cardSub}>Las monedas habilitadas aparecen como opción en el checkout. La alumna elige en cuál quiere pagar y se le muestran los datos de la cuenta correspondiente.</p>
            <Toggle
              checked={form.checkoutArsEnabled}
              onChange={set('checkoutArsEnabled')}
              label="Pesos argentinos (ARS)"
              description="Muestra los datos de la cuenta en pesos en el checkout."
            />
            <Toggle
              checked={form.checkoutUsdEnabled}
              onChange={set('checkoutUsdEnabled')}
              label="Dólares (USD)"
              description="Muestra los datos de la cuenta en dólares en el checkout. Requiere tener una cuenta USD configurada arriba."
            />
          </div>
        </>
      )}

      {/* ── CORREO ── */}
      {tab === 'correo' && (
        <>
          <div style={card}>
            <h3 style={cardTitle}>Configuración de envío</h3>
            <p style={cardSub}>Nombre y dirección desde donde se envían los correos transaccionales (bienvenida, confirmaciones, recordatorios).</p>
            <div style={grid2}>
              <Field label="Nombre del remitente">
                <input style={input} value={form.resendFromName} onChange={setInput('resendFromName')} placeholder="Vecka" />
              </Field>
              <Field label="Email del remitente">
                <input style={input} type="email" value={form.resendFromEmail} onChange={setInput('resendFromEmail')} placeholder="hola@vecka.com.ar" />
              </Field>
            </div>
          </div>

          <div style={card}>
            <h3 style={cardTitle}>Notificaciones al equipo</h3>
            <p style={cardSub}>Alertas internas que recibís cuando ocurren eventos importantes.</p>
            <Toggle
              checked={form.notifyAdminOnSale}
              onChange={set('notifyAdminOnSale')}
              label="Notificar por email en cada venta"
              description="Recibís un correo cada vez que se concreta una compra."
            />
            {form.notifyAdminOnSale && (
              <div style={{ marginTop: 14 }}>
                <Field label="Email para notificaciones de ventas">
                  <input style={input} type="email" value={form.notifyAdminEmail} onChange={setInput('notifyAdminEmail')} placeholder="ventas@vecka.com.ar" />
                </Field>
              </div>
            )}
            <Toggle
              checked={form.membershipRemindersEnabled}
              onChange={set('membershipRemindersEnabled')}
              label="Recordatorios de membresía"
              description="Envía correos automáticos cuando una membresía está por vencer (7 días y 1 día antes)."
            />
          </div>
        </>
      )}

      {/* ── VIDEOS ── */}
      {tab === 'videos' && (
        <div style={card}>
          <h3 style={cardTitle}>Proveedor de video</h3>
          <p style={cardSub}>Plataforma desde donde se alojan los videos de los cursos.</p>
          <div style={{ maxWidth: 280 }}>
            <Field label="Plataforma de video">
              <Select
                value={form.videoProvider}
                onChange={set('videoProvider')}
                options={[
                  { value: 'youtube', label: 'YouTube (unlisted / privado)' },
                  { value: 'vimeo', label: 'Vimeo' },
                  { value: 'bunny', label: 'Bunny.net Stream' },
                  { value: 'mux', label: 'Mux' },
                ]}
              />
            </Field>
          </div>
          <div style={{ marginTop: 16, padding: '14px 16px', background: '#f8f6f3', borderRadius: 10, fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6b635c' }}>
            <strong>Nota:</strong> Cambiar el proveedor solo afecta los videos nuevos que cargues. Los videos existentes seguirán usando la configuración anterior.
          </div>
        </div>
      )}

      {/* ── ACCESO ── */}
      {tab === 'acceso' && (
        <>
          <div style={card}>
            <h3 style={cardTitle}>Modelo de acceso a cursos</h3>
            <p style={cardSub}>Define cómo las alumnas acceden al contenido de los cursos.</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxWidth: 560 }}>
              {[
                { value: 'enrollment', label: 'Por inscripción', desc: 'Las alumnas deben inscribirse a cada curso individualmente (comprarlo o recibirlo). Es el modelo estándar.' },
                { value: 'membership', label: 'Por membresía', desc: 'Las alumnas con una membresía activa acceden a todos los cursos incluidos en su nivel automáticamente.' },
                { value: 'hybrid', label: 'Híbrido', desc: 'Algunos cursos requieren inscripción individual y otros están incluidos en planes de membresía.' },
              ].map(opt => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setForm(f => ({ ...f, courseAccessModel: opt.value }))}
                  style={{
                    textAlign: 'left',
                    padding: '16px 18px',
                    borderRadius: 10,
                    border: `2px solid ${form.courseAccessModel === opt.value ? '#5e9e8a' : '#d0c8c0'}`,
                    background: form.courseAccessModel === opt.value ? '#f0faf6' : '#fff',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 700, color: form.courseAccessModel === opt.value ? '#2e7d6a' : '#2a2420', marginBottom: 3 }}>
                    {form.courseAccessModel === opt.value ? '● ' : '○ '}{opt.label}
                  </div>
                  <div style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 13, color: '#6b635c' }}>{opt.desc}</div>
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <button type="submit" disabled={saving} className="admin-button">
          {saving ? 'Guardando…' : 'Guardar ajustes'}
        </button>
        {msg && (
          <span style={{ fontFamily: 'DM Sans, sans-serif', fontSize: 14, fontWeight: 600, color: msg.type === 'error' ? '#7b1a1a' : '#2e7d6a' }}>
            {msg.type === 'success' ? '✓ ' : '✗ '}{msg.text}
          </span>
        )}
      </div>
    </form>
  )
}
