import { cache } from 'react'
import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

// React.cache deduplica la llamada dentro de un mismo request: layout +
// page + sub-páginas comparten el mismo Promise en vez de cada uno
// disparar un getUser() propio. Sin esto, varias llamadas paralelas a
// supabase.auth.getUser() intentan refrescar el access token con el
// mismo refresh_token, Supabase invalida ese token tras el primer uso y
// las llamadas siguientes reciben "invalid refresh token" → null user →
// redirect a /login en cada navegación del admin.
export const getCurrentAuth = cache(async () => {
  const supabase = await getSupabaseServer()

  const { data, error } = await supabase.auth.getUser()
  const user = data?.user || null

  if (error || !user) {
    return { user: null, profile: null }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .maybeSingle()

  return { user, profile }
})

export async function requireRoles(allowedRoles) {
  const auth = await getCurrentAuth()

  if (!auth.user) {
    redirect('/login')
  }

  if (!auth.profile || !allowedRoles.includes(auth.profile.role)) {
    redirect('/')
  }

  return auth
}

export function isStaff(profile) {
  return profile && ['admin', 'editorial'].includes(profile.role)
}
