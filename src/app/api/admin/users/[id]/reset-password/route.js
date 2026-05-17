import { NextResponse } from 'next/server'
import { getSupabaseAdmin } from '@/lib/supabase/admin'
import { jsonError, requireStaff } from '@/lib/admin-api'

export async function POST(_request, { params }) {
  const auth = await requireStaff()
  if (auth.error) return auth.error

  try {
    const { id } = await params
    const supabase = getSupabaseAdmin()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email')
      .eq('id', id)
      .maybeSingle()

    if (!profile?.email) return jsonError('Usuario no encontrado', 404)

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://vecka.com.ar'
    const { error } = await supabase.auth.admin.generateLink({
      type: 'recovery',
      email: profile.email,
      options: { redirectTo: `${baseUrl}/cuenta` },
    })

    if (error) throw error
    return NextResponse.json({ ok: true })
  } catch (err) {
    return jsonError(err.message || 'No se pudo generar el link de recuperación')
  }
}
