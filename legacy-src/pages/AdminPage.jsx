import { useMemo, useState } from 'react';
import { useVecka } from '../context/VeckaContext';
import { useResponsive } from '../hooks/useResponsive';
import Icon from '../components/Icon';
import { Btn, Badge, inputStyle, labelStyle } from '../components/Primitives';

const RECENT_ORDERS = [
  { id: 'ORD-1124', student: 'María González', item: 'Cose desde Cero', amount: '$18.500', status: 'Completado', date: 'Hoy 14:32' },
  { id: 'ORD-1123', student: 'Laura Pérez', item: 'Molde Vestido Camisero', amount: '$2.200', status: 'Completado', date: 'Hoy 11:05' },
  { id: 'ORD-1122', student: 'Ana Rodríguez', item: 'Club VeCKA', amount: '$8.500', status: 'Pendiente', date: 'Ayer 18:20' },
  { id: 'ORD-1121', student: 'Claudia Méndez', item: 'Indumentaria Femenina', amount: '$22.000', status: 'Completado', date: 'Ayer 09:15' },
];

const statusBadge = (status) => ({
  Completado: { color: '#4a7d6e', bg: '#d4f0e6' },
  Pendiente: { color: 'oklch(40% 0.1 65)', bg: 'oklch(95% 0.04 65)' },
  Enviado: { color: 'oklch(35% 0.09 240)', bg: 'oklch(91% 0.04 240)' },
}[status] || { color: '#4a7d6e', bg: '#d4f0e6' });

const emptyCourseForm = () => ({
  title: '',
  subtitle: '',
  category: '',
  level: '',
  price: '',
  priceUSD: '',
  duration: '',
  lessons: '',
  students: '',
  rating: '4.9',
  reviews: '',
  color: '#f4e4d4',
  description: '',
  modulesText: '',
  isMembership: false,
});

const emptyProductForm = () => ({
  title: '',
  category: '',
  subcategory: '',
  price: '',
  priceUSD: '',
  sizes: '',
  badge: '',
  productType: 'downloadable',
  shippingCost: '',
  shippingDays: '',
  downloadUrl: '',
  color: '#f4e4d4',
});

const lessonLabel = (lesson) => (typeof lesson === 'string' ? lesson : lesson?.title || '').trim();

const serializeModules = (modules = []) => modules
  .map((module) => `${module.title}: ${(module.lessons || []).map(lessonLabel).filter(Boolean).join(' | ')}`.trim())
  .join('\n');

const parseModulesInput = (value) => value
  .split('\n')
  .map((line) => line.trim())
  .filter(Boolean)
  .map((line, index) => {
    const [titlePart, lessonsPart = ''] = line.split(':');
    return {
      title: titlePart?.trim() || `Módulo ${index + 1}`,
      lessons: lessonsPart
        .split('|')
        .map((lesson) => lesson.trim())
        .filter(Boolean),
    };
  });

const formatCount = (value, suffix) => {
  if (typeof value === 'number') return `${value.toLocaleString('es-AR')} ${suffix}`;
  return `${value} ${suffix}`;
};

const courseFormFromCourse = (course) => ({
  title: course.title,
  subtitle: course.subtitle,
  category: course.category,
  level: course.level,
  price: String(course.price ?? ''),
  priceUSD: String(course.priceUSD ?? ''),
  duration: course.duration,
  lessons: String(course.lessons ?? ''),
  students: String(course.students ?? ''),
  rating: String(course.rating ?? 5),
  reviews: String(course.reviews ?? ''),
  color: course.color || '#f4e4d4',
  description: course.description || '',
  modulesText: serializeModules(course.modules),
  isMembership: Boolean(course.isMembership),
});

const productFormFromProduct = (product) => ({
  title: product.title,
  category: product.category || '',
  subcategory: product.subcategory || '',
  price: String(product.price ?? ''),
  priceUSD: String(product.priceUSD ?? ''),
  sizes: product.sizes || '',
  badge: product.badge || '',
  productType: product.deliveryMethod === 'correo' ? 'physical' : 'downloadable',
  shippingCost: String(product.shippingCost ?? ''),
  shippingDays: product.shippingDays || '',
  downloadUrl: product.downloadUrl || '',
  color: product.color || '#f4e4d4',
});

