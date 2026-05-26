'use server'

import { redirect } from 'next/navigation'
import { buildLoginPageUrl, buildRelativeUrl, getPostLoginPath, getSafeInternalPath } from '@/lib/auth-redirects'
import { getSupabaseServer } from '@/lib/supabase/server'
import { migrateLegacyPasswordAndSignIn } from '@/lib/legacy-passwords'

function buildAuthModalUrl(path, params = {}) {
  return buildRelativeUrl(path, params)
}

export async function signIn(formData) {
  const supabase = await getSupabaseServer()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const nextPath = getSafeInternalPath(formData.get('next'), '/')
  const useLoginPage = formData.get('auth_page') === '/login'

  const { error } = await supabase.auth.signInWithPassword({ email, password })

  if (error) {
    const migrated = await migrateLegacyPasswordAndSignIn({ email, password, supabase })
    if (!migrated) {
      if (useLoginPage) {
        redirect(buildLoginPageUrl(nextPath, { error: error.message }))
      }
      redirect(buildAuthModalUrl(nextPath, { auth: 'login', error: error.message, next: nextPath }))
    }
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    if (useLoginPage) {
      redirect(buildLoginPageUrl(nextPath, { error: 'No se pudo recuperar la sesión' }))
    }
    redirect(buildAuthModalUrl(nextPath, { auth: 'login', error: 'No se pudo recuperar la sesión', next: nextPath }))
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  redirect(getPostLoginPath(profile?.role || 'student', nextPath))
}

export async function signUp(formData) {
  const supabase = await getSupabaseServer()
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const nextPath = getSafeInternalPath(formData.get('next'), '/')
  const useLoginPage = formData.get('auth_page') === '/login'

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: String(formData.get('full_name') || '').trim(),
      },
    },
  })

  if (error) {
    if (useLoginPage) {
      redirect(buildLoginPageUrl(nextPath, { error: error.message, mode: 'signup' }))
    }
    redirect(buildAuthModalUrl(nextPath, { auth: 'login', error: error.message, next: nextPath }))
  }

  if (useLoginPage) {
    redirect(buildLoginPageUrl(nextPath, { success: 'Cuenta creada. Ya podés iniciar sesión.' }))
  }
  redirect(buildAuthModalUrl(nextPath, { auth: 'login', success: 'Cuenta creada. Ya podés iniciar sesión.', next: nextPath }))
}


export async function signOut() {
  const supabase = await getSupabaseServer()
  await supabase.auth.signOut()
  redirect('/')
}
