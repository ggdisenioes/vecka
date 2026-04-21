import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from '../components/Icon';
import { Btn, inputStyle } from '../components/Primitives';

export default function CheckoutPage() {
  const { cart, cartTotal, fmt, navigate, user } = useVecka();
  const { isMobile } = useResponsive();
  const [step, setStep] = useState(user ? 1 : 0);
  const [payMethod, setPayMethod] = useState('mercadopago');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '' });

  if (cart.length === 0 && step < 3) { navigate('tienda'); return null; }

  const payMethods = [
    { id: 'mercadopago', label: 'MercadoPago', desc: 'Débito, crédito, saldo', flag: '🇦🇷' },
    { id: 'modo', label: 'MODO', desc: 'Billetera digital argentina', flag: '🇦🇷' },
    { id: 'paypal', label: 'PayPal', desc: 'Pagos internacionales en USD', flag: '🌐' },
  ];
  const steps = ['Identificación', 'Resumen', 'Pago', 'Confirmación'];

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
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Identificación</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 22 }}>
                  <input placeholder="Nombre completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                  <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                  <input placeholder="Teléfono (opcional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                </div>
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(1)} disabled={!form.name || !form.email}>Continuar</Btn>
              </div>
            )}
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
            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Método de pago</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 22 }}>
                  {payMethods.map(pm => (
                    <div key={pm.id} onClick={() => setPayMethod(pm.id)}
                      style={{ border: `2px solid ${payMethod === pm.id ? '#5e9e8a' : 'oklch(88% 0.012 60)'}`, borderRadius: 12, padding: '14px 18px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 12, transition: 'all .15s', background: payMethod === pm.id ? '#fdf8fb' : '#fff' }}>
                      <span style={{ fontSize: 22 }}>{pm.flag}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{pm.label}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{pm.desc}</div>
                      </div>
                      {payMethod === pm.id && (
                        <div style={{ width: 20, height: 20, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="check" size={11} color="#fff" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f5ece9', borderRadius: 10, padding: '12px 16px', marginBottom: 18, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#3d6b5e' }}>
                  💡 Pagando con transferencia bancaria obtenés 10% de descuento. Contactanos para coordinar.
                </div>
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(3)}>
                  Pagar {fmt(cartTotal, cartTotal)}
                </Btn>
              </div>
            )}
            {step === 3 && (
              <div style={{ textAlign: 'center', padding: isMobile ? '32px 0' : '48px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'oklch(92% 0.06 152)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'popIn .4s cubic-bezier(.22,1,.36,1)' }}>
                  <style>{`@keyframes popIn { from { transform: scale(0); } to { transform: scale(1); } }`}</style>
                  <Icon name="check" size={30} color="#4a7d6e" />
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 36, marginBottom: 12 }}>¡Compra exitosa!</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(45% 0.018 50)', lineHeight: 1.7, marginBottom: 28 }}>
                  Te enviamos el comprobante a {form.email || 'tu email'}. Ya podés acceder a tu contenido.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Btn size="lg" onClick={() => navigate('cuenta')}>Ir a mis cursos</Btn>
                  <Btn size="lg" variant="outline" onClick={() => navigate('home')}>Volver al inicio</Btn>
                </div>
              </div>
            )}
          </div>

          {/* Order summary — move to top on mobile when step > 0 */}
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
