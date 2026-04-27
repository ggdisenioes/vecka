import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { getCurrentAuth } from '@/lib/auth'

function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function requireText(value, fieldLabel) {
  const normalized = String(value || '').trim()
  if (!normalized) {
    throw new Error(`${fieldLabel} is required`)
  }

  return normalized
}

function toInteger(value, fallback = 0) {
  const parsed = Number.parseInt(String(value || ''), 10)
  return Number.isFinite(parsed) ? parsed : fallback
}

function toFloat(value, fallback = 0) {
  const parsed = Number.parseFloat(String(value || ''))
  return Number.isFinite(parsed) ? parsed : fallback
}

function parseModulesInput(value = '') {
  return String(value || '')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line, moduleIndex) => {
      const [titlePart, lessonsPart = ''] = line.split(':')
      return {
        title: titlePart?.trim() || `Módulo ${moduleIndex + 1}`,
        lessons: lessonsPart
          .split('|')
          .map((lesson) => lesson.trim())
          .filter(Boolean),
      }
    })
}

async function uniqueSlug(title, currentId = null) {
  const supabase = getSupabaseAdmin()
  const base = slugify(title) || `course-${Date.now()}`
  let slug = base
  let counter = 2

  while (true) {
    let query = supabase.from('courses').select('id').eq('slug', slug).limit(1)
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

async function uniqueLessonSlug(moduleId, title) {
  const supabase = getSupabaseAdmin()
  const base = slugify(title) || `lesson-${Date.now()}`
  let slug = base
  let counter = 2

  while (true) {
    const { data, error } = await supabase
      .from('course_lessons')
      .select('id')
      .eq('module_id', moduleId)
      .eq('slug', slug)
      .limit(1)

    if (error) throw error
    if (!data?.length) return slug

    slug = `${base}-${counter}`
    counter += 1
  }
}

async function requireStaff() {
  const { user, profile } = await getCurrentAuth()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!profile || !['admin', 'editorial'].includes(profile.role)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

async function requireAdmin() {
  const { user, profile } = await getCurrentAuth()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  if (!profile || profile.role !== 'admin') {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  return null
}

function revalidateAll() {
  revalidatePath('/')
  revalidatePath('/admin')
  revalidatePath('/courses')
  revalidatePath('/courses/[slug]', 'page')
}

export async function POST(request) {
  const authError = await requireStaff()
  if (authError) return authError

  try {
    const payload = await request.json()
    const supabase = getSupabaseAdmin()
    const title = requireText(payload.title, 'Course title')
    const slug = await uniqueSlug(title)
    const modules = parseModulesInput(payload.modulesText)

    const { data: course, error: courseError } = await supabase
      .from('courses')
      .insert({
        slug,
        title,
        subtitle: String(payload.subtitle || '').trim(),
        description: String(payload.description || '').trim(),
        category: String(payload.category || '').trim(),
        level: String(payload.level || '').trim(),
        duration_label: String(payload.duration || '').trim(),
        price_ars: toInteger(payload.price),
        price_usd: toFloat(payload.priceUSD),
        status: 'published',
        visibility: 'catalog',
        is_membership: Boolean(payload.isMembership),
      })
      .select('id, slug, title')
      .single()

    if (courseError) throw courseError

    for (const [moduleIndex, moduleInput] of modules.entries()) {
      const { data: module, error: moduleError } = await supabase
        .from('course_modules')
        .insert({
          course_id: course.id,
          title: requireText(moduleInput.title, 'Module title'),
          position: moduleIndex + 1,
        })
        .select('id')
        .single()

      if (moduleError) throw moduleError

      for (const [lessonIndex, lessonTitle] of moduleInput.lessons.entries()) {
        const { error: lessonError } = await supabase.from('course_lessons').insert({
          module_id: module.id,
          slug: await uniqueLessonSlug(module.id, lessonTitle),
          title: requireText(lessonTitle, 'Lesson title'),
          position: lessonIndex + 1,
          status: 'published',
          is_preview: lessonIndex === 0,
          video_provider: 'none',
        })

        if (lessonError) throw lessonError
      }
    }

    revalidateAll()
    return NextResponse.json({ course })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not create course' }, { status: 400 })
  }
}

export async function PUT(request) {
  const authError = await requireStaff()
  if (authError) return authError

  try {
    const payload = await request.json()
    const supabase = getSupabaseAdmin()
    const id = String(payload.id || '')
    const title = requireText(payload.title, 'Course title')

    const { error } = await supabase
      .from('courses')
      .update({
        slug: await uniqueSlug(title, id),
        title,
        subtitle: String(payload.subtitle || '').trim(),
        description: String(payload.description || '').trim(),
        category: String(payload.category || '').trim(),
        level: String(payload.level || '').trim(),
        duration_label: String(payload.duration || '').trim(),
        price_ars: toInteger(payload.price),
        price_usd: toFloat(payload.priceUSD),
        is_membership: Boolean(payload.isMembership),
      })
      .eq('id', id)

    if (error) throw error

    revalidateAll()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not update course' }, { status: 400 })
  }
}

export async function DELETE(request) {
  const authError = await requireAdmin()
  if (authError) return authError

  try {
    const { searchParams } = new URL(request.url)
    const id = String(searchParams.get('id') || '')
    const supabase = getSupabaseAdmin()
    const { error } = await supabase.from('courses').delete().eq('id', id)

    if (error) throw error

    revalidateAll()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return NextResponse.json({ error: error.message || 'Could not delete course' }, { status: 400 })
  }
}
