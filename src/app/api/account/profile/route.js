import { NextResponse } from 'next/server'
import { getCurrentAuth } from '@/lib/auth'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

function initialsFromName(name, email) {
  const source = String(name || email || 'V').trim()
  const initials = source
    .split(/\s+/)
    .map((part) => part[0]?.toUpperCase())
    .filter(Boolean)
    .slice(0, 2)
    .join('')

  return initials || 'V'
}

function mapAccountUser(authUser, profile) {
  const name = profile?.display_name || profile?.full_name || authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'Usuario'
  const role = ['admin', 'editorial'].includes(profile?.role) ? 'admin' : 'student'

  return {
    id: authUser.id,
    name,
    email: authUser.email || profile?.email || '',
    avatar: initialsFromName(name, authUser.email),
    role,
  }
}

export async function PATCH(request) {
  const { user } = await getCurrentAuth()
  if (!user) {
    return NextResponse.json({ error: 'No autenticada.' }, { status: 401 })
  }

  const payload = await request.json().catch(() => ({}))
  const fullName = String(payload.fullName || '').trim().slice(0, 160)
  const password = String(payload.password || '')

  if (!fullName) {
    return NextResponse.json({ error: 'Ingresá tu nombre completo.' }, { status: 400 })
  }

  if (password && password.length < 8) {
    return NextResponse.json({ error: 'La contraseña debe tener al menos 8 caracteres.' }, { status: 400 })
  }

  const supabase = getSupabaseAdmin()
  const now = new Date().toISOString()
  const metadata = {
    ...(user.user_metadata || {}),
    full_name: fullName,
  }

  if (password) {
    metadata.requires_password_change = false
    metadata.password_changed_at = now
    metadata.temporary_password_created_at = null
  }

  const { error: authError } = await supabase.auth.admin.updateUserById(user.id, {
    ...(password ? { password } : {}),
    user_metadata: metadata,
  })

  if (authError) {
    return NextResponse.json({ error: 'No pudimos actualizar tus datos.' }, { status: 500 })
  }

  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email || null,
      full_name: fullName,
      display_name: fullName,
      updated_at: now,
    }, { onConflict: 'id' })
    .select('id, email, full_name, display_name, role')
    .single()

  if (profileError) {
    return NextResponse.json({ error: 'No pudimos guardar el perfil.' }, { status: 500 })
  }

  return NextResponse.json({
    ok: true,
    user: mapAccountUser({ ...user, user_metadata: metadata }, profile),
  })
}
