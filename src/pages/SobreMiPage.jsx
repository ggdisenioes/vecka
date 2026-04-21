import { useVecka } from '../context/VeckaContext';
import Icon from '../components/Icon';
import { Btn, SectionHeader } from '../components/Primitives';
import Footer from '../components/Footer';

export default function SobreMiPage() {
  const { navigate } = useVecka();

  return (
    <div style={{ paddingTop: 108 }}>
      {/* Hero */}
      <div style={{ background: '#faf5f8', padding: '72px 80px 0' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 420px', gap: 80, alignItems: 'end' }}>
          <div style={{ paddingBottom: 60 }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5e9e8a', marginBottom: 16 }}>Conoceme</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 58, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.05, color: 'oklch(16% 0.022 50)' }}>Soy Vero Dorado</h1>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, fontStyle: 'italic', color: '#5e9e8a', marginBottom: 24 }}>¡Hola! Bienvenidas/os a este espacio.</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', maxWidth: 540, marginBottom: 20 }}>
              Aunque algunas ya me conocen de VeCKA, mi nombre es Vero. Soy costurera de corazón, hilos y agujas, y hoy soy modelista industrial.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 16, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', maxWidth: 540, marginBottom: 32 }}>
              Me dedico al diseño de indumentaria, trabajo con diseñadoras y actualmente estoy completando mi formación en moldería industrial — en la que trabajo hace 12 años.
            </p>
            <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
              {[['12 años', 'en costura'], ['8 años', 'enseñando'], ['5.400+', 'alumnas'], ['48', 'talleres']].map(([val, label]) => (
                <div key={label} style={{ background: '#fff', borderRadius: 14, padding: '16px 20px', border: '1px solid #f0dee7', textAlign: 'center', minWidth: 100 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 28, fontWeight: 700, color: '#5e9e8a' }}>{val}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {/* Photo placeholder */}
          <div style={{ height: 520, background: '#c5dfce', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.15) 20px, rgba(255,255,255,.15) 21px)' }} />
            <div style={{ position: 'relative', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.35)', fontStyle: 'italic', textAlign: 'center' }}>Foto de Vero{'\n'}400×520px</div>
          </div>
        </div>
      </div>

      {/* Historia */}
      <div style={{ background: '#fff', padding: '80px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
          <div style={{ height: 420, background: '#f0dee7', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.3)', fontStyle: 'italic' }}>Foto taller / costura</div>
          </div>
          <div>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5e9e8a', marginBottom: 12 }}>Mi historia</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 40, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.15 }}>VeCKA intenta dar a conocer las posibilidades infinitas que brinda la costura</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', marginBottom: 16 }}>
              VeCKA nació en 2014 después de ese largo recorrido personal en el que aprendí sobre el oficio. Las primeras alumnas fueron niñas; esa fue una hermosa experiencia que no me olvido todavía.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', marginBottom: 16 }}>
              A partir del 2017 comencé a dar clases en el Atelier de manera presencial y fui descubriendo el uso de las diferentes medidas de moldería, clasificándolas al margen, y fue ahí que me ganó la fama (para cuando la ganara, se entiende).
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 15, lineHeight: 1.8, color: 'oklch(42% 0.018 50)' }}>
              En 2020 crecimos con una nueva plataforma de clases virtuales y moldería digital. Hoy mi objetivo es que cualquier persona pueda llegar al nivel del oficio que quiera.
            </p>
          </div>
        </div>
      </div>

      {/* Valores */}
      <div style={{ background: '#faf5f8', padding: '72px 80px' }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader eyebrow="Por qué VeCKA" title="Lo que nos hace diferentes" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 24 }}>
            {[
              { icon: 'star', title: 'Enseñanza con amor', desc: 'Cada clase está pensada con paciencia y dedicación. Nunca te vas a sentir perdida.' },
              { icon: 'check', title: 'Moldes sin fallas', desc: 'Probamos cada molde antes de publicarlo. La calidad técnica es innegociable.' },
              { icon: 'user', title: 'Comunidad real', desc: 'No sos un número. Respondemos consultas, acompañamos el proceso y celebramos tus logros.' },
            ].map(v => (
              <div key={v.title} style={{ background: '#fff', borderRadius: 18, padding: '32px 28px', border: '1px solid #f0dee7' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#c5dfce', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon name={v.icon} size={22} color="#3d6b5e" />
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, fontWeight: 600, margin: '0 0 10px' }}>{v.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(48% 0.018 50)', lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 48 }}>
            <Btn size="lg" onClick={() => navigate('escuela')}>Ver todos los talleres</Btn>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
