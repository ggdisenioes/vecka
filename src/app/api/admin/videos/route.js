import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { uploadVideoToVimeo } from '@/lib/vimeo'

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
  const title = String(formData.get('title') || '').trim()
  const file = formData.get('file')

  if (!lessonId || !file || typeof file === 'string') {
    return redirectBack(request)
  }

  const supabase = getSupabaseAdmin()
  const upload = await uploadVideoToVimeo({
    description: `Leccion ${lessonId}`,
    file,
    title: title || file.name,
  })

  const { error } = await supabase
    .from('course_lessons')
    .update({
      external_video_url: '',
      video_duration_seconds: upload.durationSeconds || null,
      video_provider: 'vimeo',
      vimeo_url: upload.embedUrl,
    })
    .eq('id', lessonId)

  if (error) {
    throw error
  }

  revalidatePath('/admin')
  revalidatePath('/admin/editorial')
  revalidatePath('/courses')
  revalidatePath('/courses/[slug]', 'page')

  return redirectBack(request)
}
