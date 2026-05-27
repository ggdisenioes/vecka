import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'

export async function getCurrentAuth() {
  const supabase = await getSupabaseServer()
  const [{ data: userData, error: userError }, { data: sessionData }] = await Promise.all([
    supabase.auth.getUser(),
    supabase.auth.getSession(),
  ])

  const user = userData?.user || sessionData?.session?.user || null

  if (!user) {
    return { user: null, profile: null }
  }

  if (userError && !sessionData?.session?.user) {
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
