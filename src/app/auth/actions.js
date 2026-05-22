'use server'

import { redirect } from 'next/navigation'
import { getSupabaseServer } from '@/lib/supabase/server'
import { migrateLegacyPasswordAndSignIn } from '@/lib/legacy-passwords'

function getSafeInternalPath(value, fallback = '/') {
  const input = String(value || '').trim()

  if (!input.startsWith('/')) {
    return fallback
  }

  return input
}

function buildAuthModalUrl(path, params = {}) {
  const url = new URL(path, 'http://localhost')

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })

  return `${url.pathname}${url.search}`
}

function buildLoginPageUrl(nextPath, params = {}) {
  return buildAuthModalUrl('/login', { ...params, next: nextPath })
}

function getPostLoginPath(role, requestedPath) {
  const safePath = getSafeInternalPath(requestedPath, '/')
  const isStaff = role === 'admin' || role === 'editorial'

  if (safePath === '/admin' || safePath.startsWith('/admin/')) {
    return isStaff ? safePath : '/cuenta'
  }

  if (safePath === '/cuenta' || safePath.startsWith('/cuenta')) {
    return isStaff ? '/admin' : safePath
  }

  if (safePath === '/login' || safePath.startsWith('/login?')) {
    return isStaff ? '/admin' : '/cuenta'
  }

  return safePath
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
