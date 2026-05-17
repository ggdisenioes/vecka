import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'
import { revalidatePath } from 'next/cache'

export async function POST(request) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const payload = await request.json().catch(() => ({}))
    if (!payload.userId) return jsonError('userId es requerido')
    if (!payload.courseId) return jsonError('courseId es requerido')

    const supabase = getSupabaseAdmin()
    const { data, error } = await supabase
      .from('course_enrollments')
      .upsert({
        user_id: payload.userId,
        course_id: payload.courseId,
        access_status: payload.accessStatus || 'active',
        granted_at: new Date().toISOString(),
        expires_at: payload.expiresAt || null,
      }, { onConflict: 'user_id,course_id' })
      .select('*')
      .single()

    if (error) throw error
    revalidatePath('/admin/usuarios')
    return NextResponse.json({ enrollment: data })
  } catch (err) {
    return jsonError(err.message || 'No se pudo asignar el curso')
  }
}
