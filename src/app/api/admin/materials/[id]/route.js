import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff, revalidateCourses } from '@/lib/admin-api'

export async function DELETE(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: material, error: lookupError } = await supabase
      .from('course_materials')
      .select('id, bucket_name, storage_path')
      .eq('id', id)
      .maybeSingle()

    if (lookupError) throw lookupError
    if (!material) return jsonError('Material not found', 404)

    await supabase.storage.from(material.bucket_name).remove([material.storage_path])

    const { error: deleteError } = await supabase
      .from('course_materials')
      .delete()
      .eq('id', id)

    if (deleteError) throw deleteError

    revalidateCourses()
    return NextResponse.json({ ok: true })
  } catch (error) {
    return jsonError(error.message || 'Could not delete material')
  }
}
