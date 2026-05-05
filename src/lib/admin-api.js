import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export function jsonError(message, status = 400) {
  return NextResponse.json({ error: message }, { status })
}

export async function requireStaff() {
  const { user, profile } = await getCurrentAuth()
  if (!user) return { error: jsonError('Unauthorized', 401) }
  if (!profile || !['admin', 'editorial'].includes(profile.role)) {
    return { error: jsonError('Forbidden', 403) }
  }
  return { user, profile }
}

export async function requireAdmin() {
  const { user, profile } = await getCurrentAuth()
  if (!user) return { error: jsonError('Unauthorized', 401) }
  if (!profile || profile.role !== 'admin') {
    return { error: jsonError('Forbidden', 403) }
  }
  return { user, profile }
}

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function requireText(value, label) {
  const normalized = String(value || '').trim()
  if (!normalized) throw new Error(`${label} is required`)
  return normalized
}

export function toInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value ?? ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

export function toFloat(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value ?? ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

export async function uniqueCourseSlug(title, currentId = null) {
  const supabase = getSupabaseAdmin()
  const base = slugify(title) || `course-${Date.now()}`
  let slug = base
  let counter = 2
  while (true) {
    let query = supabase.from('courses').select('id').eq('slug', slug).limit(1)
    if (currentId) query = query.neq('id', currentId)
    const { data, error } = await query
    if (error) throw error
    if (!data?.length) return slug
    slug = `${base}-${counter}`
    counter += 1
  }
}

export async function uniqueLessonSlug(moduleId, title, currentId = null) {
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
    if (currentId) query = query.neq('id', currentId)
    const { data, error } = await query
    if (error) throw error
    if (!data?.length) return slug
    slug = `${base}-${counter}`
    counter += 1
  }
}

export async function uniqueTierSlug(name, currentId = null) {
  const supabase = getSupabaseAdmin()
  const base = slugify(name) || `tier-${Date.now()}`
  let slug = base
  let counter = 2
  while (true) {
    let query = supabase
      .from('membership_tiers')
      .select('id')
      .eq('slug', slug)
      .limit(1)
    if (currentId) query = query.neq('id', currentId)
    const { data, error } = await query
    if (error) throw error
    if (!data?.length) return slug
    slug = `${base}-${counter}`
    counter += 1
  }
}

export function revalidateCourses() {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/admin/courses')
  revalidatePath('/courses')
  revalidatePath('/courses/[slug]', 'page')
}

export function revalidateMemberships() {
  revalidatePath('/')
  revalidatePath('/admin/membresias')
  revalidatePath('/admin/membresias/[id]', 'page')
  revalidatePath('/membresia')
  revalidatePath('/membresia/[slug]', 'page')
}

export const VIDEO_PROVIDERS = ['vimeo', 'external', 'upload', 'none']

export const LESSON_TYPES = ['video', 'article', 'live_session', 'attachment']

export function pickLessonTypeFields(payload = {}) {
  const lessonType = LESSON_TYPES.includes(payload.lessonType) ? payload.lessonType : 'video'
  const liveUrl = lessonType === 'live_session' ? String(payload.liveSessionUrl || '').trim() : null
  let liveAt = null
  if (lessonType === 'live_session' && payload.liveSessionAt) {
    const parsed = new Date(payload.liveSessionAt)
    if (!Number.isNaN(parsed.getTime())) liveAt = parsed.toISOString()
  }
  return {
    lesson_type: lessonType,
    live_session_url: liveUrl,
    live_session_at: liveAt,
  }
}

export function pickVideoFields(payload = {}) {
  const provider = VIDEO_PROVIDERS.includes(payload.videoProvider)
    ? payload.videoProvider
    : 'none'
  return {
    video_provider: provider,
    vimeo_url: provider === 'vimeo' ? String(payload.vimeoUrl || '').trim() : null,
    external_video_url:
      provider === 'external' ? String(payload.externalVideoUrl || '').trim() : null,
    video_storage_path:
      provider === 'upload' ? String(payload.videoStoragePath || '').trim() : null,
    video_bucket:
      provider === 'upload'
        ? String(payload.videoBucket || 'course-videos').trim() || 'course-videos'
        : 'course-videos',
    video_duration_seconds: payload.videoDurationSeconds
      ? toInteger(payload.videoDurationSeconds, null)
      : null,
  }
}
