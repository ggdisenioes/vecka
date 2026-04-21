import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import { useAnimateOnScroll, fadeUpStyle } from '../hooks/useAnimateOnScroll';
import Icon from '../components/Icon';
import { Btn, SectionHeader } from '../components/Primitives';
import Footer from '../components/Footer';

export default function SobreMiPage() {
  const { navigate } = useVecka();
  const { isMobile, isTablet } = useResponsive();
  const { ref: r1, visible: v1 } = useAnimateOnScroll();
  const { ref: r2, visible: v2 } = useAnimateOnScroll();
  const { ref: r3, visible: v3 } = useAnimateOnScroll();
  const px = isMobile ? '20px' : isTablet ? '32px' : '80px';

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108 }}>
      {/* Hero */}
      <div style={{ background: '#faf5f8', padding: isMobile ? '44px 20px 0' : `72px ${px} 0` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 380px', gap: isTablet ? 36 : 80, alignItems: 'end' }}>
          <div ref={r1} style={{ paddingBottom: isTablet ? 40 : 60, ...fadeUpStyle(v1, 0) }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5e9e8a', marginBottom: 14 }}>Conoceme</div>
            <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 40 : isTablet ? 50 : 58, fontWeight: 600, margin: '0 0 8px', lineHeight: 1.05 }}>Soy Vero Dorado</h1>
            <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 18 : 22, fontStyle: 'italic', color: '#5e9e8a', marginBottom: 20 }}>¡Hola! Bienvenidas/os a este espacio.</div>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 16, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', maxWidth: 540, marginBottom: 18 }}>
              Aunque algunas ya me conocen de VeCKA, mi nombre es Vero. Soy costurera de corazón, hilos y agujas, y hoy soy modelista industrial.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 16, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', maxWidth: 540, marginBottom: 28 }}>
              Me dedico al diseño de indumentaria y actualmente estoy completando mi formación en moldería industrial — en la que trabajo hace 12 años.
            </p>
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {[['12 años', 'en costura'], ['8 años', 'enseñando'], ['5.400+', 'alumnas'], ['48', 'talleres']].map(([val, label]) => (
                <div key={label} style={{ background: '#fff', borderRadius: 14, padding: isMobile ? '12px 16px' : '16px 20px', border: '1px solid #f0dee7', textAlign: 'center', minWidth: isMobile ? 80 : 100 }}>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 22 : 28, fontWeight: 700, color: '#5e9e8a' }}>{val}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>{label}</div>
                </div>
              ))}
            </div>
          </div>
          {!isTablet && (
            <div style={{ height: 520, background: '#c5dfce', borderRadius: '20px 20px 0 0', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'repeating-linear-gradient(45deg, transparent, transparent 20px, rgba(255,255,255,.15) 20px, rgba(255,255,255,.15) 21px)' }} />
              <div style={{ position: 'relative', fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.3)', fontStyle: 'italic', textAlign: 'center' }}>Foto de Vero</div>
            </div>
          )}
        </div>
      </div>

      {/* Historia */}
      <div ref={r2} style={{ background: '#fff', padding: `72px ${px}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto', display: 'grid', gridTemplateColumns: isTablet ? '1fr' : '1fr 1fr', gap: isTablet ? 36 : 80, alignItems: 'center' }}>
          {!isMobile && (
            <div style={{ height: isTablet ? 280 : 420, background: '#f0dee7', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', ...fadeUpStyle(v2, 0) }}>
              <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 16, color: 'rgba(0,0,0,.3)', fontStyle: 'italic' }}>Foto taller / costura</div>
            </div>
          )}
          <div style={{ ...fadeUpStyle(v2, 0.1) }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: '#5e9e8a', marginBottom: 12 }}>Mi historia</div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 30 : 40, fontWeight: 600, margin: '0 0 20px', lineHeight: 1.15 }}>VeCKA intenta dar a conocer las posibilidades infinitas que brinda la costura</h2>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', marginBottom: 16 }}>
              VeCKA nació en 2014 después de ese largo recorrido personal en el que aprendí sobre el oficio. Las primeras alumnas fueron niñas; esa fue una hermosa experiencia que no me olvido todavía.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: 'oklch(42% 0.018 50)', marginBottom: 16 }}>
              A partir del 2017 comencé a dar clases en el Atelier de manera presencial, clasificando las medidas al margen — y fue ahí que me ganó la fama.
            </p>
            <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: isMobile ? 14 : 15, lineHeight: 1.8, color: 'oklch(42% 0.018 50)' }}>
              En 2020 crecimos con una nueva plataforma de clases virtuales y moldería digital.
            </p>
          </div>
        </div>
      </div>

      {/* Valores */}
      <div ref={r3} style={{ background: '#faf5f8', padding: `72px ${px}` }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <SectionHeader eyebrow="Por qué VeCKA" title="Lo que nos hace diferentes" />
          <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', gap: isMobile ? 16 : 24 }}>
            {[
              { icon: 'star', title: 'Enseñanza con amor', desc: 'Cada clase está pensada con paciencia y dedicación. Nunca te vas a sentir perdida.', delay: 0 },
              { icon: 'check', title: 'Moldes sin fallas', desc: 'Probamos cada molde antes de publicarlo. La calidad técnica es innegociable.', delay: 0.1 },
              { icon: 'user', title: 'Comunidad real', desc: 'No sos un número. Respondemos consultas y celebramos tus logros.', delay: 0.2 },
            ].map(v => (
              <div key={v.title} style={{ background: '#fff', borderRadius: 18, padding: '30px 26px', border: '1px solid #f0dee7', ...fadeUpStyle(v3, v.delay) }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: '#c5dfce', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 18 }}>
                  <Icon name={v.icon} size={22} color="#3d6b5e" />
                </div>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 20 : 24, fontWeight: 600, margin: '0 0 10px' }}>{v.title}</h3>
                <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(48% 0.018 50)', lineHeight: 1.7, margin: 0 }}>{v.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ textAlign: 'center', marginTop: 44 }}>
            <Btn size="lg" onClick={() => navigate('escuela')}>Ver todos los talleres</Btn>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
