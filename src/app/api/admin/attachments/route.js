import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'
import { getCurrentAuth, isStaff } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request) {
  const { profile } = await getCurrentAuth()
  if (!isStaff(profile)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const formData = await request.formData()
  const lessonId = String(formData.get('lesson_id') || '')
  const file = formData.get('file')

  if (!lessonId || !file || typeof file === 'string') {
    return NextResponse.redirect(new URL('/admin', request.url))
  }

  const supabase = getSupabaseAdmin()
  const bucketName = 'lesson-assets'
  const safeName = file.name.replace(/\s+/g, '-').toLowerCase()
  const storagePath = `${lessonId}/${Date.now()}-${safeName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(storagePath, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (uploadError) {
    throw uploadError
  }

  const { error: insertError } = await supabase.from('lesson_attachments').insert({
    lesson_id: lessonId,
    bucket_name: bucketName,
    storage_path: storagePath,
    file_name: file.name,
    mime_type: file.type || 'application/octet-stream',
    size_bytes: file.size || 0,
  })

  if (insertError) {
    throw insertError
  }

  revalidatePath('/admin')
  revalidatePath('/courses')

  return NextResponse.redirect(new URL('/admin', request.url))
}
