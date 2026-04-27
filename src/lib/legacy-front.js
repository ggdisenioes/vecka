import { getCurrentAuth } from '@/lib/auth'
import { getCourseBySlug } from '@/lib/lms'
import { getSupabasePublic } from '@/lib/supabase/public'

const COURSE_COLORS = ['#f4e4d4', '#e8d5e8', '#d4e8d4', '#e8e4d4', '#f4d4d4', '#d4d8e8']
const PRODUCT_COLORS = ['#f4e4d4', '#e8d5e8', '#d4e8d4', '#d4e8e8', '#e8ead4', '#f0e4d8']

function withColor(index, palette, fallback) {
  return palette[index % palette.length] || fallback
}

function mapLessonTitles(lessons = []) {
  return lessons.map((lesson) => lesson.title)
}

function mapLegacyModules(modules = []) {
  return modules
    .slice()
    .sort((left, right) => left.position - right.position)
    .map((module) => ({
      id: module.id,
      title: module.title,
      lessons: mapLessonTitles(module.lessons || []),
    }))
}

function countLessons(modules = []) {
  return modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
}

function mapLegacyCourse(course, index = 0) {
  const modules = mapLegacyModules(course.modules || [])
  const totalLessons = countLessons(course.modules || [])

  return {
    id: course.id,
    slug: course.slug,
    title: course.title,
    subtitle: course.subtitle || course.description || '',
    category: course.category || 'Curso',
    level: course.level || 'Todos los niveles',
    price: Number(course.price_ars || 0),
    priceUSD: Number(course.price_usd || 0),
    duration: course.duration_label || 'A tu ritmo',
    lessons: totalLessons || 0,
    students: Number(course.students_count || 0),
    rating: Number(course.rating || 4.9),
    reviews: Number(course.reviews_count || 0),
    color: withColor(index, COURSE_COLORS, '#f4e4d4'),
    description: course.description || '',
    modules,
    enrolled: false,
    progress: 0,
    isMembership: Boolean(course.is_membership),
  }
}

function mapLegacyProduct(product, index = 0) {
  return {
    id: product.id,
    title: product.title,
    category: product.category || 'Producto',
    subcategory: product.subcategory || product.product_type || '',
    price: Number(product.price_ars || 0),
    priceUSD: Number(product.price_usd || 0),
    format: product.product_type === 'downloadable' ? 'PDF' : 'Físico',
    sizes: product.sizes_label || 'Único',
    color: withColor(index, PRODUCT_COLORS, '#f4e4d4'),
    badge: product.badge || null,
    productType: product.product_type,
    deliveryMethod: product.product_type === 'downloadable' ? 'descarga' : 'correo',
    shippingCost: Number(product.shipping_cost_ars || 0),
    shippingDays: product.shipping_days || '',
    downloadUrl: product.download_url || '',
  }
}

function mapLegacyUser(user, profile) {
  if (!user) return null

  const name = profile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario'
  const role = ['admin', 'editorial'].includes(profile?.role) ? 'admin' : 'student'
  const initials = name
    .split(' ')
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  return {
    id: user.id,
    name,
    email: user.email || '',
    avatar: initials || 'V',
    role,
  }
}

export async function getLegacyFrontData({ courseSlug } = {}) {
  const supabase = getSupabasePublic()
  const { user, profile } = await getCurrentAuth()

  const [coursesResult, productsResult, selectedCourse] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        *,
        modules:course_modules(
          *,
          lessons:course_lessons(*)
        )
      `)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .order('position', { foreignTable: 'course_modules', ascending: true })
      .order('position', { foreignTable: 'course_modules.course_lessons', ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    courseSlug ? getCourseBySlug(courseSlug) : Promise.resolve(null),
  ])

  if (coursesResult.error) {
    throw new Error(`Error loading legacy courses: ${coursesResult.error.message}`)
  }

  if (productsResult.error) {
    throw new Error(`Error loading legacy products: ${productsResult.error.message}`)
  }

  const rawCourses = coursesResult.data || []
  const mergedCourses = selectedCourse
    ? rawCourses.some((course) => course.id === selectedCourse.id)
      ? rawCourses.map((course) => (course.id === selectedCourse.id ? selectedCourse : course))
      : [selectedCourse, ...rawCourses]
    : rawCourses

  const courses = mergedCourses.map((course, index) => mapLegacyCourse(course, index))
  const products = (productsResult.data || []).map((product, index) => mapLegacyProduct(product, index))
  const legacyUser = mapLegacyUser(user, profile)
  const selectedLegacyCourse = selectedCourse
    ? courses.find((course) => course.slug === selectedCourse.slug) || null
    : null

  return {
    courses,
    products,
    user: legacyUser,
    selectedCourseId: selectedLegacyCourse?.id || null,
  }
}
