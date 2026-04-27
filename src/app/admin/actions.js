'use server'

import { revalidatePath } from 'next/cache'
import { requireRoles } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { normalizeLessonVideoFields } from '@/lib/vimeo'

function slugify(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function toInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toFloat(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

function requireText(value, fieldLabel) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error(`${fieldLabel} is required`)
  }

  return normalized
}

async function uniqueSlug(table, title, currentId = null) {
  const supabase = getSupabaseAdmin()
  const base = slugify(title) || `${table}-${Date.now()}`
  let slug = base
  let counter = 2

  while (true) {
    const query = supabase.from(table).select('id').eq('slug', slug)
    const { data, error } = currentId
      ? await query.neq('id', currentId).limit(1)
      : await query.limit(1)

    if (error) throw error
    if (!data?.length) return slug
    slug = `${base}-${counter}`
    counter += 1
  }
}

async function uniqueLessonSlug(moduleId, title, currentId = null) {
  const supabase = getSupabaseAdmin()
  const base = slugify(title) || `lesson-${Date.now()}`
  let slug = base
  let counter = 2

  while (true) {
    let query = supabase
      .from('course_lessons')
      .select('id')
      .eq('module_id', moduleId)
      .eq('slug', slug)
      .limit(1)

    if (currentId) {
      query = query.neq('id', currentId)
    }

    const { data, error } = await query
    if (error) throw error
    if (!data?.length) return slug

    slug = `${base}-${counter}`
    counter += 1
  }
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/editorial')
  revalidatePath('/courses')
  revalidatePath('/courses/[slug]', 'page')
  revalidatePath('/products')
}

