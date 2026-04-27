import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { assignUploadedVimeoVideo } from '@/lib/admin-media'

function redirectBack(request) {
  const referer = request.headers.get('referer')
  return NextResponse.redirect(referer || new URL('/admin/editorial', request.url))
}

export async function POST(request) {
  const { profile } = await getCurrentAuth()
  if (!isStaff(profile)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const lessonId = String(formData.get('lesson_id') || '')
  const moduleId = String(formData.get('module_id') || '')
  const title = String(formData.get('title') || '').trim()
  const file = formData.get('file')
  const targetType = moduleId ? 'module' : 'lesson'
  const targetId = moduleId || lessonId

  if (!targetId || !file || typeof file === 'string') {
    return redirectBack(request)
  }

  const supabase = getSupabaseAdmin()
  await assignUploadedVimeoVideo({
    file,
    supabase,
    targetId,
    targetType,
    title: title || file.name,
  })

  revalidatePath('/admin')
  revalidatePath('/admin/editorial')
  revalidatePath('/courses')
  revalidatePath('/courses/[slug]', 'page')

  return redirectBack(request)
}
