import { uploadVideoToVimeo } from '@/lib/vimeo'

function safeFileName(name) {
  return String(name || 'archivo')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/[^a-zA-Z0-9._-]+/g, '')
    .toLowerCase()
}

export function isPdfFile(file) {
  if (!file || typeof file === 'string') return false

  const normalizedName = String(file.name || '').toLowerCase()
  return file.type === 'application/pdf' || normalizedName.endsWith('.pdf')
}

export function assertPdfFile(file) {
  if (!isPdfFile(file)) {
    throw new Error('Only PDF files are allowed for lesson materials')
  }
}

export async function uploadLessonAttachment({ file, lessonId, sortOrder = 1, supabase }) {
  assertPdfFile(file)

  const bucketName = 'lesson-assets'
  const storagePath = `${lessonId}/${Date.now()}-${safeFileName(file.name)}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await supabase.storage.from(bucketName).upload(storagePath, buffer, {
    contentType: 'application/pdf',
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
    mime_type: 'application/pdf',
    size_bytes: file.size || 0,
    sort_order: sortOrder,
  })

  if (insertError) {
    throw insertError
  }
}

export async function uploadLessonAttachments({ files, lessonId, supabase }) {
  for (const [index, file] of files.entries()) {
    await uploadLessonAttachment({
      file,
      lessonId,
      sortOrder: index + 1,
      supabase,
    })
  }
}

export async function assignUploadedVimeoVideo({
  file,
  supabase,
  targetId,
  targetType,
  title,
}) {
  if (!file || typeof file === 'string') {
    return
  }

  const upload = await uploadVideoToVimeo({
    description: `${targetType} ${targetId}`,
    file,
    title,
  })

  const payload = {
    external_video_url: '',
    video_duration_seconds: upload.durationSeconds || null,
    video_provider: 'vimeo',
    vimeo_url: upload.embedUrl,
  }

  const table = targetType === 'module' ? 'course_modules' : 'course_lessons'
  const { error } = await supabase.from(table).update(payload).eq('id', targetId)

  if (error) {
    throw error
  }
}
