import { createContext, useContext, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

export const COURSES = [
  {
    id: 1,
    slug: 'cose-desde-cero',
    title: 'Cose desde Cero',
    subtitle: 'El punto de partida para todas las costureras',
    category: 'Costura Básica',
    level: 'Principiante',
    price: 18500,
    priceUSD: 19,
    duration: '8 semanas',
    lessons: 24,
    students: 1240,
    rating: 4.9,
    reviews: 318,
    color: '#f4e4d4',
    description: 'Aprendé todo lo que necesitás para empezar a coser: máquinas, telas, costuras básicas, terminaciones y tu primer prenda completa.',
    modules: [
      { title: 'Introducción a la costura', lessons: ['El taller y sus herramientas', 'Tipos de máquinas de coser', 'Hilo, aguja y tensión', 'Tu primer costura'] },
      { title: 'Telas y materiales', lessons: ['Tipos de tela', 'Corte y margen de costura', 'Entretelas y avíos', 'Patronaje básico'] },
      { title: 'Técnicas esenciales', lessons: ['Costuras rectas y curvas', 'Pinzas y fruncidos', 'Cierres y botones', 'Terminaciones profesionales'] },
      { title: 'Tu primera prenda', lessons: ['Pantalón palazzo', 'Blusa básica', 'Falda midi', 'Proyecto final'] },
    ],
    enrolled: true,
    progress: 62,
  },
  {
    id: 2,
    slug: 'indumentaria-femenina',
    title: 'Indumentaria Femenina',
    subtitle: 'Confeccioná ropa que realmente te queda',
    category: 'Indumentaria Femenina',
    level: 'Intermedio',
    price: 22000,
    priceUSD: 22,
    duration: '10 semanas',
    lessons: 30,
    students: 890,
    rating: 4.8,
    reviews: 224,
    color: '#e8d5e8',
    description: 'Domina la moldería y confección de prendas femeninas: vestidos, blusas, sacos y más.',
    modules: [
      { title: 'Moldería femenina base', lessons: ['Toma de medidas', 'Trazo de molde base cuerpo', 'Trazo de molde base falda', 'Ajustes y graduación'] },
      { title: 'Prendas superiores', lessons: ['Blusa básica con cuello', 'Camisa con pinzas', 'Top cruzado', 'Remera con mangas raglan'] },
      { title: 'Prendas inferiores', lessons: ['Falda lápiz', 'Pantalón pinzado', 'Short con vuelo', 'Culotte'] },
      { title: 'Prendas completas', lessons: ['Vestido camisero', 'Vestido envolvente', 'Jumpsuit', 'Proyecto final'] },
    ],
    enrolled: true,
    progress: 30,
  },
  {
    id: 3,
    slug: 'bebes-y-ninos',
    title: 'Bebés y Niños',
    subtitle: 'Cosé con amor para los más chiquitos',
    category: 'Bebés y Niños',
    level: 'Principiante',
    price: 16500,
    priceUSD: 17,
    duration: '6 semanas',
    lessons: 18,
    students: 2100,
    rating: 5.0,
    reviews: 512,
    color: '#d4e8d4',
    description: 'Aprende a confeccionar ropa para bebés y niños con moldería específica para cada etapa.',
    modules: [
      { title: 'Bebés 0-24 meses', lessons: ['Body básico', 'Enterito con pie', 'Jardinero', 'Ajuar completo'] },
      { title: 'Niños 2-8 años', lessons: ['Remera básica', 'Pantalón con elástico', 'Vestido con volados', 'Pijama'] },
      { title: 'Niños 8-16 años', lessons: ['Remera colegial', 'Jogger', 'Bermuda', 'Campera'] },
    ],
    enrolled: false,
    progress: 0,
  },
  {
    id: 4,
    slug: 'accesorios-bolsos',
    title: 'Accesorios y Bolsos',
    subtitle: 'Crea tus propias carteras, bolsos y más',
    category: 'Accesorios y Deco',
    level: 'Principiante',
    price: 14000,
    priceUSD: 14,
    duration: '5 semanas',
    lessons: 15,
    students: 670,
    rating: 4.7,
    reviews: 189,
    color: '#e8e4d4',
    description: 'Desde una cartera acolchada hasta una mochila resistente. Aprende a hacer tus propios accesorios.',
    modules: [
      { title: 'Carteras y bolsos pequeños', lessons: ['Cartera sobre', 'Cosmetiquera acolchada', 'Neceser con cierre', 'Bolsito de mano'] },
      { title: 'Bolsos medianos', lessons: ['Tote bag', 'Bolso bucket', 'Cartera con asa', 'Bolso mensajero'] },
      { title: 'Mochilas y accesorios grandes', lessons: ['Mochila básica', 'Mochila escolar', 'Porta documentos', 'Proyecto final'] },
    ],
    enrolled: false,
    progress: 0,
  },
  {
    id: 5,
    slug: 'club-vecka',
    title: 'Club VeCKA',
    subtitle: 'Membresía mensual — cosé con propósito',
    category: 'Membresía',
    level: 'Todos los niveles',
    price: 8500,
    priceUSD: 9,
    duration: 'Mensual',
    lessons: '∞',
    students: 3400,
    rating: 4.9,
    reviews: 890,
    color: '#f4d4d4',
    isMembership: true,
    description: 'Acceso ilimitado a todos los talleres del mes + molde exclusivo + comunidad privada.',
    modules: [],
    enrolled: true,
    progress: 100,
  },
  {
    id: 6,
    slug: 'molderia-industrial',
    title: 'Moldería Industrial',
    subtitle: 'Profesionalizate con técnicas industriales',
    category: 'Avanzado',
    level: 'Avanzado',
    price: 28000,
    priceUSD: 28,
    duration: '12 semanas',
    lessons: 36,
    students: 340,
    rating: 4.9,
    reviews: 98,
    color: '#d4d8e8',
    description: 'Técnicas profesionales de moldería industrial: trazo, graduación de talles y producción en serie.',
    modules: [],
    enrolled: false,
    progress: 0,
  },
];

const INITIAL_PRODUCTS = [
  { id: 101, title: 'Molde Remera Básica Adulto', category: 'Moldes Digitales', subcategory: 'Indumentaria Femenina', price: 1800, priceUSD: 2, format: 'PDF', sizes: 'XS-XXL', color: '#f4e4d4', badge: null },
  { id: 102, title: 'Molde Vestido Camisero', category: 'Moldes Digitales', subcategory: 'Indumentaria Femenina', price: 2200, priceUSD: 2.5, format: 'PDF', sizes: 'XS-XXL', color: '#e8d5e8', badge: 'Nuevo' },
  { id: 103, title: 'Molde Pantalón Palazzo', category: 'Moldes Digitales', subcategory: 'Indumentaria Femenina', price: 2000, priceUSD: 2, format: 'PDF', sizes: 'XS-XXL', color: '#d4e8d4', badge: null },
  { id: 104, title: 'Molde Body Bebé 0-24m', category: 'Moldes Digitales', subcategory: 'Bebés y Niños', price: 1500, priceUSD: 1.5, format: 'PDF', sizes: '0-24m', color: '#d4e8e8', badge: 'Top ventas' },
  { id: 105, title: 'Molde Remera Infantil Colegial', category: 'Moldes Digitales', subcategory: 'Bebés y Niños', price: 1600, priceUSD: 1.6, format: 'PDF', sizes: '2-16', color: '#e8ead4', badge: 'Molde del mes' },
  { id: 106, title: 'Molde Bolso Bucket', category: 'Moldes Digitales', subcategory: 'Accesorios', price: 1400, priceUSD: 1.5, format: 'PDF', sizes: 'Único', color: '#f0e4d8', badge: null },
  { id: 107, title: 'Kit Costuras Básicas — Papel', category: 'Moldes Impresos', subcategory: 'Moldes Impresos', price: 5500, priceUSD: 6, format: 'Papel', sizes: 'XS-XXL', color: '#ecdfd4', badge: null },
  { id: 108, title: 'Set Agujas Schmetz x10', category: 'Mercería VeCKA', subcategory: 'Mercería', price: 3200, priceUSD: 3.5, format: 'Físico', sizes: 'Surtido', color: '#f4e4d4', badge: null },
  { id: 109, title: 'Kit Entretelas Surtidas', category: 'Mercería VeCKA', subcategory: 'Mercería', price: 4800, priceUSD: 5, format: 'Físico', sizes: '50cm x 100cm', color: '#e4ecd4', badge: null },
];

export const PRODUCTS = INITIAL_PRODUCTS;

const MOCK_USER_STUDENT = {
  id: 1,
  name: 'María González',
  email: 'maria@gmail.com',
  avatar: 'MG',
  role: 'student',
  memberSince: 'Marzo 2024',
  coursesEnrolled: 3,
  completedLessons: 28,
  certificates: 0,
  purchases: [
    { id: 'ORD-001', date: '15 Mar 2026', items: 'Molde Remera Básica Adulto', total: 1800, status: 'Completado', currency: 'ARS' },
    { id: 'ORD-002', date: '02 Feb 2026', items: 'Cose desde Cero + Indumentaria Femenina', total: 40500, status: 'Completado', currency: 'ARS' },
    { id: 'ORD-003', date: '10 Ene 2026', items: 'Club VeCKA — Enero', total: 8500, status: 'Completado', currency: 'ARS' },
  ],
};

export const MOCK_USER_STUDENT_DATA = MOCK_USER_STUDENT;

const MOCK_USER_ADMIN = {
  id: 99,
  name: 'Vero (Admin)',
  email: 'vero@vecka.com.ar',
  avatar: 'V',
  role: 'admin',
};

const VeckaContext = createContext(null);

const slugify = (value) => value
  .toLowerCase()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

const createUniqueSlug = (title, list, currentId = null) => {
  const base = slugify(title) || `curso-${Date.now()}`;
  let slug = base;
  let suffix = 2;

  while (list.some((item) => item.slug === slug && item.id !== currentId)) {
    slug = `${base}-${suffix}`;
    suffix += 1;
  }

  return slug;
};

const parseNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const sanitizeModules = (modules = []) => modules
  .map((module, index) => ({
    title: module.title?.trim() || `Módulo ${index + 1}`,
    lessons: Array.isArray(module.lessons)
      ? module.lessons.map((lesson) => lesson.trim()).filter(Boolean)
      : [],
  }))
  .filter((module) => module.title || module.lessons.length > 0);

const normalizeCoursePayload = (payload, existingCourse, list) => {
  const modules = sanitizeModules(payload.modules);

  return {
    id: existingCourse?.id ?? Math.max(0, ...list.map((course) => Number(course.id) || 0)) + 1,
    slug: createUniqueSlug(payload.title, list, existingCourse?.id ?? null),
    title: payload.title.trim(),
    subtitle: payload.subtitle.trim(),
    category: payload.category.trim() || 'General',
    level: payload.level.trim() || 'Todos los niveles',
    price: parseNumber(payload.price, 0),
    priceUSD: parseNumber(payload.priceUSD, 0),
    duration: payload.duration.trim() || 'A definir',
    lessons: payload.lessons === '∞' ? '∞' : parseNumber(payload.lessons, modules.reduce((sum, module) => sum + module.lessons.length, 0)),
    students: parseNumber(payload.students, 0),
    rating: parseNumber(payload.rating, 5),
    reviews: parseNumber(payload.reviews, 0),
    color: payload.color || '#f4e4d4',
    description: payload.description.trim(),
    modules,
    enrolled: existingCourse?.enrolled ?? false,
    progress: existingCourse?.progress ?? 0,
    isMembership: Boolean(payload.isMembership),
  };
};

const normalizeProductPayload = (payload, existingProduct, list) => {
  const isDownloadable = payload.productType === 'downloadable';
  const baseCategory = isDownloadable ? 'Moldes Digitales' : 'Mercería VeCKA';

  return {
    id: existingProduct?.id ?? Math.max(0, ...list.map((product) => Number(product.id) || 0)) + 1,
    title: payload.title.trim(),
    category: payload.category || baseCategory,
    subcategory: payload.subcategory.trim() || (isDownloadable ? 'Descargable' : 'Producto Físico'),
    price: parseNumber(payload.price, 0),
    priceUSD: parseNumber(payload.priceUSD, 0),
    format: isDownloadable ? 'PDF' : 'Físico',
    sizes: payload.sizes.trim() || 'Único',
    color: payload.color || '#f4e4d4',
    badge: payload.badge?.trim() || null,
    productType: payload.productType,
    deliveryMethod: isDownloadable ? 'descarga' : 'correo',
    shippingCost: isDownloadable ? 0 : parseNumber(payload.shippingCost, 0),
    shippingDays: isDownloadable ? '' : payload.shippingDays.trim(),
    downloadUrl: isDownloadable ? payload.downloadUrl.trim() : '',
  };
};

const pageToPath = (page, extra = {}, selectedCourse = null) => {
  switch (page) {
    case 'home':
      return '/';
    case 'escuela':
      return '/courses';
    case 'tienda':
      return '/products';
    case 'curso': {
      const course = extra.course || selectedCourse;
      return course?.slug ? `/courses/${course.slug}` : '/courses';
    }
    case 'checkout':
      return '/checkout';
    case 'cuenta':
      return '/cuenta';
    case 'admin':
      return '/admin';
    case 'blog':
      return '/blog';
    case 'sobre':
      return '/sobre';
    case 'contacto':
      return '/contacto';
    default:
      return '/';
  }
};

export function VeckaProvider({
  children,
  initialPage = 'home',
  initialUser = null,
  initialCourses = COURSES,
  initialProducts = INITIAL_PRODUCTS,
  initialSelectedCourseId = null,
}) {
  const router = useRouter();
  const [page, setPage] = useState(initialPage);
  const [user, setUser] = useState(initialUser);
  const [currency, setCurrency] = useState('ARS');
  const [cart, setCart] = useState([]);
  const [courses, setCourses] = useState(initialCourses);
  const [products, setProducts] = useState(initialProducts);
  const [selectedCourseId, setSelectedCourseId] = useState(initialSelectedCourseId);
  const [cartOpen, setCartOpen] = useState(false);
  const [authModal, setAuthModal] = useState(null);
  const [notification, setNotification] = useState(null);

  const selectedCourse = useMemo(
    () => courses.find((course) => course.id === selectedCourseId) ?? null,
    [courses, selectedCourseId],
  );

  const navigate = (p, extra = {}) => {
    setPage(p);
    if (extra.course) setSelectedCourseId(extra.course.id);
    router.push(pageToPath(p, extra, extra.course || selectedCourse));
    if (typeof window !== 'undefined') window.scrollTo(0, 0);
  };

  const notify = (msg, type = 'success') => {
    setNotification({ msg, type });
    setTimeout(() => setNotification(null), 3200);
  };

  const addToCart = (item) => {
    setCart((prev) => {
      const exists = prev.find((cartItem) => cartItem.id === item.id);
      if (exists) {
        notify('Ya está en tu carrito');
        return prev;
      }
      notify(`"${item.title}" agregado al carrito ✓`);
      return [...prev, { ...item, qty: 1 }];
    });
    setCartOpen(true);
  };

  const removeFromCart = (id) => setCart((prev) => prev.filter((item) => item.id !== id));
  const cartTotal = cart.reduce((sum, item) => sum + (currency === 'ARS' ? item.price : item.priceUSD), 0);

  const createCourse = (payload) => {
    let createdCourse;
    setCourses((prev) => {
      createdCourse = normalizeCoursePayload(payload, null, prev);
      return [createdCourse, ...prev];
    });
    return createdCourse;
  };

  const updateCourse = (id, payload) => {
    let updatedCourse = null;

    setCourses((prev) => prev.map((course) => {
      if (course.id !== id) return course;
      updatedCourse = normalizeCoursePayload(payload, course, prev);
      return updatedCourse;
    }));

    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedCourse } : item)));
    return updatedCourse;
  };

  const deleteCourse = (id) => {
    setCourses((prev) => prev.filter((course) => course.id !== id));
    setCart((prev) => prev.filter((item) => item.id !== id));
    setSelectedCourseId((prev) => (prev === id ? null : prev));
  };

  const createProduct = (payload) => {
    let createdProduct;
    setProducts((prev) => {
      createdProduct = normalizeProductPayload(payload, null, prev);
      return [createdProduct, ...prev];
    });
    return createdProduct;
  };

  const updateProduct = (id, payload) => {
    let updatedProduct = null;

    setProducts((prev) => prev.map((product) => {
      if (product.id !== id) return product;
      updatedProduct = normalizeProductPayload(payload, product, prev);
      return updatedProduct;
    }));

    setCart((prev) => prev.map((item) => (item.id === id ? { ...item, ...updatedProduct } : item)));
    return updatedProduct;
  };

  const deleteProduct = (id) => {
    setProducts((prev) => prev.filter((product) => product.id !== id));
    setCart((prev) => prev.filter((item) => item.id !== id));
  };

  const login = (role) => {
    setUser(role === 'admin' ? MOCK_USER_ADMIN : MOCK_USER_STUDENT);
    setAuthModal(null);
    notify(`¡Bienvenida, ${role === 'admin' ? 'Vero' : 'María'}!`);
    if (role === 'admin') navigate('admin');
    else navigate('cuenta');
  };

  const logout = () => {
    setUser(null);
    if (typeof window !== 'undefined') {
      window.location.assign('/logout');
    }
  };

  const fmt = (ars, usd) => (currency === 'ARS'
    ? `$${Number(ars).toLocaleString('es-AR')}`
    : `USD ${Number(usd).toFixed(2)}`);

  return (
    <VeckaContext.Provider
      value={{
        page,
        navigate,
        user,
        login,
        logout,
        currency,
        setCurrency,
        cart,
        addToCart,
        removeFromCart,
        cartTotal,
        cartOpen,
        setCartOpen,
        authModal,
        setAuthModal,
        notification,
        selectedCourse,
        setSelectedCourse: (course) => setSelectedCourseId(course?.id ?? null),
        courses,
        products,
        createCourse,
        updateCourse,
        deleteCourse,
        createProduct,
        updateProduct,
        deleteProduct,
        fmt,
        notify,
      }}
    >
      {children}
    </VeckaContext.Provider>
  );
}

export const useVecka = () => useContext(VeckaContext);
