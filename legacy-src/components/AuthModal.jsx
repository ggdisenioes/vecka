import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { Btn, inputStyle } from './Primitives';
import { signIn, signUp } from '@/app/auth/actions';

export default function AuthModal() {
  const { authModal, closeAuthModal, authError, authSuccess, authNext } = useVecka();
  const [tab, setTab] = useState('login');

  if (!authModal) return null;

  return (
    <>
      <div onClick={closeAuthModal} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1200 }} />
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

        {(authError || authSuccess) && (
          <div style={{ marginBottom: 16, borderRadius: 10, padding: '12px 14px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, background: authError ? '#fce8e1' : '#e7f4ed', color: authError ? '#8a3b26' : '#2f6b4f' }}>
            {authError || authSuccess}
          </div>
        )}

        <form action={tab === 'login' ? signIn : signUp} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {tab === 'register' && (
            <input name="full_name" placeholder="Nombre completo" style={inputStyle} />
          )}
          <input name="email" placeholder="Email" required type="email" style={inputStyle} />
          <input name="password" placeholder="Contraseña" required type="password" style={inputStyle} />
          <input name="next" type="hidden" value={authNext} />
          <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }}>
            {tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Btn>
        </form>
      </div>
    </>
  );
}