function Field({ label, children, fullWidth = false }) {
  return (
    <div style={fullWidth ? { gridColumn: '1 / -1' } : undefined}>
      <label style={labelStyle}>{label}</label>
      {children}
    </div>
  );
}

export default function AdminPage() {
  const {
    user,
    navigate,
    courses,
    products,
    fmt,
    notify,
    createCourse,
    updateCourse,
    deleteCourse,
    createProduct,
    updateProduct,
    deleteProduct,
  } = useVecka();
  const { isMobile } = useResponsive();
  const [section, setSection] = useState('overview');
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourseId, setEditingCourseId] = useState(null);
  const [courseForm, setCourseForm] = useState(emptyCourseForm);
  const [showProductForm, setShowProductForm] = useState(false);
  const [editingProductId, setEditingProductId] = useState(null);
  const [productForm, setProductForm] = useState(emptyProductForm);

  const activeStudents = useMemo(
    () => courses.reduce((sum, course) => sum + (typeof course.students === 'number' ? course.students : 0), 0),
    [courses],
  );

  if (!user || user.role !== 'admin') {
    navigate('home');
    return null;
  }

  const navItems = [
    { id: 'overview', label: 'Resumen', icon: 'home' },
    { id: 'courses', label: 'Cursos', icon: 'book' },
    { id: 'products', label: 'Productos', icon: 'package' },
    { id: 'orders', label: 'Ventas', icon: 'tag' },
    { id: 'students', label: 'Alumnas', icon: 'user' },
    { id: 'settings', label: 'Ajustes', icon: 'settings' },
  ];

  const updateCourseFormField = (key, value) => setCourseForm((prev) => ({ ...prev, [key]: value }));
  const updateProductFormField = (key, value) => setProductForm((prev) => ({ ...prev, [key]: value }));

  const resetCourseEditor = () => {
    setCourseForm(emptyCourseForm());
    setEditingCourseId(null);
    setShowCourseForm(false);
  };

  const resetProductEditor = () => {
    setProductForm(emptyProductForm());
    setEditingProductId(null);
    setShowProductForm(false);
  };

  const [creatingCourse, setCreatingCourse] = useState(false);

  const openCreateCourse = async () => {
    if (creatingCourse) return;
    setCreatingCourse(true);
    try {
      const response = await fetch('/api/admin/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: 'Curso sin título' }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data?.error || 'No se pudo crear el curso');
      window.location.assign(`/admin/courses/${data.course.id}`);
    } catch (error) {
      window.alert(error.message || 'Error al crear el curso');
      setCreatingCourse(false);
    }
  };

  const openEditCourse = (course) => {
    window.location.assign(`/admin/courses/${course.id}`);
  };

  const openCreateProduct = () => {
    setProductForm(emptyProductForm());
    setEditingProductId(null);
    setShowProductForm(true);
  };

  const openEditProduct = (product) => {
    setProductForm(productFormFromProduct(product));
    setEditingProductId(product.id);
    setShowProductForm(true);
  };

  const handleSaveCourse = async () => {
    if (!courseForm.title.trim()) return notify('Completá el nombre del curso', 'error');
    if (!courseForm.subtitle.trim()) return notify('Completá el subtítulo del curso', 'error');
    if (!courseForm.price || Number(courseForm.price) <= 0) return notify('Ingresá un precio en ARS válido', 'error');
    if (!courseForm.priceUSD || Number(courseForm.priceUSD) <= 0) return notify('Ingresá un precio en USD válido', 'error');
    if (!courseForm.description.trim()) return notify('Agregá una descripción del curso', 'error');

    const payload = {
      ...courseForm,
      modules: parseModulesInput(courseForm.modulesText),
    };

    try {
      if (editingCourseId) {
        const updatedCourse = await updateCourse(editingCourseId, payload);
        notify(`Curso "${updatedCourse.title}" actualizado correctamente`);
      } else {
        const newCourse = await createCourse(payload);
        notify(`Curso "${newCourse.title}" creado correctamente`);
      }

      resetCourseEditor();
    } catch (error) {
      notify(error.message || 'No se pudo guardar el curso', 'error');
    }
  };

  const handleSaveProduct = () => {
    if (!productForm.title.trim()) return notify('Completá el nombre del producto', 'error');
    if (!productForm.price || Number(productForm.price) <= 0) return notify('Ingresá un precio en ARS válido', 'error');
    if (!productForm.priceUSD || Number(productForm.priceUSD) <= 0) return notify('Ingresá un precio en USD válido', 'error');
    if (productForm.productType === 'downloadable' && !productForm.downloadUrl.trim()) {
      return notify('Agregá la URL de descarga para el producto digital', 'error');
    }
    if (productForm.productType === 'physical' && !productForm.shippingDays.trim()) {
      return notify('Indicá el plazo de envío por correo', 'error');
    }

    if (editingProductId) {
      const updatedProduct = updateProduct(editingProductId, productForm);
      notify(`Producto "${updatedProduct.title}" actualizado correctamente`);
    } else {
      const newProduct = createProduct(productForm);
      notify(`Producto "${newProduct.title}" creado correctamente`);
    }

    resetProductEditor();
  };

  const handleDeleteCourse = async (course) => {
    if (!window.confirm(`¿Eliminar el curso "${course.title}"? Esta acción no se puede deshacer.`)) return;
    try {
      await deleteCourse(course.id);
      notify(`Curso "${course.title}" eliminado`);
      if (editingCourseId === course.id) resetCourseEditor();
    } catch (error) {
      notify(error.message || 'No se pudo eliminar el curso', 'error');
    }
  };

  const handleDeleteProduct = (product) => {
    if (!window.confirm(`¿Eliminar el producto "${product.title}"? Esta acción no se puede deshacer.`)) return;
    deleteProduct(product.id);
    notify(`Producto "${product.title}" eliminado`);
    if (editingProductId === product.id) resetProductEditor();
  };

  return (
    <div style={{ paddingTop: isMobile ? 60 : 108, minHeight: '100vh', display: 'flex', background: '#faf5f8' }}>
      {isMobile && (
        <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, background: '#fff', borderTop: '1px solid oklch(90% 0.012 60)', zIndex: 200, display: 'flex', padding: '8px 0 12px' }}>
          {navItems.slice(0, 5).map((item) => (
            <button
              key={item.id}
              onClick={() => setSection(item.id)}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, border: 'none', background: 'none', cursor: 'pointer', padding: '4px 0' }}
            >
              <Icon name={item.icon} size={18} color={section === item.id ? '#5e9e8a' : 'oklch(60% 0.018 50)'} />
              <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 9, fontWeight: section === item.id ? 700 : 400, color: section === item.id ? '#5e9e8a' : 'oklch(60% 0.018 50)' }}>{item.label}</span>
            </button>
          ))}
        </div>
      )}

      {!isMobile && (
        <div style={{ width: 220, background: '#fff', borderRight: '1px solid oklch(90% 0.012 60)', position: 'fixed', top: 108, bottom: 0, overflowY: 'auto', zIndex: 50, flexShrink: 0 }}>
          <div style={{ padding: '20px 12px' }}>
            <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', textTransform: 'uppercase', color: 'oklch(60% 0.012 60)', marginBottom: 8, paddingLeft: 10 }}>Panel Admin</div>
            {navItems.map((item) => (
              <button
                key={item.id}
                onClick={() => setSection(item.id)}
                style={{ display: 'flex', alignItems: 'center', gap: 10, width: '100%', padding: '9px 10px', border: 'none', borderRadius: 8, cursor: 'pointer', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: section === item.id ? 600 : 400, background: section === item.id ? '#f0dee7' : 'transparent', color: section === item.id ? '#5e9e8a' : 'oklch(35% 0.018 50)', transition: 'all .15s', marginBottom: 2, textAlign: 'left' }}
              >
                <Icon name={item.icon} size={15} color={section === item.id ? '#5e9e8a' : 'oklch(55% 0.018 50)'} />
                {item.label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div style={{ marginLeft: isMobile ? 0 : 220, flex: 1, padding: isMobile ? '24px 16px 80px' : '32px 36px', minWidth: 0 }}>
        {section === 'overview' && (
          <div>
            <div style={{ marginBottom: 24 }}>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 28 : 34, margin: 0 }}>Buen día, Vero ✨</h1>
              <p style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>Lunes 27 de abril, 2026</p>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)', gap: isMobile ? 12 : 16, marginBottom: 24 }}>
              {[
                { label: 'Ventas este mes', value: '$284.500', sub: '+18% vs anterior', icon: 'tag', color: '#f0dee7' },
                { label: 'Alumnas activas', value: activeStudents.toLocaleString('es-AR'), sub: 'Total estimado actual', icon: 'user', color: '#e0f5ee' },
                { label: 'Cursos activos', value: String(courses.length), sub: `${courses.reduce((sum, course) => sum + (typeof course.modules?.length === 'number' ? course.modules.length : 0), 0)} módulos`, icon: 'book', color: 'oklch(93% 0.03 240)' },
                { label: 'Productos', value: String(products.length), sub: 'Catálogo visible', icon: 'package', color: 'oklch(94% 0.03 60)' },
              ].map((stat) => (
                <div key={stat.label} style={{ background: '#fff', borderRadius: 14, padding: isMobile ? '18px 16px' : '20px 18px', border: '1px solid oklch(90% 0.012 60)' }}>
                  <div style={{ width: 38, height: 38, borderRadius: 10, background: stat.color, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                    <Icon name={stat.icon} size={16} color="oklch(40% 0.1 22)" />
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, fontWeight: 700, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', marginTop: 4 }}>{stat.label}</div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 10, color: '#5e9e8a', marginTop: 2 }}>{stat.sub}</div>
                </div>
              ))}
            </div>

            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(90% 0.012 60)', overflow: 'hidden' }}>
              <div style={{ padding: '18px 20px', borderBottom: '1px solid oklch(92% 0.012 60)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, margin: 0 }}>Ventas recientes</h3>
                <Btn size="sm" variant="ghost" onClick={() => setSection('orders')}>Ver todas</Btn>
              </div>
              <div style={{ overflowX: 'auto' }}>
                {isMobile ? (
                  <div>
                    {RECENT_ORDERS.map((order) => (
                      <div key={order.id} style={{ padding: '14px 18px', borderTop: '1px solid oklch(93% 0.01 60)' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{order.id}</span>
                          <Badge {...statusBadge(order.status)}>{order.status}</Badge>
                        </div>
                        <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 500 }}>{order.student}</div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                          <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{order.date}</span>
                          <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a' }}>{order.amount}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ background: 'oklch(96.5% 0.01 60)' }}>
                        {['Orden', 'Alumna', 'Producto', 'Monto', 'Estado', 'Fecha'].map((header) => (
                          <th key={header} style={{ padding: '10px 18px', textAlign: 'left', fontFamily: "'DM Sans', sans-serif", fontSize: 11, fontWeight: 700, color: 'oklch(52% 0.018 50)', letterSpacing: '0.06em', textTransform: 'uppercase' }}>{header}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_ORDERS.map((order) => (
                        <tr key={order.id} style={{ borderTop: '1px solid oklch(93% 0.01 60)' }}>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{order.id}</td>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13 }}>{order.student}</td>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>{order.item}</td>
                          <td style={{ padding: '13px 18px', fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a' }}>{order.amount}</td>
                          <td style={{ padding: '13px 18px' }}><Badge {...statusBadge(order.status)}>{order.status}</Badge></td>
                          <td style={{ padding: '13px 18px', fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{order.date}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            </div>
          </div>
        )}

        {section === 'courses' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, margin: 0 }}>Gestión de Cursos</h2>
              <Btn icon="plus" size="sm" onClick={openCreateCourse} disabled={creatingCourse}>
                {creatingCourse ? 'Creando…' : 'Nuevo'}
              </Btn>
            </div>

            {showCourseForm && (
              <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 16 : 20, border: '1px solid oklch(88% 0.012 60)', marginBottom: 14 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, margin: '0 0 14px' }}>
                  {editingCourseId ? 'Editar curso' : 'Crear curso'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                  <Field label="Nombre del curso" fullWidth>
                    <input value={courseForm.title} onChange={(e) => updateCourseFormField('title', e.target.value)} placeholder="Ej: Costura para Emprendedoras" style={inputStyle} />
                  </Field>
                  <Field label="Subtítulo" fullWidth>
                    <input value={courseForm.subtitle} onChange={(e) => updateCourseFormField('subtitle', e.target.value)} placeholder="Ej: De la moldería al producto final" style={inputStyle} />
                  </Field>
                  <Field label="Categoría">
                    <input value={courseForm.category} onChange={(e) => updateCourseFormField('category', e.target.value)} placeholder="Ej: Costura Básica" style={inputStyle} />
                  </Field>
                  <Field label="Nivel">
                    <input value={courseForm.level} onChange={(e) => updateCourseFormField('level', e.target.value)} placeholder="Ej: Intermedio" style={inputStyle} />
                  </Field>
                  <Field label="Precio ARS">
                    <input type="number" min="1" value={courseForm.price} onChange={(e) => updateCourseFormField('price', e.target.value)} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Precio USD">
                    <input type="number" min="1" step="0.1" value={courseForm.priceUSD} onChange={(e) => updateCourseFormField('priceUSD', e.target.value)} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Duración">
                    <input value={courseForm.duration} onChange={(e) => updateCourseFormField('duration', e.target.value)} placeholder="Ej: 8 semanas" style={inputStyle} />
                  </Field>
                  <Field label="Cantidad de clases">
                    <input value={courseForm.lessons} onChange={(e) => updateCourseFormField('lessons', e.target.value)} placeholder="Ej: 24 o ∞" style={inputStyle} />
                  </Field>
                  <Field label="Alumnas">
                    <input type="number" min="0" value={courseForm.students} onChange={(e) => updateCourseFormField('students', e.target.value)} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Color de portada">
                    <input type="color" value={courseForm.color} onChange={(e) => updateCourseFormField('color', e.target.value)} style={{ ...inputStyle, padding: 8, height: 46 }} />
                  </Field>
                  <Field label="Rating">
                    <input type="number" min="0" max="5" step="0.1" value={courseForm.rating} onChange={(e) => updateCourseFormField('rating', e.target.value)} placeholder="4.9" style={inputStyle} />
                  </Field>
                  <Field label="Cantidad de reseñas">
                    <input type="number" min="0" value={courseForm.reviews} onChange={(e) => updateCourseFormField('reviews', e.target.value)} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Descripción" fullWidth>
                    <textarea value={courseForm.description} onChange={(e) => updateCourseFormField('description', e.target.value)} placeholder="Descripción pública del curso" style={{ ...inputStyle, minHeight: 110, resize: 'vertical' }} />
                  </Field>
                  <Field label="Módulos y clases" fullWidth>
                    <textarea
                      value={courseForm.modulesText}
                      onChange={(e) => updateCourseFormField('modulesText', e.target.value)}
                      placeholder={'Formato: Título del módulo: Clase 1 | Clase 2 | Clase 3\nOtro módulo: Clase A | Clase B'}
                      style={{ ...inputStyle, minHeight: 130, resize: 'vertical' }}
                    />
                  </Field>
                  <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input id="membership" type="checkbox" checked={courseForm.isMembership} onChange={(e) => updateCourseFormField('isMembership', e.target.checked)} />
                    <label htmlFor="membership" style={{ ...labelStyle, marginBottom: 0 }}>Marcar como membresía</label>
                  </div>
                </div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <Btn size="sm" variant="ghost" onClick={resetCourseEditor}>Cancelar</Btn>
                  <Btn size="sm" icon={editingCourseId ? 'check' : 'plus'} onClick={handleSaveCourse}>
                    {editingCourseId ? 'Guardar cambios' : 'Crear curso'}
                  </Btn>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 12 }}>
              {courses.map((course) => (
                <div key={course.id} style={{ background: '#fff', borderRadius: 12, padding: '16px 18px', border: '1px solid oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', gap: 14, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 9, background: course.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{course.title}</div>
                      {course.isMembership && <Badge>Membresía</Badge>}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(55% 0.018 50)', marginTop: 2 }}>
                      {course.category} · {formatCount(course.students, 'alumnas')} · {formatCount(course.lessons, 'clases')}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>{fmt(course.price, course.priceUSD)}</div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Btn size="sm" variant="outline" onClick={() => openEditCourse(course)}>Editar</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => handleDeleteCourse(course)}>Eliminar</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'products' && (
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, margin: 0 }}>Productos</h2>
              <Btn icon={showProductForm ? 'x' : 'plus'} size="sm" onClick={() => (showProductForm && !editingProductId ? resetProductEditor() : openCreateProduct())}>
                {showProductForm && !editingProductId ? 'Cerrar' : 'Nuevo'}
              </Btn>
            </div>

            {showProductForm && (
              <div style={{ background: '#fff', borderRadius: 14, padding: isMobile ? 16 : 20, border: '1px solid oklch(88% 0.012 60)', marginBottom: 14 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 24, margin: '0 0 14px' }}>
                  {editingProductId ? 'Editar producto' : 'Crear producto'}
                </h3>
                <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : 'repeat(2, 1fr)', gap: 12 }}>
                  <Field label="Nombre del producto" fullWidth>
                    <input value={productForm.title} onChange={(e) => updateProductFormField('title', e.target.value)} placeholder="Ej: Molde Campera Oversize" style={inputStyle} />
                  </Field>
                  <Field label="Tipo">
                    <select value={productForm.productType} onChange={(e) => updateProductFormField('productType', e.target.value)} style={inputStyle}>
                      <option value="downloadable">Descargable</option>
                      <option value="physical">Físico con envío por correo</option>
                    </select>
                  </Field>
                  <Field label="Categoría">
                    <select value={productForm.category} onChange={(e) => updateProductFormField('category', e.target.value)} style={inputStyle}>
                      <option value="">Automática según tipo</option>
                      <option value="Moldes Digitales">Moldes Digitales</option>
                      <option value="Moldes Impresos">Moldes Impresos</option>
                      <option value="Mercería VeCKA">Mercería VeCKA</option>
                    </select>
                  </Field>
                  <Field label="Subcategoría">
                    <input value={productForm.subcategory} onChange={(e) => updateProductFormField('subcategory', e.target.value)} placeholder="Ej: Indumentaria Femenina" style={inputStyle} />
                  </Field>
                  <Field label="Talles / presentación">
                    <input value={productForm.sizes} onChange={(e) => updateProductFormField('sizes', e.target.value)} placeholder="Ej: XS-XXL o Surtido" style={inputStyle} />
                  </Field>
                  <Field label="Precio ARS">
                    <input type="number" min="1" value={productForm.price} onChange={(e) => updateProductFormField('price', e.target.value)} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Precio USD">
                    <input type="number" min="1" step="0.1" value={productForm.priceUSD} onChange={(e) => updateProductFormField('priceUSD', e.target.value)} placeholder="0" style={inputStyle} />
                  </Field>
                  <Field label="Badge">
                    <input value={productForm.badge} onChange={(e) => updateProductFormField('badge', e.target.value)} placeholder="Ej: Nuevo" style={inputStyle} />
                  </Field>
                  <Field label="Color de portada">
                    <input type="color" value={productForm.color} onChange={(e) => updateProductFormField('color', e.target.value)} style={{ ...inputStyle, padding: 8, height: 46 }} />
                  </Field>

                  {productForm.productType === 'downloadable' ? (
                    <Field label="URL de descarga" fullWidth>
                      <input value={productForm.downloadUrl} onChange={(e) => updateProductFormField('downloadUrl', e.target.value)} placeholder="https://..." style={inputStyle} />
                    </Field>
                  ) : (
                    <>
                      <Field label="Costo de envío por correo (ARS)">
                        <input type="number" min="0" value={productForm.shippingCost} onChange={(e) => updateProductFormField('shippingCost', e.target.value)} placeholder="0" style={inputStyle} />
                      </Field>
                      <Field label="Plazo de envío">
                        <input value={productForm.shippingDays} onChange={(e) => updateProductFormField('shippingDays', e.target.value)} placeholder="Ej: 3 a 5 días hábiles" style={inputStyle} />
                      </Field>
                    </>
                  )}
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginTop: 14 }}>
                  <Btn size="sm" variant="ghost" onClick={resetProductEditor}>Cancelar</Btn>
                  <Btn size="sm" icon={editingProductId ? 'check' : 'plus'} onClick={handleSaveProduct}>
                    {editingProductId ? 'Guardar cambios' : 'Guardar producto'}
                  </Btn>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gap: 10 }}>
              {products.map((product) => (
                <div key={product.id} style={{ background: '#fff', borderRadius: 12, padding: '14px 18px', border: '1px solid oklch(88% 0.012 60)', display: 'flex', alignItems: 'center', gap: 12, flexWrap: isMobile ? 'wrap' : 'nowrap' }}>
                  <div style={{ width: 40, height: 40, borderRadius: 8, background: product.color, flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>{product.title}</div>
                      {product.badge && <Badge>{product.badge}</Badge>}
                    </div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)' }}>
                      {product.subcategory} · {product.format}
                      {product.deliveryMethod === 'correo' && ` · Envío: ${fmt(product.shippingCost || 0, (product.shippingCost || 0) / 1000)} (${product.shippingDays || 'a definir'})`}
                      {product.deliveryMethod === 'descarga' && product.downloadUrl && ' · Descarga digital'}
                    </div>
                  </div>
                  <div style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 17, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>{fmt(product.price, product.priceUSD)}</div>
                  <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                    <Btn size="sm" variant="outline" onClick={() => openEditProduct(product)}>Editar</Btn>
                    <Btn size="sm" variant="ghost" onClick={() => handleDeleteProduct(product)}>Eliminar</Btn>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'orders' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 20 }}>Ventas</h2>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              {RECENT_ORDERS.map((order, index) => (
                <div key={order.id} style={{ padding: '14px 18px', borderTop: index > 0 ? '1px solid oklch(93% 0.01 60)' : 'none' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 700, color: '#5e9e8a' }}>{order.id}</span>
                    <Badge {...statusBadge(order.status)}>{order.status}</Badge>
                  </div>
                  <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 500 }}>{order.student} — {order.item}</div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4 }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 12, color: 'oklch(55% 0.018 50)' }}>{order.date}</span>
                    <span style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 18, fontWeight: 700, color: '#5e9e8a' }}>{order.amount}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'students' && (
          <div>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 20 }}>Alumnas</h2>
            <div style={{ background: '#fff', borderRadius: 14, border: '1px solid oklch(88% 0.012 60)', overflow: 'hidden' }}>
              {[
                { name: 'María González', email: 'maria@gmail.com', courses: 3, joined: '15 Mar 2024', status: 'Activa' },
                { name: 'Laura Pérez', email: 'laura.perez@gmail.com', courses: 1, joined: '02 Ene 2025', status: 'Activa' },
                { name: 'Ana Rodríguez', email: 'ana.rod@outlook.com', courses: 5, joined: '28 Jun 2023', status: 'Club' },
              ].map((student, index) => (
                <div key={student.email} style={{ padding: '14px 18px', borderTop: index > 0 ? '1px solid oklch(93% 0.01 60)' : 'none', display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 34, height: 34, borderRadius: '50%', background: '#f0dee7', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 700, color: '#5e9e8a', flexShrink: 0 }}>
                    {student.name[0]}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 14, fontWeight: 600 }}>{student.name}</div>
                    <div style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 11, color: 'oklch(52% 0.018 50)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{student.email}</div>
                  </div>
                  <Badge color="#4a7d6e" bg={student.status === 'Club' ? '#f0dee7' : '#d4f0e6'}>{student.status}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'settings' && (
          <div style={{ maxWidth: 520 }}>
            <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: isMobile ? 24 : 30, marginBottom: 22 }}>Configuración</h2>
            {[
              { section: 'Tienda', fields: [['Moneda base', 'ARS'], ['Pasarelas activas', 'MercadoPago, MODO, PayPal']] },
              { section: 'Escuela', fields: [['Certificados', 'Activados'], ['Soporte por email', 'consultas@vecka.com.ar']] },
            ].map((group) => (
              <div key={group.section} style={{ background: '#fff', borderRadius: 14, padding: '20px 20px', border: '1px solid oklch(88% 0.012 60)', marginBottom: 14 }}>
                <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontSize: 20, marginTop: 0, marginBottom: 14 }}>{group.section}</h3>
                {group.fields.map(([label, value]) => (
                  <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid oklch(93% 0.01 60)' }}>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, color: 'oklch(40% 0.018 50)' }}>{label}</span>
                    <span style={{ fontFamily: "'DM Sans', sans-serif", fontSize: 13, fontWeight: 600 }}>{value}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
