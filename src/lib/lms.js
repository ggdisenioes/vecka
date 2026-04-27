import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getSupabasePublic } from '@/lib/supabase/public'
import { getSupabaseServer } from '@/lib/supabase/server'

function handleError(label, error) {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }
}

export async function getAdminDashboardData() {
  const supabase = getSupabaseAdmin()

  const [
    coursesResult,
    productsResult,
    attachmentsResult,
  ] = await Promise.all([
    supabase
      .from('courses')
      .select(`
        *,
        modules:course_modules(
          *,
          lessons:course_lessons(
            *,
            attachments:lesson_attachments(*)
          )
        )
      `)
      .order('created_at', { ascending: false })
      .order('position', { foreignTable: 'course_modules', ascending: true })
      .order('position', { foreignTable: 'course_modules.course_lessons', ascending: true }),
    supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false }),
    supabase
      .from('lesson_attachments')
      .select('id', { count: 'exact', head: true }),
  ])

  handleError('Error loading courses', coursesResult.error)
  handleError('Error loading products', productsResult.error)
  handleError('Error loading attachment metrics', attachmentsResult.error)

  return {
    courses: coursesResult.data || [],
    products: productsResult.data || [],
    metrics: {
      courses: coursesResult.data?.length || 0,
      lessons: (coursesResult.data || []).reduce(
        (sum, course) => sum + (course.modules || []).reduce((moduleSum, module) => moduleSum + (module.lessons?.length || 0), 0),
        0,
      ),
      attachments: attachmentsResult.count || 0,
      products: productsResult.data?.length || 0,
    },
  }
}

export async function getPublishedCourses() {
  const supabase = getSupabasePublic()
  const result = await supabase
    .from('courses')
    .select('id, slug, title, subtitle, description, category, level, duration_label, cover_image_url, status, visibility, price_ars, price_usd, is_membership')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  handleError('Error loading published courses', result.error)
  return result.data || []
}

export async function getCourseBySlug(slug) {
  const supabase = await getSupabaseServer()
  const result = await supabase
    .from('courses')
    .select(`
      *,
      modules:course_modules(
        *,
        lessons:course_lessons(
          *,
          attachments:lesson_attachments(*)
        )
      )
    `)
    .eq('slug', slug)
    .maybeSingle()

  handleError('Error loading course', result.error)
  return result.data
}

export async function getPublishedProducts() {
  const supabase = getSupabasePublic()
  const result = await supabase
    .from('products')
    .select('*')
    .eq('status', 'published')
    .order('created_at', { ascending: false })

  handleError('Error loading products', result.error)
  return result.data || []
}

export async function getVisibleAttachmentById(id) {
  const supabase = await getSupabaseServer()
  const result = await supabase
    .from('lesson_attachments')
    .select('id, bucket_name, storage_path')
    .eq('id', id)
    .maybeSingle()

  handleError('Error loading attachment', result.error)
  return result.data
}
