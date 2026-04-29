import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateCourses,
  slugify,
  toInteger,
} from '@/lib/admin-api'

const SCOPE_TO_COLUMN = {
  course: 'course_id',
  module: 'module_id',
  lesson: 'lesson_id',
}

const MATERIALS_BUCKET = 'lesson-assets'

function safeName(name) {
  const base = String(name || 'archivo').trim()
  const dotIndex = base.lastIndexOf('.')
  const ext = dotIndex > -1 ? base.slice(dotIndex + 1).toLowerCase() : ''
  const stem = slugify(dotIndex > -1 ? base.slice(0, dotIndex) : base) || 'archivo'
  return ext ? `${stem}.${ext.replace(/[^a-z0-9]/g, '')}` : stem
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const scope = String(formData.get('scope') || '')
    const parentId = requireText(formData.get('parentId'), 'Parent id')
    const sortOrder = toInteger(formData.get('sortOrder'), 1)

    if (!file || typeof file === 'string') {
      throw new Error('Missing file')
    }
    const column = SCOPE_TO_COLUMN[scope]
    if (!column) {
      throw new Error('Invalid scope')
    }

    const supabase = getSupabaseAdmin()
    const fileName = file.name || 'archivo'
    const storagePath = `${scope}/${parentId}/${Date.now()}-${safeName(fileName)}`

    const { error: uploadError } = await supabase.storage
      .from(MATERIALS_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'application/octet-stream',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data, error } = await supabase
      .from('course_materials')
      .insert({
        [column]: parentId,
        bucket_name: MATERIALS_BUCKET,
        storage_path: storagePath,
        file_name: fileName,
        mime_type: file.type || 'application/octet-stream',
        size_bytes: file.size || 0,
        sort_order: sortOrder,
      })
      .select('*')
      .single()

    if (error) {
      await supabase.storage.from(MATERIALS_BUCKET).remove([storagePath])
      throw error
    }

    revalidateCourses()
    return NextResponse.json({ material: data })
  } catch (error) {
    return jsonError(error.message || 'Could not upload material')
  }
}
