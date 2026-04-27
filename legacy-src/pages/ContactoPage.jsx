import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import Icon from '../components/Icon';
import { Btn, inputStyle, labelStyle } from '../components/Primitives';
import Footer from '../components/Footer';

function FaqItem({ q, a }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{ background: '#fff', borderRadius: 12, border: '1px solid #f0dee7', overflow: 'hidden', marginBottom: 2, transition: 'box-shadow .2s', boxShadow: open ? '0 4px 16px rgba(0,0,0,.06)' : 'none' }}>
      <button onClick={() => setOpen(!open)}
        style={{ width: '100%', padding: '17px 20px', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'oklch(20% 0.022 50)', textAlign: 'left', gap: 12 }}>
        <span>{q}</span>
        <Icon name="chevronDown" size={16} color="#5e9e8a" style={{ transform: open ? 'rotate(180deg)' : 'none', transition: 'transform .22s', flexShrink: 0 }} />
      </button>
      <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height .3s ease' }}>
        <div style={{ padding: '0 20px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(45% 0.018 50)', lineHeight: 1.7 }}>{a}</div>
      </div>
    </div>
  );
}

export default function ContactoPage() {
  const { notify } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref, visible } = useAnimateOnScroll(0.05);
  const [form, setForm] = useState({ nombre: '', apellido: '', telefono: '', mail: '', asunto: '', consulta: '', privacy: false });
  const [sent, setSent] = useState(false);
  const px = isMobile ? '20px' : isTablet ? '32px' : '80px';

  const handleSubmit = () => {
    if (!form.nombre || !form.mail || !form.consulta || !form.privacy) {
      notify('Completá todos los campos obligatorios', 'error');
      return;
    }
    setSent(true);
    notify('¡Consulta enviada! Te respondemos a la brevedad.');
  };

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108 }}>
      {/* Header */}
      <div style={{ background: '#faf5f8', padding: isMobile ? '44px 20px 0' : `64px ${px} 0` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: 60, alignItems: 'end' }}>
          <div style={{ paddingBottom: isTablet ? 40 : 60 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5e9e8a', marginBottom: 12 }}>Estamos para ayudarte</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 42 : 58, fontWeight: 600, margin: '0 0 18px', lineHeight: 1.05 }}>Contacto</h1>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 16, color: 'oklch(45% 0.018 50)', lineHeight: 1.7, marginBottom: 28 }}>
              ¿Dudas? Dejanos tu consulta y en breve nos vamos a comunicar para resolverlas.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[['📍', 'Belaustegui 411, Buenos Aires, Argentina'], ['📞', '11 7363 2891'], ['✉️', 'consultas@vecka.com.ar']].map(([icon, text]) => (
                <div key={text} style={{ display: 'flex', alignItems: 'center', gap: 12, fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(35% 0.018 50)' }}>
                  <span style={{ fontSize: 18 }}>{icon}</span> {text}
                </div>
              ))}
            </div>
          </div>
          {!isTablet && (
            <div style={{ height: 380, background: '#c5dfce', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.15) 20px, rgba(255,255,255,.15) 21px)' }} />
              <div style={{ position: 'relative', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.3)', fontStyle: 'italic' }}>Foto de Vero</div>
            </div>
          )}
        </div>
      </div>

      {/* Form */}
      <div ref={ref} style={{ background: '#fff', padding: `60px ${px}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto', ...fadeUpStyle(visible, 0) }}>
          {sent ? (
            <div style={{ textAlign: 'center', padding: '60px 0' }}>
              <div style={{ width: 72, height: 72, borderRadius: '50%', background: '#c5dfce', margin: '0 auto 20px', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'popIn .4s cubic-bezier(.22,1,.36,1)' }}>
                <style>{`@keyframes popIn { from { transform: scale(0); opacity: 0; } to { transform: scale(1); opacity: 1; } }`}</style>
                <Icon name="check" size={32} color="#3d6b5e" />
              </div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 34, marginBottom: 12 }}>¡Consulta enviada!</h2>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, color: 'oklch(48% 0.018 50)', lineHeight: 1.7 }}>
                Gracias por escribirnos. Te respondemos a la brevedad en tu email.
              </p>
            </div>
          ) : (
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 34, marginBottom: 28, textAlign: 'center' }}>Envianos tu consulta</h2>
              <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 14, marginBottom: 14 }}>
                <div>
                  <label style={labelStyle}>Nombre *</label>
                  <input placeholder="Tu nombre" value={form.nombre} onChange={e => setForm({ ...form, nombre: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Apellido</label>
                  <input placeholder="Tu apellido" value={form.apellido} onChange={e => setForm({ ...form, apellido: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Teléfono</label>
                  <input placeholder="Tu teléfono" value={form.telefono} onChange={e => setForm({ ...form, telefono: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                </div>
                <div>
                  <label style={labelStyle}>Mail *</label>
                  <input placeholder="tu@email.com" value={form.mail} onChange={e => setForm({ ...form, mail: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
                </div>
              </div>
              <div style={{ marginBottom: 14 }}>
                <label style={labelStyle}>Asunto</label>
                <input placeholder="¿En qué te podemos ayudar?" value={form.asunto} onChange={e => setForm({ ...form, asunto: e.target.value })} style={{ ...inputStyle, width: '100%' }} />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={labelStyle}>Consulta *</label>
                <textarea placeholder="Contanos tu consulta con detalle..." value={form.consulta} onChange={e => setForm({ ...form, consulta: e.target.value })} rows={5}
                  style={{ ...inputStyle, width: '100%', resize: 'vertical', fontFamily: "'DM Sans', sans-serif" }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 22 }}>
                <input type="checkbox" id="privacy" checked={form.privacy} onChange={e => setForm({ ...form, privacy: e.target.checked })} style={{ marginTop: 3, accentColor: '#5e9e8a', width: 16, height: 16, cursor: 'pointer', flexShrink: 0 }} />
                <label htmlFor="privacy" style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(48% 0.018 50)', cursor: 'pointer', lineHeight: 1.5 }}>
                  He leído y acepto la <span style={{ color: '#5e9e8a', textDecoration: 'underline' }}>Política de Privacidad</span>
                </label>
              </div>
              <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit}>Enviar consulta</Btn>
            </div>
          )}
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background: '#faf5f8', padding: `56px ${px}` }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 34, textAlign: 'center', marginBottom: 28 }}>Preguntas frecuentes</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {[
              ['¿Los talleres tienen fecha de vencimiento?', 'No. Una vez que comprás un taller tenés acceso de por vida.'],
              ['¿Puedo pagar en cuotas?', 'Sí. Ofrecemos 3 cuotas fijas a partir de $50.000 con MercadoPago y MODO.'],
              ['¿Los moldes son en PDF?', 'Sí. Todos los moldes digitales son en PDF listos para imprimir en A4 o plotter.'],
              ['¿Cómo accedo a mis cursos?', 'Una vez que completás la compra, los cursos aparecen en tu panel "Mi Cuenta".'],
            ].map(([q, a]) => <FaqItem key={q} q={q} a={a} />)}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
