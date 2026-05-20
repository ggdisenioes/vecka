import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  requireText,
  revalidateMemberships,
  slugify,
  toInteger,
} from '@/lib/admin-api'

const CONTENT_TYPES = ['text', 'image', 'download', 'link', 'embed']
const STATUSES = ['draft', 'published', 'archived']
const MEMBERSHIP_BUCKET = 'lesson-assets'

function safeName(name) {
  const base = String(name || 'archivo').trim()
  const dotIndex = base.lastIndexOf('.')
  const ext = dotIndex > -1 ? base.slice(dotIndex + 1).toLowerCase() : ''
  const stem = slugify(dotIndex > -1 ? base.slice(0, dotIndex) : base) || 'archivo'
  return ext ? `${stem}.${ext.replace(/[^a-z0-9]/g, '')}` : stem
}

function normalizeType(value) {
  return CONTENT_TYPES.includes(value) ? value : 'text'
}

function normalizeStatus(value) {
  return STATUSES.includes(value) ? value : 'draft'
}

function textValue(value) {
  return String(value || '').trim() || null
}

export async function GET(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  const url = new URL(request.url)
  const tierId = url.searchParams.get('tierId')
  if (!tierId) return jsonError('tierId is required')

  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from('membership_content_items')
    .select('*')
    .eq('tier_id', tierId)
    .order('sort_order', { ascending: true })
    .order('created_at', { ascending: true })

  if (error) return jsonError(error.message)
  return NextResponse.json({ items: data || [] })
}

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const contentType = request.headers.get('content-type') || ''
    const supabase = getSupabaseAdmin()

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData()
      const tierId = requireText(formData.get('tierId'), 'Tier id')
      const file = formData.get('file')
      if (!file || typeof file === 'string') throw new Error('Missing file')

      const type = normalizeType(String(formData.get('type') || 'download'))
      const title = requireText(formData.get('title') || file.name, 'Title')
      const fileName = file.name || 'archivo'
      const storagePath = `membership/${tierId}/${Date.now()}-${safeName(fileName)}`

      const { error: uploadError } = await supabase.storage
        .from(MEMBERSHIP_BUCKET)
        .upload(storagePath, file, {
          contentType: file.type || 'application/octet-stream',
          upsert: false,
        })

      if (uploadError) throw uploadError

      const { data, error } = await supabase
        .from('membership_content_items')
        .insert({
          tier_id: tierId,
          type,
          title,
          summary: textValue(formData.get('summary')),
          body: textValue(formData.get('body')),
          media_url: textValue(formData.get('mediaUrl')),
          bucket_name: MEMBERSHIP_BUCKET,
          storage_path: storagePath,
          file_name: fileName,
          mime_type: file.type || 'application/octet-stream',
          size_bytes: file.size || 0,
          sort_order: toInteger(formData.get('sortOrder'), 0),
          status: normalizeStatus(String(formData.get('status') || 'draft')),
        })
        .select('*')
        .single()

      if (error) {
        await supabase.storage.from(MEMBERSHIP_BUCKET).remove([storagePath])
        throw error
      }

      revalidateMemberships()
      return NextResponse.json({ item: data })
    }

    const payload = await request.json().catch(() => ({}))
    const tierId = requireText(payload.tierId, 'Tier id')
    const title = requireText(payload.title || 'Contenido sin título', 'Title')

    const { data, error } = await supabase
      .from('membership_content_items')
      .insert({
        tier_id: tierId,
        type: normalizeType(payload.type),
        title,
        summary: textValue(payload.summary),
        body: textValue(payload.body),
        media_url: textValue(payload.mediaUrl),
        sort_order: toInteger(payload.sortOrder, 0),
        status: normalizeStatus(payload.status),
      })
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ item: data })
  } catch (error) {
    return jsonError(error.message || 'Could not create membership content')
  }
}
