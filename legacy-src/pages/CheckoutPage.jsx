import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from '../components/Icon';
import { Btn, inputStyle } from '../components/Primitives';

export default function CheckoutPage() {
  const { cart, cartTotal, fmt, navigate, user, bankInfo } = useVecka();
  const { isMobile } = useResponsive();
  const [step, setStep] = useState(user ? 1 : 0);
  const [payMethod, setPayMethod] = useState('transferencia');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '' });

  const payMethods = [
    {
      id: 'transferencia',
      label: 'Transferencia bancaria',
      desc: 'CBU / CVU · Acreditación en 24-48hs',
      flag: '🏦',
      enabled: true,
    },
    { id: 'mercadopago', label: 'MercadoPago', desc: 'Próximamente', flag: '🇦🇷', enabled: false },
    { id: 'modo', label: 'MODO', desc: 'Próximamente', flag: '🇦🇷', enabled: false },
  ];

  const steps = ['Identificación', 'Resumen', 'Pago', 'Confirmación'];

  // Empty cart state — don't redirect, show message instead
  if (cart.length === 0 && step < 3) {
    return (
      <div style={{ paddingTop: isMobile ? 68 : 108, minHeight: '100vh', background: '#faf5f8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '60px 24px' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>🛒</div>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 12 }}>Tu carrito está vacío</h2>
          <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'oklch(52% 0.018 50)', marginBottom: 28 }}>
            Agregá cursos o productos para continuar.
          </p>
          <Btn size="lg" onClick={() => navigate('tienda')}>Ir a la tienda</Btn>
        </div>
      </div>
    );
  }

  return (
    <div style={{ paddingTop: isMobile ? 68 : 108, minHeight: '100vh', background: '#faf5f8' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '28px 16px 60px' : '40px 24px 80px' }}>
        {/* Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: i <= step ? '#5e9e8a' : 'oklch(85% 0.012 60)', transition: 'background .3s' }} />}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: i <= step ? '#5e9e8a' : 'oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .3s' }}>
                  {i < step
                    ? <Icon name="check" size={13} color="#fff" />
                    : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: i === step ? '#fff' : 'oklch(60% 0.012 60)' }}>{i + 1}</span>
                  }
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#5e9e8a' : 'oklch(85% 0.012 60)', transition: 'background .3s' }} />}
              </div>
              {!isMobile && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: i === step ? '#5e9e8a' : 'oklch(55% 0.012 60)', fontWeight: i === step ? 600 : 400 }}>{s}</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 320px', gap: 20, alignItems: 'start' }}>
          {/* Main panel */}
          <div style={{ background: '#fff', borderRadius: 18, padding: isMobile ? 22 : 30, boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>

            {/* Step 0 — Identificación */}
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Identificación</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 22 }}>
                  <input placeholder="Nombre completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                  <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                  <input placeholder="Teléfono (opcional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                </div>
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(1)} disabled={!form.name || !form.email}>
                  Continuar
                </Btn>
              </div>
            )}

            {/* Step 1 — Resumen */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Tu pedido</h2>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 14, padding: '13px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
                    <div style={{ width: 54, height: 54, borderRadius: 10, background: item.color || 'oklch(94% 0.02 60)', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>{item.category}</div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>{fmt(item.price, item.priceUSD)}</div>
                  </div>
                ))}
                <div style={{ marginTop: 22 }}>
                  <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(2)}>Elegir método de pago</Btn>
                </div>
              </div>
            )}

            {/* Step 2 — Método de pago */}
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Método de pago</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {payMethods.map(pm => (
                    <div
                      key={pm.id}
                      onClick={() => pm.enabled && setPayMethod(pm.id)}
                      style={{
                        border: `2px solid ${payMethod === pm.id ? '#5e9e8a' : 'oklch(88% 0.012 60)'}`,
                        borderRadius: 12, padding: '14px 18px',
                        cursor: pm.enabled ? 'pointer' : 'not-allowed',
                        display: 'flex', alignItems: 'center', gap: 12,
                        transition: 'all .15s',
                        background: !pm.enabled ? '#faf9f8' : payMethod === pm.id ? '#fdf8fb' : '#fff',
                        opacity: pm.enabled ? 1 : 0.55,
                      }}
                    >
                      <span style={{ fontSize: 22 }}>{pm.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{pm.label}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{pm.desc}</div>
                      </div>
                      {pm.enabled && payMethod === pm.id && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Icon name="check" size={11} color="#fff" />
                        </div>
                      )}
                      {!pm.enabled && (
                        <span style={{ fontSize: 11, background: '#f0ece8', color: '#8a7a6e', borderRadius: 6, padding: '2px 8px', fontWeight: 600, flexShrink: 0 }}>Próximamente</span>
                      )}
                    </div>
                  ))}
                </div>

                {bankInfo?.checkoutNote && (
                  <div style={{ background: '#f0faf6', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#2e6052' }}>
                    💡 {bankInfo.checkoutNote}
                  </div>
                )}
                {!bankInfo?.checkoutNote && (
                  <div style={{ background: '#f0faf6', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#2e6052' }}>
                    💡 Pagá por transferencia y confirmá tu compra enviando el comprobante.
                  </div>
                )}

                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(3)}>
                  Confirmar pedido · {fmt(cartTotal, cartTotal)}
                </Btn>
              </div>
            )}

            {/* Step 3 — Confirmación con datos bancarios */}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: isMobile ? '24px 0' : '36px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'oklch(92% 0.06 152)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'popIn .4s cubic-bezier(.22,1,.36,1)' }}>
                  <style>{`@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
                  <Icon name="check" size={30} color="#4a7d6e" />
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 34, marginBottom: 8 }}>¡Pedido registrado!</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(45% 0.018 50)', lineHeight: 1.7, marginBottom: 24 }}>
                  Para confirmar tu compra, realizá la transferencia por <strong>{fmt(cartTotal, cartTotal)}</strong> a los datos de abajo y envianos el comprobante.
                </p>

                {/* Bank details */}
                <div style={{ background: '#f9f5f0', borderRadius: 14, padding: '20px 24px', marginBottom: 24, textAlign: 'left' }}>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#8a7a6e', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 14 }}>Datos para transferir</div>
                  {[
                    ['Titular', bankInfo?.holderName || 'Vecka Escuela de Costura'],
                    bankInfo?.cbu ? ['CBU', bankInfo.cbu] : null,
                    bankInfo?.alias ? ['Alias', bankInfo.alias] : null,
                    ['Monto', fmt(cartTotal, cartTotal)],
                    ['Concepto / Referencia', form.email || form.name || 'tu nombre'],
                  ].filter(Boolean).map(([label, value]) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid oklch(90% 0.012 60)', fontFamily: "'DM Sans', sans-serif", fontSize: 14 }}>
                      <span style={{ color: '#8a7a6e', flexShrink: 0 }}>{label}</span>
                      <span style={{ fontWeight: 700, textAlign: 'right', marginLeft: 12, wordBreak: 'break-all' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Contact CTAs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, alignItems: 'stretch', maxWidth: 360, margin: '0 auto 24px' }}>
                  {bankInfo?.contactWhatsapp && (
                    <a
                      href={`https://wa.me/${bankInfo.contactWhatsapp.replace(/\D/g, '')}?text=${encodeURIComponent(`Hola! Acabo de hacer mi pedido por ${fmt(cartTotal, cartTotal)} y voy a enviar el comprobante. Nombre: ${form.name}, Email: ${form.email}`)}`}
                      target="_blank" rel="noreferrer"
                      style={{ display: 'block', padding: '13px 24px', background: '#25D366', color: '#fff', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}
                    >
                      📲 Enviar comprobante por WhatsApp
                    </a>
                  )}
                  {bankInfo?.contactEmail && (
                    <a
                      href={`mailto:${bankInfo.contactEmail}?subject=${encodeURIComponent('Comprobante de pago - ' + form.name)}&body=${encodeURIComponent(`Hola! Adjunto el comprobante de mi transferencia por ${fmt(cartTotal, cartTotal)}.\n\nNombre: ${form.name}\nEmail: ${form.email}\nProductos: ${cart.map(i => i.title).join(', ')}`)}`}
                      style={{ display: 'block', padding: '13px 24px', background: '#5e9e8a', color: '#fff', borderRadius: 10, fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 700, textDecoration: 'none', textAlign: 'center' }}
                    >
                      ✉ Enviar por email
                    </a>
                  )}
                  {!bankInfo?.contactWhatsapp && !bankInfo?.contactEmail && (
                    <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#8a7a6e' }}>
                      Envianos el comprobante al contacto habitual para confirmar tu acceso.
                    </p>
                  )}
                </div>

                <Btn size="lg" variant="outline" onClick={() => navigate('cuenta')}>Ir a mi cuenta</Btn>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          {step < 3 && !isMobile && (
            <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.06)', position: 'sticky', top: 120 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 14, marginTop: 0 }}>Resumen</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, borderBottom: '1px solid oklch(94% 0.01 60)' }}>
                  <span style={{ color: 'oklch(30% 0.018 50)', maxWidth: 160, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>{fmt(item.price, item.priceUSD)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '2px solid oklch(88% 0.016 60)' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15 }}>Total</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#5e9e8a' }}>{fmt(cartTotal, cartTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
