import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from './Icon';
import { Btn } from './Primitives';

export default function CartSidebar() {
  const { cart, cartOpen, setCartOpen, removeFromCart, cartTotal, fmt, navigate } = useVecka();
  const { isMobile } = useResponsive();
  if (!cartOpen) return null;

  const width = isMobile ? '100%' : 400;

  return (
    <>
      <div onClick={() => setCartOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 1100 }} />
      <div style={{
        position: 'fixed', right: 0, top: 0, bottom: 0, width,
        background: '#fff', zIndex: 1101, display: 'flex', flexDirection: 'column',
        boxShadow: '-8px 0 40px rgba(0,0,0,.14)',
        animation: 'slideInRight .28s cubic-bezier(.22,1,.36,1)',
      }}>
        <style>{`@keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }`}</style>
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid oklch(90% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 22, margin: 0, fontWeight: 600 }}>
            Carrito ({cart.length})
          </h3>
          <button onClick={() => setCartOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, borderRadius: 8, color: 'oklch(40% 0.018 50)' }}>
            <Icon name="x" size={20} />
          </button>
        </div>

        {/* Items */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px' }}>
          {cart.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 0', color: 'oklch(52% 0.018 50)', fontFamily: "'DM Sans', sans-serif" }}>
              <Icon name="cart" size={40} color="oklch(80% 0.012 60)" />
              <p style={{ marginTop: 14, fontSize: 14 }}>Tu carrito está vacío</p>
            </div>
          ) : cart.map(item => (
            <div key={item.id} style={{ display: 'flex', gap: 14, padding: '14px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
              <div style={{ width: 54, height: 54, borderRadius: 10, background: item.color || 'oklch(94% 0.02 60)', flexShrink: 0 }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600, color: 'oklch(18% 0.022 50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.title}</div>
                <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(52% 0.018 50)', marginTop: 2 }}>{item.category}</div>
                <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a', marginTop: 3 }}>{fmt(item.price, item.priceUSD)}</div>
              </div>
              <button onClick={() => removeFromCart(item.id)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'oklch(65% 0.018 50)', alignSelf: 'flex-start', padding: 4 }}>
                <Icon name="x" size={14} />
              </button>
            </div>
          ))}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div style={{ padding: '20px 24px', borderTop: '1px solid oklch(90% 0.012 60)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontWeight: 600, fontSize: 16 }}>Total</span>
              <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 26, fontWeight: 700, color: '#5e9e8a' }}>{fmt(cartTotal, cartTotal)}</span>
            </div>
            <Btn style={{ width: '100%', justifyContent: 'center' }} size="lg" onClick={() => { setCartOpen(false); navigate('checkout'); }}>
              Finalizar compra
            </Btn>
            <div style={{ marginTop: 12, display: 'flex', gap: 8, justifyContent: 'center' }}>
              {['MercadoPago', 'MODO', 'PayPal'].map(p => (
                <span key={p} style={{ fontSize: 10, background: 'oklch(94% 0.012 60)', padding: '4px 8px', borderRadius: 4, fontFamily: "'DM Sans', sans-serif", color: 'oklch(52% 0.018 50)', fontWeight: 500 }}>{p}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
