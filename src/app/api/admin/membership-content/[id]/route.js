import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import {
  jsonError,
  requireStaff,
  revalidateMemberships,
  toInteger,
} from '@/lib/admin-api'

const CONTENT_TYPES = ['text', 'image', 'download', 'link', 'embed']
const STATUSES = ['draft', 'published', 'archived']

function textValue(value) {
  return String(value || '').trim() || null
}

export async function PATCH(request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const payload = await request.json().catch(() => ({}))
    const patch = {}
    const supabase = getSupabaseAdmin()

    const { data: current, error: currentError } = await supabase
      .from('membership_content_items')
      .select('id, tier_id')
      .eq('id', id)
      .maybeSingle()

    if (currentError) throw currentError
    if (!current) return jsonError('Contenido no encontrado', 404)

    if (payload.type !== undefined) {
      patch.type = CONTENT_TYPES.includes(payload.type) ? payload.type : 'text'
    }
    if (payload.status !== undefined) {
      patch.status = STATUSES.includes(payload.status) ? payload.status : 'draft'
    }
    if (payload.title !== undefined) patch.title = textValue(payload.title) || 'Contenido sin título'
    if (payload.summary !== undefined) patch.summary = textValue(payload.summary)
    if (payload.body !== undefined) patch.body = textValue(payload.body)
    if (payload.mediaUrl !== undefined) patch.media_url = textValue(payload.mediaUrl)
    if (payload.sortOrder !== undefined) patch.sort_order = toInteger(payload.sortOrder, 0)
    if (payload.categoryId !== undefined) {
      const categoryId = textValue(payload.categoryId)
      if (!categoryId) {
        patch.category_id = null
      } else {
        const { data: category, error } = await supabase
          .from('membership_content_categories')
          .select('id')
          .eq('id', categoryId)
          .eq('tier_id', current.tier_id)
          .maybeSingle()

        if (error) throw error
        if (!category) throw new Error('La categoría seleccionada no pertenece a esta membresía.')
        patch.category_id = category.id
      }
    }

    const { data, error } = await supabase
      .from('membership_content_items')
      .update(patch)
      .eq('id', id)
      .select('*')
      .single()

    if (error) throw error
    revalidateMemberships()
    return NextResponse.json({ item: data })
  } catch (error) {
    return jsonError(error.message || 'Could not update membership content')
  }
}

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: item, error: loadError } = await supabase
      .from('membership_content_items')
      .select('bucket_name, storage_path')
      .eq('id', id)
      .maybeSingle()

    if (loadError) throw loadError

    const { error } = await supabase
      .from('membership_content_items')
      .delete()
      .eq('id', id)

    if (error) throw error

    if (item?.bucket_name && item?.storage_path) {
      await supabase.storage.from(item.bucket_name).remove([item.storage_path])
    }

    revalidateMemberships()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete membership content')
  }
}
