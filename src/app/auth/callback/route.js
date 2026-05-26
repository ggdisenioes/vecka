import { NextResponse } from 'next/server'
import { buildLoginPageUrl, getPostLoginPath, getSafeInternalPath } from '@/lib/auth-redirects'
import { getSupabaseServer } from '@/lib/supabase/server'

function redirectToLogin(requestUrl, nextPath, error) {
  return NextResponse.redirect(
    new URL(buildLoginPageUrl(nextPath, { error }), requestUrl.origin),
  )
}

export async function GET(request) {
  const requestUrl = new URL(request.url)
  const nextPath = getSafeInternalPath(requestUrl.searchParams.get('next'), '/')
  const providerError = requestUrl.searchParams.get('error_description') || requestUrl.searchParams.get('error')
  const code = requestUrl.searchParams.get('code')

  if (providerError) {
    return redirectToLogin(requestUrl, nextPath, providerError)
  }

  if (!code) {
    return redirectToLogin(requestUrl, nextPath, 'No se pudo completar el inicio de sesión con Google.')
  }

  const supabase = await getSupabaseServer()
  const { error } = await supabase.auth.exchangeCodeForSession(code)

  if (error) {
    return redirectToLogin(requestUrl, nextPath, error.message)
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirectToLogin(requestUrl, nextPath, 'No se pudo recuperar la sesión.')
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle()

  return NextResponse.redirect(new URL(getPostLoginPath(profile?.role || 'student', nextPath), requestUrl.origin))
}
