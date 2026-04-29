import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, requireText, slugify } from '@/lib/admin-api'

const VIDEOS_BUCKET = 'course-videos'
const ALLOWED_SCOPES = new Set(['module', 'lesson'])

function safeVideoName(name) {
  const base = String(name || 'video').trim()
  const dotIndex = base.lastIndexOf('.')
  const ext = dotIndex > -1 ? base.slice(dotIndex + 1).toLowerCase() : 'mp4'
  const stem = slugify(dotIndex > -1 ? base.slice(0, dotIndex) : base) || 'video'
  return `${stem}.${ext.replace(/[^a-z0-9]/g, '') || 'mp4'}`
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json()
    const scope = String(payload.scope || '')
    if (!ALLOWED_SCOPES.has(scope)) throw new Error('Invalid scope')
    const parentId = requireText(payload.parentId, 'Parent id')
    const fileName = String(payload.fileName || 'video.mp4')

    const storagePath = `${scope}/${parentId}/${Date.now()}-${safeVideoName(fileName)}`
    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase.storage
      .from(VIDEOS_BUCKET)
      .createSignedUploadUrl(storagePath)

    if (error) throw error
    return NextResponse.json({
      signedUrl: data.signedUrl,
      token: data.token,
      storagePath,
      bucket: VIDEOS_BUCKET,
    })
  } catch (error) {
    return jsonError(error.message || 'Could not create signed upload url')
  }
}
