import { getSupabasePublic } from '@/lib/supabase/public'
import { getSupabaseServer } from '@/lib/supabase/server'

function handleError(label, error) {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
  }
}

const COURSE_TREE_SELECT = `
  *,
  materials:course_materials!course_materials_course_id_fkey(*),
  modules:course_modules(
    *,
    materials:course_materials!course_materials_module_id_fkey(*),
    lessons:course_lessons(
      *,
      materials:course_materials!course_materials_lesson_id_fkey(*)
    )
  )
`

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
    .select(COURSE_TREE_SELECT)
    .eq('slug', slug)
    .maybeSingle()

  handleError('Error loading course', result.error)
  return result.data
}

export async function getCourseById(id) {
  const supabase = await getSupabaseServer()
  const result = await supabase
    .from('courses')
    .select(COURSE_TREE_SELECT)
    .eq('id', id)
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

export async function getVisibleMaterialById(id) {
  const supabase = await getSupabaseServer()
  const result = await supabase
    .from('course_materials')
    .select('id, bucket_name, storage_path, file_name')
    .eq('id', id)
    .maybeSingle()

  handleError('Error loading material', result.error)
  return result.data
}

export { getVisibleMaterialById as getVisibleAttachmentById }
