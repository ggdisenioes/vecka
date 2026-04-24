import { useEffect } from 'react';
import { VeckaProvider, useVecka } from './context/VeckaContext';
import Header from './components/Header';
import CartSidebar from './components/CartSidebar';
import AuthModal from './components/AuthModal';
import { Toast } from './components/Primitives';
import HomePage from './pages/HomePage';
import EscuelaPage from './pages/EscuelaPage';
import TiendaPage from './pages/TiendaPage';
import CursoPage from './pages/CursoPage';
import CheckoutPage from './pages/CheckoutPage';
import BlogPage from './pages/BlogPage';
import SobreMiPage from './pages/SobreMiPage';
import ContactoPage from './pages/ContactoPage';
import CuentaPage from './pages/CuentaPage';
import AdminPage from './pages/AdminPage';

function PaymentReturnBanner() {
  const { paymentReturn, setPaymentReturn, notify } = useVecka();

  useEffect(() => {
    if (!paymentReturn) return;
    const { status, orderId } = paymentReturn;
    if (status === 'success') {
      notify(`¡Pago confirmado! Orden ${orderId}. Revisá "Mis Compras" para descargar tus moldes.`);
    } else if (status === 'failure') {
      notify(`El pago no pudo procesarse (${orderId}). Podés intentarlo de nuevo.`, 'error');
    } else if (status === 'pending') {
      notify(`Tu pago está pendiente de acreditación (${orderId}). Te avisamos por email cuando esté confirmado.`);
    }
    setPaymentReturn(null);
  }, [paymentReturn]);

  return null;
}

function AppContent() {
  const { page, notification } = useVecka();

  const renderPage = () => {
    switch (page) {
      case 'home':     return <HomePage />;
      case 'escuela':  return <EscuelaPage />;
      case 'tienda':   return <TiendaPage />;
      case 'curso':    return <CursoPage />;
      case 'checkout': return <CheckoutPage />;
      case 'cuenta':   return <CuentaPage />;
      case 'admin':    return <AdminPage />;
      case 'blog':     return <BlogPage />;
      case 'sobre':    return <SobreMiPage />;
      case 'contacto': return <ContactoPage />;
      default:         return <HomePage />;
    }
  };

  return (
    <>
      <Header />
      <main style={{ minHeight: '100vh' }}>
        {renderPage()}
      </main>
      <CartSidebar />
      <AuthModal />
      <Toast notification={notification} />
      <PaymentReturnBanner />
    </>
  );
}

export default function App() {
  return (
    <VeckaProvider>
      <AppContent />
    </VeckaProvider>
  );
}
