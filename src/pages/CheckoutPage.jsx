import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import Icon from '../components/Icon';
import { Btn, inputStyle } from '../components/Primitives';

export default function CheckoutPage() {
  const { cart, cartTotal, fmt, navigate, user } = useVecka();
  const [step, setStep] = useState(user ? 1 : 0);
  const [payMethod, setPayMethod] = useState('mercadopago');
  const [form, setForm] = useState({ name: user?.name || '', email: user?.email || '', phone: '' });

  if (cart.length === 0 && step < 3) { navigate('tienda'); return null; }

  const payMethods = [
    { id: 'mercadopago', label: 'MercadoPago', desc: 'Débito, crédito, Mercado Pago saldo', flag: '🇦🇷' },
    { id: 'modo', label: 'MODO', desc: 'Billetera digital argentina', flag: '🇦🇷' },
    { id: 'paypal', label: 'PayPal', desc: 'Para pagos internacionales en USD', flag: '🌐' },
  ];
  const steps = ['Identificación', 'Resumen', 'Pago', 'Confirmación'];

  return (
    <div style={{ paddingTop: 108, minHeight: '100vh', background: '#faf5f8' }}>
      <div style={{ maxWidth: 900, margin: '0 auto', padding: '40px 24px 80px' }}>
        {/* Steps */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 40 }}>
          {steps.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: i <= step ? '#5e9e8a' : 'oklch(85% 0.012 60)' }} />}
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: i <= step ? '#5e9e8a' : 'oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {i < step
                    ? <Icon name="check" size={14} color="#fff" />
                    : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: i === step ? '#fff' : 'oklch(60% 0.012 60)' }}>{i + 1}</span>
                  }
                </div>
                {i < steps.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#5e9e8a' : 'oklch(85% 0.012 60)' }} />}
              </div>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: i === step ? '#5e9e8a' : 'oklch(55% 0.012 60)', fontWeight: i === step ? 600 : 400 }}>{s}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 340px', gap: 28, alignItems: 'start' }}>
          {/* Main panel */}
          <div style={{ background: '#fff', borderRadius: 20, padding: 32, boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 24 }}>Identificación</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 24 }}>
                  <input placeholder="Nombre completo" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} style={inputStyle} />
                  <input placeholder="Email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} style={inputStyle} />
                  <input placeholder="Teléfono (opcional)" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} style={inputStyle} />
                </div>
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(1)} disabled={!form.name || !form.email}>
                  Continuar
                </Btn>
              </div>
            )}

            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 24 }}>Tu pedido</h2>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 16, padding: '14px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
                    <div style={{ width: 60, height: 60, borderRadius: 10, background: item.color || 'oklch(94% 0.02 60)', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600 }}>{item.title}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>{item.category}</div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#5e9e8a' }}>{fmt(item.price, item.priceUSD)}</div>
                  </div>
                ))}
                <div style={{ marginTop: 24 }}>
                  <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(2)}>Elegir método de pago</Btn>
                </div>
              </div>
            )}

            {step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, marginBottom: 24 }}>Método de pago</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 28 }}>
                  {payMethods.map(pm => (
                    <div key={pm.id} onClick={() => setPayMethod(pm.id)}
                      style={{ border: `2px solid ${payMethod === pm.id ? '#5e9e8a' : 'oklch(88% 0.012 60)'}`, borderRadius: 14, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .15s', background: payMethod === pm.id ? '#fdf8fb' : '#fff' }}>
                      <div style={{ width: 36, height: 36, borderRadius: '50%', background: payMethod === pm.id ? '#5e9e8a' : 'oklch(92% 0.012 60)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                        {pm.flag}
                      </div>
                      <div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, fontWeight: 600, color: 'oklch(18% 0.022 50)' }}>{pm.label}</div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{pm.desc}</div>
                      </div>
                      {payMethod === pm.id && (
                        <div style={{ marginLeft: 'auto', width: 22, height: 22, borderRadius: '50%', background: '#5e9e8a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="check" size={12} color="#fff" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
                <div style={{ background: '#f5ece9', borderRadius: 12, padding: '14px 18px', marginBottom: 20, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#3d6b5e' }}>
                  💡 Pagando con transferencia bancaria obtenés 10% de descuento extra. Contactanos para coordinar.
                </div>
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(3)}>
                  Pagar {fmt(cartTotal, cartTotal)} con {payMethods.find(p => p.id === payMethod)?.label}
                </Btn>
              </div>
            )}

            {step === 3 && (
              <div style={{ textAlign: 'center', padding: '40px 0' }}>
                <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'oklch(92% 0.06 152)', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="check" size={32} color="#4a7d6e" />
                </div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 36, marginBottom: 12 }}>¡Compra exitosa!</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'oklch(45% 0.018 50)', lineHeight: 1.7, marginBottom: 28 }}>
                  Gracias por tu compra. Te enviamos el comprobante a {form.email || 'tu email'}. Ya podés acceder a tu contenido.
                </p>
                <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
                  <Btn size="lg" onClick={() => navigate('cuenta')}>Ir a mis cursos</Btn>
                  <Btn size="lg" variant="outline" onClick={() => navigate('home')}>Volver al inicio</Btn>
                </div>
              </div>
            )}
          </div>

          {/* Order summary */}
          {step < 3 && (
            <div style={{ background: '#fff', borderRadius: 20, padding: 24, boxShadow: '0 4px 20px rgba(0,0,0,.06)', position: 'sticky', top: 120 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, marginBottom: 16, marginTop: 0 }}>Resumen</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, borderBottom: '1px solid oklch(94% 0.01 60)' }}>
                  <span style={{ color: 'oklch(30% 0.018 50)', maxWidth: 180 }}>{item.title}</span>
                  <span style={{ fontWeight: 600 }}>{fmt(item.price, item.priceUSD)}</span>
                </div>
              ))}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 16, paddingTop: 16, borderTop: '2px solid oklch(88% 0.016 60)' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 700, color: '#5e9e8a' }}>{fmt(cartTotal, cartTotal)}</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
