import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import { env } from '@/lib/env'

export async function updateSession(request) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    env.supabaseUrl,
    env.supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Supabase mutates the response cookies during this call when the session
  // needs to be refreshed. If we don't await it, the updated cookies never
  // make it into the response and the user appears logged out on the next
  // request.
  const {
    data: { user },
  } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const allowedPasswordChangePaths = [
    '/cambiar-contrasena',
    '/logout',
    '/api/auth/change-password',
  ]

  if (
    user?.user_metadata?.requires_password_change &&
    !allowedPasswordChangePaths.some((path) => pathname === path || pathname.startsWith(`${path}/`))
  ) {
    const redirectUrl = request.nextUrl.clone()
    redirectUrl.pathname = '/cambiar-contrasena'
    redirectUrl.search = ''
    redirectUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`)
    const redirectResponse = NextResponse.redirect(redirectUrl)
    response.cookies.getAll().forEach((cookie) => redirectResponse.cookies.set(cookie))
    return redirectResponse
  }

  return response
}
