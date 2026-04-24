import { useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { Btn, inputStyle } from './Primitives';

export default function AuthModal() {
  const { authModal, setAuthModal, login, loginWithApi, registerWithApi, notify } = useVecka();
  const [tab, setTab] = useState('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!authModal) return null;

  const reset = () => { setName(''); setEmail(''); setPass(''); setPhone(''); setError(''); };

  const handleSubmit = async () => {
    if (!email || !pass) { setError('Email y contraseña son requeridos'); return; }
    if (tab === 'register' && !name) { setError('El nombre es requerido'); return; }
    setLoading(true);
    setError('');
    try {
      if (tab === 'login') {
        await loginWithApi(email.trim(), pass);
      } else {
        await registerWithApi(name.trim(), email.trim(), pass, phone.trim());
      }
      reset();
    } catch (err) {
      setError(err.message || 'Error al conectar con el servidor');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => { if (e.key === 'Enter') handleSubmit(); };

  return (
    <>
      <div onClick={() => { setAuthModal(null); reset(); }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.5)', zIndex: 1200 }} />
      <div style={{ position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%,-50%)', background: '#fff', borderRadius: 20, padding: 40, width: 'min(420px, calc(100vw - 32px))', zIndex: 1201, boxShadow: '0 24px 80px rgba(0,0,0,.2)', maxHeight: '90vh', overflowY: 'auto' }}>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <img src="/logo-VeCKA.jpg" alt="VeCKA" style={{ height: 56, width: 56, objectFit: 'cover', borderRadius: 10, margin: '0 auto 8px', display: 'block' }} />
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>
            {tab === 'login' ? 'Iniciá sesión en tu cuenta' : 'Creá tu cuenta gratuita'}
          </div>
        </div>

        {/* Tab switcher */}
        <div style={{ display: 'flex', background: 'oklch(95% 0.01 60)', borderRadius: 8, marginBottom: 22, padding: 3 }}>
          {[['login', 'Iniciar sesión'], ['register', 'Registrarme']].map(([t, label]) => (
            <button key={t} onClick={() => { setTab(t); reset(); }}
              style={{ flex: 1, padding: '8px', border: 'none', cursor: 'pointer', borderRadius: 6, fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600, background: tab === t ? '#fff' : 'transparent', color: tab === t ? '#5e9e8a' : 'oklch(52% 0.018 50)', transition: 'all .15s', boxShadow: tab === t ? '0 2px 8px rgba(0,0,0,.08)' : 'none' }}>
              {label}
            </button>
          ))}
        </div>

        {/* Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {tab === 'register' && (
            <input placeholder="Nombre completo *" value={name} onChange={e => setName(e.target.value)} style={inputStyle} />
          )}
          <input placeholder="Email *" type="email" value={email} onChange={e => setEmail(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} />
          <input placeholder="Contraseña *" type="password" value={pass} onChange={e => setPass(e.target.value)} onKeyDown={handleKeyDown} style={inputStyle} />
          {tab === 'register' && (
            <input placeholder="Teléfono (opcional)" value={phone} onChange={e => setPhone(e.target.value)} style={inputStyle} />
          )}

          {error && (
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: '#c0392b', background: '#fde8e8', borderRadius: 8, padding: '10px 14px' }}>
              {error}
            </div>
          )}

          <Btn size="lg" style={{ width: '100%', justifyContent: 'center' }} onClick={handleSubmit} disabled={loading}>
            {loading ? 'Cargando...' : tab === 'login' ? 'Entrar' : 'Crear cuenta'}
          </Btn>
        </div>

        {/* Demo buttons */}
        <div style={{ marginTop: 20, textAlign: 'center' }}>
          <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(60% 0.012 60)', marginBottom: 8 }}>— Modo demo (sin backend) —</div>
          <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
            <Btn size="sm" variant="outline" onClick={() => { reset(); login('student'); }}>Ver como Alumna</Btn>
            <Btn size="sm" variant="ghost" onClick={() => { reset(); login('admin'); }}>Ver como Admin</Btn>
          </div>
        </div>
      </div>
    </>
  );
}
