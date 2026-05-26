import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

export async function POST(request) {
  const { user } = await getCurrentAuth()
  if (!user) return NextResponse.json({ error: 'No autenticada.' }, { status: 401 })

  const payload = await request.json().catch(() => ({}))
  const password = String(payload.password || '')

  if (password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const metadata = {
    ...(user.user_metadata || {}),
    requires_password_change: false,
    password_changed_at: new Date().toISOString(),
    temporary_password_created_at: null,
  }

  const { error } = await supabase.auth.admin.updateUserById(user.id, {
    password,
    user_metadata: metadata,
  })

  if (error) {
    return NextResponse.json({ error: 'No pudimos actualizar la contraseña.' }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
