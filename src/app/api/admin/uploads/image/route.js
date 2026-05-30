import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, slugify } from '@/lib/admin-api'

const PUBLIC_BUCKET = 'public-media'
const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])
const MAX_BYTES = 8 * 1024 * 1024 // 8MB

const VALID_SCOPES = new Set(['tier-cover', 'course-cover', 'post-cover', 'misc'])

function safeName(name) {
  const base = String(name || 'imagen').trim()
  const dotIndex = base.lastIndexOf('.')
  const ext = dotIndex > -1 ? base.slice(dotIndex + 1).toLowerCase() : ''
  const stem = slugify(dotIndex > -1 ? base.slice(0, dotIndex) : base) || 'imagen'
  return ext ? `${stem}.${ext.replace(/[^a-z0-9]/g, '')}` : stem
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const formData = await request.formData()
    const file = formData.get('file')
    const rawScope = String(formData.get('scope') || 'misc')
    const scope = VALID_SCOPES.has(rawScope) ? rawScope : 'misc'

    if (!file || typeof file === 'string') {
      throw new Error('Falta el archivo')
    }
    if (file.size > MAX_BYTES) {
      throw new Error('La imagen supera los 8 MB')
    }
    if (file.type && !ALLOWED_MIME.has(file.type)) {
      throw new Error('Formato no soportado. Usá JPG, PNG, WebP o GIF.')
    }

    const supabase = getSupabaseAdmin()
    const storagePath = `${scope}/${Date.now()}-${safeName(file.name || 'imagen')}`

    const { error: uploadError } = await supabase.storage
      .from(PUBLIC_BUCKET)
      .upload(storagePath, file, {
        contentType: file.type || 'image/jpeg',
        upsert: false,
      })

    if (uploadError) throw uploadError

    const { data } = supabase.storage.from(PUBLIC_BUCKET).getPublicUrl(storagePath)

    return NextResponse.json({
      url: data.publicUrl,
      path: storagePath,
      bucket: PUBLIC_BUCKET,
    })
  } catch (error) {
    return jsonError(error.message || 'No se pudo subir la imagen')
  }
}
