import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getCourseBySlug } from '@/lib/lms'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabasePublic } from '@/lib/supabase/public'
import { getSupabaseServer } from '@/lib/supabase/server'

const COURSE_COLORS = ['#f4e4d4', '#e8d5e8', '#d4e8d4', '#e8e4d4', '#f4d4d4', '#d4d8e8']
const PRODUCT_COLORS = ['#f4e4d4', '#e8d5e8', '#d4e8d4', '#d4e8e8', '#e8ead4', '#f0e4d8']

function withColor(index, palette, fallback) {
  return palette[index % palette.length] || fallback
}

function sortByPosition(items = []) {
  return items
    .slice()
    .sort((left, right) => Number(left?.position || 0) - Number(right?.position || 0))
}

function sortBySortOrder(items = []) {
  return items
    .slice()
    .sort((left, right) => Number(left?.sort_order || 0) - Number(right?.sort_order || 0))
}

function mapLegacyMaterials(materials = []) {
  return materials
    .slice()
    .sort((left, right) => Number(left?.sort_order || 0) - Number(right?.sort_order || 0))
    .map((material) => ({
      id: material.id,
      fileName: material.file_name,
      href: `/api/attachments/${material.id}`,
      mimeType: material.mime_type || '',
      sizeBytes: Number(material.size_bytes || 0),
    }))
}

function mapLegacyVideo(record = {}) {
  const provider = record.video_provider || 'none'
  return {
    provider,
    vimeoUrl: record.vimeo_url || '',
    externalUrl: record.external_video_url || '',
    storagePath: record.video_storage_path || '',
    bucket: record.video_bucket || 'course-videos',
    durationSeconds: Number(record.video_duration_seconds || 0),
  }
}

function mapLegacyLessons(lessons = []) {
  return sortByPosition(lessons).map((lesson) => ({
    id: lesson.id,
    slug: lesson.slug,
    title: lesson.title,
    summary: lesson.summary || '',
    body: lesson.body || '',
    status: lesson.status || 'draft',
    isPreview: Boolean(lesson.is_preview),
    video: mapLegacyVideo(lesson),
    videoProvider: lesson.video_provider || 'none',
    vimeoUrl: lesson.vimeo_url || '',
    externalVideoUrl: lesson.external_video_url || '',
    videoStoragePath: lesson.video_storage_path || '',
    videoDurationSeconds: Number(lesson.video_duration_seconds || 0),
    materials: mapLegacyMaterials(lesson.materials || []),
    attachments: mapLegacyMaterials(lesson.materials || []),
  }))
}

function mapLegacyModules(modules = []) {
  return sortByPosition(modules).map((module) => ({
    id: module.id,
    title: module.title,
    description: module.description || '',
    video: mapLegacyVideo(module),
    videoProvider: module.video_provider || 'none',
    vimeoUrl: module.vimeo_url || '',
    externalVideoUrl: module.external_video_url || '',
    videoStoragePath: module.video_storage_path || '',
    videoDurationSeconds: Number(module.video_duration_seconds || 0),
    materials: mapLegacyMaterials(module.materials || []),
    lessons: mapLegacyLessons(module.lessons || []),
  }))
}

function mapConstructorSections(sections = []) {
  return sortBySortOrder(sections).map((section) => ({
    id: section.id,
    title: section.title,
    description: '',
    video: { provider: 'none', vimeoUrl: '', externalUrl: '', storagePath: '', bucket: 'course-videos', durationSeconds: 0 },
    videoProvider: 'none',
    vimeoUrl: '',
    externalVideoUrl: '',
    videoStoragePath: '',
    videoDurationSeconds: 0,
    materials: [],
    lessons: sortBySortOrder(section.lessons || []).map((lesson) => ({
      id: lesson.id,
      slug: lesson.slug,
      title: lesson.title,
      summary: lesson.summary || '',
      body: lesson.body || '',
      status: lesson.status || 'draft',
      isPreview: Boolean(lesson.is_preview),
      video: mapLegacyVideo(lesson),
      videoProvider: lesson.video_provider || 'none',
      vimeoUrl: lesson.vimeo_url || '',
      externalVideoUrl: lesson.external_video_url || '',
      videoStoragePath: lesson.video_storage_path || '',
      videoDurationSeconds: Number(lesson.video_duration_seconds || 0),
      materials: mapLegacyMaterials(lesson.materials || []),
      attachments: mapLegacyMaterials(lesson.materials || []),
    })),
  }))
}

function countLessons(modules = []) {
  return modules.reduce((sum, module) => sum + (module.lessons?.length || 0), 0)
}

