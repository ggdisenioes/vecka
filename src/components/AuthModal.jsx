import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { Btn, inputStyle } from './Primitives';

export default function AuthModal() {
  const { authModal, setAuthModal, login } = useVecka();
  const [tab, setTab] = useState('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');

  if (!authModal) return null;

  return (
    <>
      <div onClick={() => setAuthModal(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1200 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 20, padding: 40, width: 420, zIndex: 1201, boxShadow: '0 24px 80px rgba(0,0,0,.2)' }}>
        <div style={{ textAlign: 'center', marginBottom: 28 }}>
          <img src="/logo-VeCKA.jpg" alt="VeCKA" style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 10, margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>
            {tab === 'login' ? 'Iniciá sesión en tu cuenta' : 'Creá tu cuenta gratuita'}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'oklch(95% 0.01 60)', borderRadius: 8, marginBottom: 24, padding: 3 }}>
          {['login', 'register'].map(t => (
            <button key={t} onClick={() => setTab(t)}
              style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#5e9e8a' : 'oklch(52% 0.018 50)', transition: 'all .15s', boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,.08)' : 'none' }}>
              {t === 'login' ? 'Iniciar sesión' : 'Registrarme'}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <input placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} style={inputStyle} />
          <input placeholder="Contraseña" type="password" value={pass} onChange={e => setPass(e.target.value)} style={inputStyle} />
          <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={() => login('student')}>
            {tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Btn>
        </div>

        <div style={{ marginTop: 20, textAlign: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)' }}>Demo:</div>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 8 }}>
          <Btn size="sm" variant="outline" onClick={() => login('student')}>Entrar como Alumna</Btn>
          <Btn size="sm" variant="ghost" onClick={() => login('admin')}>Entrar como Admin</Btn>
        </div>
      </div>
    </>
  );
}
