import { useState, useMemo } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { api } from '../services/api';
import Icon from '../components/Icon';
import { Btn, inputStyle } from '../components/Primitives';

const PROVINCIAS = [
  'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes',
  'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
  'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
  'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán',
];

const selectStyle = {
  ...inputStyle,
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 36,
};

export default function CheckoutPage() {
  const { cart, cartTotal, fmt, navigate, user, notify, clearCart } = useVecka();
  const { isMobile } = useResponsive();

  const hasPhysical = useMemo(() => cart.some(i => i.format === 'Papel' || i.format === 'Físico'), [cart]);
  const hasDigital = useMemo(() => cart.some(i => i.format === 'PDF'), [cart]);
  const shippingCost = hasPhysical ? 3500 : 0;

  const baseSteps = ['Identificación', 'Pedido', ...(hasPhysical ? ['Envío'] : []), 'Pago'];
  const [step, setStep] = useState(user && !user.isDemo ? 1 : 0);
  const [payMethod, setPayMethod] = useState('mercadopago');
  const [loading, setLoading] = useState(false);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
  });
  const [shipping, setShipping] = useState({
    name: user?.name || '',
    address: '',
    city: '',
    province: 'Buenos Aires',
    postalCode: '',
    notes: '',
  });

  const payMethods = [
    { id: 'mercadopago', label: 'MercadoPago', desc: 'Débito, crédito, saldo MP', flag: '🇦🇷' },
    { id: 'modo', label: 'MODO', desc: 'Billetera digital argentina', flag: '🇦🇷' },
    { id: 'paypal', label: 'PayPal', desc: 'Pagos internacionales en USD', flag: '🌐' },
  ];

  // Índice del paso actual en el array dinámico
  const shippingStepIdx = hasPhysical ? 2 : null;
  const payStepIdx = hasPhysical ? 3 : 2;

  if (cart.length === 0 && step < baseSteps.length) {
    navigate('tienda');
    return null;
  }

  const handlePay = async () => {
    setLoading(true);
    try {
      const result = await api.createOrder({
        items: cart.map(i => ({
          id: i.id,
          title: i.title,
          format: i.format,
          category: i.category,
          price: i.price,
          priceUSD: i.priceUSD,
          qty: i.qty || 1,
        })),
        buyer: { name: form.name, email: form.email, phone: form.phone },
        shipping: hasPhysical ? shipping : null,
        paymentMethod: payMethod,
      });

      // Si MercadoPago devolvió un link de pago, redirigir
      const mpUrl = result.sandboxInitPoint || result.initPoint;
      if (mpUrl) {
        window.location.href = mpUrl;
      } else {
        // Sin credenciales MP configuradas — mostrar confirmación manual
        clearCart();
        notify('Pedido creado. Coordiná el pago con el equipo VeCKA.');
        navigate('cuenta');
      }
    } catch (err) {
      notify(err.message || 'Error al procesar el pedido', 'error');
      setLoading(false);
    }
  };

  const Field = ({ label, value, onChange, placeholder, type = 'text' }) => (
    <div>
      <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.018 50)', marginBottom: 4, display: 'block' }}>{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} style={inputStyle} />
    </div>
  );

  return (
    <div style={{ paddingTop: isMobile ? 68 : 108, minHeight: '100vh', background: '#faf5f8' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: isMobile ? '28px 16px 60px' : '40px 24px 80px' }}>

        {/* Stepper */}
        <div style={{ display: 'flex', gap: 0, marginBottom: 32 }}>
          {baseSteps.map((s, i) => (
            <div key={s} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
              <div style={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                {i > 0 && <div style={{ flex: 1, height: 2, background: i <= step ? '#5e9e8a' : 'oklch(85% 0.012 60)', transition: 'background .3s' }} />}
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: i <= step ? '#5e9e8a' : 'oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'background .3s' }}>
                  {i < step
                    ? <Icon name="check" size={13} color="#fff" />
                    : <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: i === step ? '#fff' : 'oklch(60% 0.012 60)' }}>{i + 1}</span>
                  }
                </div>
                {i < baseSteps.length - 1 && <div style={{ flex: 1, height: 2, background: i < step ? '#5e9e8a' : 'oklch(85% 0.012 60)', transition: 'background .3s' }} />}
              </div>
              {!isMobile && <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: i === step ? '#5e9e8a' : 'oklch(55% 0.012 60)', fontWeight: i === step ? 600 : 400 }}>{s}</span>}
            </div>
          ))}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 300px', gap: 20, alignItems: 'start' }}>
          {/* Panel principal */}
          <div style={{ background: '#fff', borderRadius: 18, padding: isMobile ? 22 : 30, boxShadow: '0 4px 20px rgba(0,0,0,.06)' }}>

            {/* PASO 0 — Identificación */}
            {step === 0 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Identificación</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 22 }}>
                  <Field label="Nombre completo *" value={form.name} onChange={v => setForm({ ...form, name: v })} placeholder="Tu nombre" />
                  <Field label="Email *" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="tu@email.com" type="email" />
                  <Field label="Teléfono (opcional)" value={form.phone} onChange={v => setForm({ ...form, phone: v })} placeholder="+54 9 11 ..." />
                </div>
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setStep(1)} disabled={!form.name || !form.email}>
                  Continuar
                </Btn>
              </div>
            )}

            {/* PASO 1 — Resumen del pedido */}
            {step === 1 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 22 }}>Tu pedido</h2>
                {cart.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 14, padding: '13px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
                    <div style={{ width: 54, height: 54, borderRadius: 10, background: item.color || 'oklch(94% 0.02 60)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <span style={{ fontSize: 11, color: 'rgba(0,0,0,.3)', fontFamily: "'DM Sans', sans-serif", textAlign: 'center', padding: 4 }}>{item.format}</span>
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>
                        {item.category} · {item.format === 'PDF' ? '📄 Descarga digital' : item.format === 'Papel' || item.format === 'Físico' ? '📦 Envío por correo' : ''}
                      </div>
                    </div>
                    <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>{fmt(item.price, item.priceUSD)}</div>
                  </div>
                ))}
                {hasPhysical && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(50% 0.018 50)' }}>
                    <span>Envío Correo Argentino</span>
                    <span style={{ fontWeight: 600 }}>${shippingCost.toLocaleString('es-AR')}</span>
                  </div>
                )}
                {hasDigital && (
                  <div style={{ background: '#e8f5f0', borderRadius: 10, padding: '12px 14px', marginTop: 16, fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#3d6b5e' }}>
                    📄 Los moldes digitales se descargan automáticamente una vez acreditado el pago.
                    Te llegará el link por email.
                  </div>
                )}
                <div style={{ marginTop: 22 }}>
                  <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setStep(hasPhysical ? 2 : payStepIdx)}>
                    {hasPhysical ? 'Completar dirección de envío' : 'Elegir método de pago'}
                  </Btn>
                </div>
              </div>
            )}

            {/* PASO 2 — Dirección de envío (solo si hasPhysical) */}
            {hasPhysical && step === 2 && (
              <div>
                <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 28, marginBottom: 6 }}>Dirección de envío</h2>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(50% 0.018 50)', marginBottom: 20 }}>
                  Tu pedido será enviado por <strong>Correo Argentino</strong>.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 13, marginBottom: 22 }}>
                  <Field label="Nombre del destinatario *" value={shipping.name} onChange={v => setShipping({ ...shipping, name: v })} placeholder="Nombre completo" />
                  <Field label="Dirección (calle y número) *" value={shipping.address} onChange={v => setShipping({ ...shipping, address: v })} placeholder="Av. Corrientes 1234, Piso 3B" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                    <Field label="Ciudad / Localidad *" value={shipping.city} onChange={v => setShipping({ ...shipping, city: v })} placeholder="Buenos Aires" />
                    <Field label="Código Postal *" value={shipping.postalCode} onChange={v => setShipping({ ...shipping, postalCode: v })} placeholder="1234" />
                  </div>
                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.018 50)', marginBottom: 4, display: 'block' }}>Provincia *</label>
                    <select value={shipping.province} onChange={e => setShipping({ ...shipping, province: e.target.value })} style={selectStyle}>
                      {PROVINCIAS.map(p => <option key={p} value={p}>{p}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(50% 0.018 50)', marginBottom: 4, display: 'block' }}>Notas para el envío (opcional)</label>
                    <textarea value={shipping.notes} onChange={e => setShipping({ ...shipping, notes: e.target.value })}
                      placeholder="Ej: tocar timbre piso 3, entre semana..." rows={2}
                      style={{ ...inputStyle, resize: 'vertical', width: '100%', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }}
                  onClick={() => setStep(payStepIdx)}
                  disabled={!shipping.name || !shipping.address || !shipping.city || !shipping.postalCode}>
                  Elegir método de pago
                </Btn>
              </div>
            )}

            {/* PASO de Pago */}
            {step === payStepIdx && (
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
                <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePay} disabled={loading}>
                  {loading ? 'Procesando...' : `Pagar ${fmt(cartTotal + shippingCost, cartTotal + shippingCost)}`}
                </Btn>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)', textAlign: 'center', marginTop: 10 }}>
                  Serás redirigida a MercadoPago para completar el pago de forma segura.
                </p>
              </div>
            )}
          </div>

          {/* Resumen lateral */}
          {step < baseSteps.length && !isMobile && (
            <div style={{ background: '#fff', borderRadius: 18, padding: 22, boxShadow: '0 4px 20px rgba(0,0,0,.06)', position: 'sticky', top: 120 }}>
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginBottom: 14, marginTop: 0 }}>Resumen</h3>
              {cart.map(item => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, borderBottom: '1px solid oklch(94% 0.01 60)' }}>
                  <span style={{ color: 'oklch(30% 0.018 50)', maxWidth: 155, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</span>
                  <span style={{ fontWeight: 600, flexShrink: 0 }}>{fmt(item.price, item.priceUSD)}</span>
                </div>
              ))}
              {hasPhysical && (
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(50% 0.018 50)' }}>
                  <span>Envío</span>
                  <span>${shippingCost.toLocaleString('es-AR')}</span>
                </div>
              )}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 14, paddingTop: 14, borderTop: '2px solid oklch(88% 0.016 60)' }}>
                <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 700, fontSize: 15 }}>Total</span>
                <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontWeight: 700, color: '#5e9e8a' }}>
                  {fmt(cartTotal + shippingCost, cartTotal + shippingCost)}
                </span>
              </div>
              {hasPhysical && (
                <div style={{ marginTop: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)', lineHeight: 1.5 }}>
                  📦 Envío por Correo Argentino.<br />Tiempo estimado: 5-10 días hábiles.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
