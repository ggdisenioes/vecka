import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function getCurrentAuth() {
  const supabase = await getSupabaseServer()

  // Solo getUser(). Llamar getUser y getSession en paralelo dispara dos
  // intentos de refresh concurrentes que pisan las cookies y dejan
  // sesiones zombi: el usuario aparece como no autenticado y el layout
  // redirige a /login en cada navegación.
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
}

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
