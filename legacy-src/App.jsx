'use client';

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
    </>
  );
}

export default function App({
  initialPage = 'home',
  initialUser = null,
  initialCourses,
  initialProducts,
  initialSelectedCourseId = null,
}) {
  return (
    <VeckaProvider
      initialCourses={initialCourses}
      initialPage={initialPage}
      initialProducts={initialProducts}
      initialSelectedCourseId={initialSelectedCourseId}
      initialUser={initialUser}
    >
      <AppContent />
    </VeckaProvider>
  );
}
