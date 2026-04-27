import { getSupabasePublic } from '@/lib/supabase/public'
import { getSupabaseServer } from '@/lib/supabase/server'

function handleError(label, error) {
  if (error) {
    throw new Error(`${label}: ${error.message}`)
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