function mapLegacyCourse(course, index = 0, access = {}) {
  const legacyModules = mapLegacyModules(course.modules || [])
  const constructorModules = mapConstructorSections(course.sections || [])
  const modules = [...legacyModules, ...constructorModules]
  const totalLessons = countLessons(modules)

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
    coverImageUrl: course.cover_image_url || '',
    materials: mapLegacyMaterials(course.materials || []),
    modules,
    enrolled: Boolean(access.enrolled),
    canAccess: Boolean(access.canAccess),
    progress: Number(access.progress || 0),
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

const LEGACY_COURSE_TREE_SELECT = `
  *,
  materials:course_materials!course_materials_course_id_fkey(*),
  modules:course_modules(
    *,
    materials:course_materials!course_materials_module_id_fkey(*),
    lessons:course_lessons(
      *,
      materials:course_materials!course_materials_lesson_id_fkey(*)
    )
  ),
  sections:course_sections(
    *,
    lessons:course_lessons!course_lessons_section_id_fkey(
      *,
      materials:course_materials!course_materials_lesson_id_fkey(*)
    )
  )
`

export async function getLegacyFrontData({ courseSlug } = {}) {
  const supabase = getSupabasePublic()
  const { user, profile } = await getCurrentAuth()
  const staffPreview = courseSlug && isStaff(profile)
  const serverSupabase = user ? await getSupabaseServer() : null

  const [coursesResult, productsResult, selectedCourse, enrollmentsResult, userGrantsResult] = await Promise.all([
    supabase
      .from('courses')
      .select(LEGACY_COURSE_TREE_SELECT)
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .order('position', { foreignTable: 'course_modules', ascending: true })
      .order('position', { foreignTable: 'course_modules.course_lessons', ascending: true }),
    supabase
      .from('products')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false }),
    courseSlug
      ? staffPreview
        ? getSupabaseAdmin()
            .from('courses')
            .select(LEGACY_COURSE_TREE_SELECT)
            .eq('slug', courseSlug)
            .maybeSingle()
            .then((r) => r.data)
        : getCourseBySlug(courseSlug)
      : Promise.resolve(null),
    serverSupabase
      ? serverSupabase
          .from('course_enrollments')
          .select('course_id')
          .eq('user_id', user.id)
          .eq('access_status', 'active')
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      : Promise.resolve({ data: [], error: null }),
    serverSupabase
      ? serverSupabase
          .from('membership_grants')
          .select('id, tier_id, access_status, granted_at, expires_at, starts_at, membership_tiers(id, slug, name, billing_period, price_ars, features, description)')
          .eq('user_id', user.id)
          .eq('access_status', 'active')
          .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
      : Promise.resolve({ data: [], error: null }),
  ])

  if (coursesResult.error) {
    throw new Error(`Error loading legacy courses: ${coursesResult.error.message}`)
  }

  if (productsResult.error) {
    throw new Error(`Error loading legacy products: ${productsResult.error.message}`)
  }

  if (enrollmentsResult?.error) {
    throw new Error(`Error loading enrollments: ${enrollmentsResult.error.message}`)
  }

  const rawCourses = coursesResult.data || []
  const mergedCourses = selectedCourse
    ? rawCourses.some((course) => course.id === selectedCourse.id)
      ? rawCourses.map((course) => (course.id === selectedCourse.id ? selectedCourse : course))
      : [selectedCourse, ...rawCourses]
    : rawCourses

  const enrolledCourseIds = new Set((enrollmentsResult?.data || []).map((enrollment) => enrollment.course_id))
  const userIsStaff = isStaff(profile)

  // Membership-based course access
  const activeGrants = userGrantsResult?.data || []
  const activeTierIds = activeGrants.map((g) => g.tier_id).filter(Boolean)
  let membershipCourseIds = new Set()
  if (activeTierIds.length > 0) {
    const { data: tierCourses } = await getSupabaseAdmin()
      .from('membership_tier_courses')
      .select('course_id')
      .in('tier_id', activeTierIds)
    membershipCourseIds = new Set((tierCourses || []).map((tc) => tc.course_id))
  }

  const userMemberships = activeGrants.map((g) => ({
    id: g.id,
    tierId: g.tier_id,
    tierSlug: g.membership_tiers?.slug || null,
    tierName: g.membership_tiers?.name || 'Membresía',
    billingPeriod: g.membership_tiers?.billing_period || null,
    priceArs: Number(g.membership_tiers?.price_ars || 0),
    features: Array.isArray(g.membership_tiers?.features) ? g.membership_tiers.features : [],
    description: g.membership_tiers?.description || '',
    grantedAt: g.granted_at || null,
    startsAt: g.starts_at || null,
    expiresAt: g.expires_at || null,
    accessStatus: g.access_status,
  }))

  const courses = mergedCourses.map((course, index) => {
    const enrolled = enrolledCourseIds.has(course.id)
    return mapLegacyCourse(course, index, {
      enrolled,
      canAccess: enrolled || userIsStaff || membershipCourseIds.has(course.id),
      progress: enrolled ? 0 : 0,
    })
  })
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
    userMemberships,
  }
}