export async function createCourse(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const title = requireText(formData.get('title'), 'Course title')
  const slug = await uniqueSlug('courses', title)

  const payload = {
    slug,
    title,
    subtitle: String(formData.get('subtitle') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    category: String(formData.get('category') || '').trim(),
    level: String(formData.get('level') || '').trim(),
    duration_label: String(formData.get('duration_label') || '').trim(),
    price_ars: toInteger(formData.get('price_ars')),
    price_usd: toFloat(formData.get('price_usd')),
    status: String(formData.get('status') || 'draft'),
    visibility: String(formData.get('visibility') || 'private'),
    cover_image_url: String(formData.get('cover_image_url') || '').trim(),
    is_membership: formData.get('is_membership') === 'on',
  }

  const { error } = await supabase.from('courses').insert(payload)
  if (error) throw error
  revalidateAll()
}

export async function updateCourse(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const title = requireText(formData.get('title'), 'Course title')

  const payload = {
    slug: await uniqueSlug('courses', title, id),
    title,
    subtitle: String(formData.get('subtitle') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    category: String(formData.get('category') || '').trim(),
    level: String(formData.get('level') || '').trim(),
    duration_label: String(formData.get('duration_label') || '').trim(),
    price_ars: toInteger(formData.get('price_ars')),
    price_usd: toFloat(formData.get('price_usd')),
    status: String(formData.get('status') || 'draft'),
    visibility: String(formData.get('visibility') || 'private'),
    cover_image_url: String(formData.get('cover_image_url') || '').trim(),
    is_membership: formData.get('is_membership') === 'on',
  }

  const { error } = await supabase.from('courses').update(payload).eq('id', id)
  if (error) throw error
  revalidateAll()
}

export async function deleteCourse(formData) {
  await requireRoles(['admin'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const { error } = await supabase.from('courses').delete().eq('id', id)
  if (error) throw error
  revalidateAll()
}

export async function createModule(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const courseId = String(formData.get('course_id'))
  const title = requireText(formData.get('title'), 'Module title')

  const { data: existing, error: positionError } = await supabase
    .from('course_modules')
    .select('position')
    .eq('course_id', courseId)
    .order('position', { ascending: false })
    .limit(1)

  if (positionError) throw positionError

  const { error } = await supabase.from('course_modules').insert({
    course_id: courseId,
    title,
    description: String(formData.get('description') || '').trim(),
    position: (existing?.[0]?.position || 0) + 1,
  })

  if (error) throw error
  revalidateAll()
}

export async function updateModule(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const title = requireText(formData.get('title'), 'Module title')
  const { error } = await supabase.from('course_modules').update({
    title,
    description: String(formData.get('description') || '').trim(),
    position: toInteger(formData.get('position'), 1),
  }).eq('id', id)

  if (error) throw error
  revalidateAll()
}

export async function deleteModule(formData) {
  await requireRoles(['admin'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const { error } = await supabase.from('course_modules').delete().eq('id', id)
  if (error) throw error
  revalidateAll()
}

export async function createLesson(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const moduleId = String(formData.get('module_id'))
  const title = requireText(formData.get('title'), 'Lesson title')
  const videoFields = normalizeLessonVideoFields(formData.get('video_provider'), {
    externalVideoUrl: formData.get('external_video_url'),
    vimeoUrl: formData.get('vimeo_url'),
  })

  const { data: existing, error: positionError } = await supabase
    .from('course_lessons')
    .select('position')
    .eq('module_id', moduleId)
    .order('position', { ascending: false })
    .limit(1)

  if (positionError) throw positionError

  const { error } = await supabase.from('course_lessons').insert({
    module_id: moduleId,
    slug: await uniqueLessonSlug(moduleId, title),
    title,
    summary: String(formData.get('summary') || '').trim(),
    body: String(formData.get('body') || '').trim(),
    status: String(formData.get('status') || 'draft'),
    is_preview: formData.get('is_preview') === 'on',
    position: (existing?.[0]?.position || 0) + 1,
    ...videoFields,
  })

  if (error) throw error
  revalidateAll()
}

export async function updateLesson(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const title = requireText(formData.get('title'), 'Lesson title')
  const { data: lesson, error: loadError } = await supabase
    .from('course_lessons')
    .select('module_id')
    .eq('id', id)
    .maybeSingle()

  if (loadError) throw loadError
  if (!lesson?.module_id) throw new Error('Lesson not found')

  const videoFields = normalizeLessonVideoFields(formData.get('video_provider'), {
    externalVideoUrl: formData.get('external_video_url'),
    vimeoUrl: formData.get('vimeo_url'),
  })

  const { error } = await supabase.from('course_lessons').update({
    slug: await uniqueLessonSlug(lesson.module_id, title, id),
    title,
    summary: String(formData.get('summary') || '').trim(),
    body: String(formData.get('body') || '').trim(),
    status: String(formData.get('status') || 'draft'),
    is_preview: formData.get('is_preview') === 'on',
    position: toInteger(formData.get('position'), 1),
    ...videoFields,
  }).eq('id', id)

  if (error) throw error
  revalidateAll()
}

export async function deleteLesson(formData) {
  await requireRoles(['admin'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const { error } = await supabase.from('course_lessons').delete().eq('id', id)
  if (error) throw error
  revalidateAll()
}

export async function deleteAttachment(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const bucket = String(formData.get('bucket_name'))
  const path = String(formData.get('storage_path'))

  const { error: storageError } = await supabase.storage.from(bucket).remove([path])
  if (storageError) throw storageError

  const { error } = await supabase.from('lesson_attachments').delete().eq('id', id)
  if (error) throw error
  revalidateAll()
}

export async function createProduct(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const title = String(formData.get('title') || '').trim()
  const slug = await uniqueSlug('products', title)

  const { error } = await supabase.from('products').insert({
    slug,
    title,
    category: String(formData.get('category') || '').trim(),
    subcategory: String(formData.get('subcategory') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    price_ars: toInteger(formData.get('price_ars')),
    price_usd: toFloat(formData.get('price_usd')),
    format: String(formData.get('format') || '').trim(),
    sizes: String(formData.get('sizes') || '').trim(),
    badge: String(formData.get('badge') || '').trim(),
    product_type: String(formData.get('product_type') || 'downloadable'),
    delivery_method: String(formData.get('delivery_method') || 'download'),
    shipping_cost_ars: toInteger(formData.get('shipping_cost_ars')),
    shipping_days: String(formData.get('shipping_days') || '').trim(),
    download_url: String(formData.get('download_url') || '').trim(),
    color_hex: String(formData.get('color_hex') || '#f4e4d4'),
    status: String(formData.get('status') || 'draft'),
  })

  if (error) throw error
  revalidateAll()
}

export async function updateProduct(formData) {
  await requireRoles(['admin', 'editorial'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const title = String(formData.get('title') || '').trim()

  const { error } = await supabase.from('products').update({
    slug: await uniqueSlug('products', title, id),
    title,
    category: String(formData.get('category') || '').trim(),
    subcategory: String(formData.get('subcategory') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    price_ars: toInteger(formData.get('price_ars')),
    price_usd: toFloat(formData.get('price_usd')),
    format: String(formData.get('format') || '').trim(),
    sizes: String(formData.get('sizes') || '').trim(),
    badge: String(formData.get('badge') || '').trim(),
    product_type: String(formData.get('product_type') || 'downloadable'),
    delivery_method: String(formData.get('delivery_method') || 'download'),
    shipping_cost_ars: toInteger(formData.get('shipping_cost_ars')),
    shipping_days: String(formData.get('shipping_days') || '').trim(),
    download_url: String(formData.get('download_url') || '').trim(),
    color_hex: String(formData.get('color_hex') || '#f4e4d4'),
    status: String(formData.get('status') || 'draft'),
  }).eq('id', id)

  if (error) throw error
  revalidateAll()
}

export async function deleteProduct(formData) {
  await requireRoles(['admin'])
  const supabase = getSupabaseAdmin()
  const id = String(formData.get('id'))
  const { error } = await supabase.from('products').delete().eq('id', id)
  if (error) throw error
  revalidateAll()
}
