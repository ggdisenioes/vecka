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
          // En prefetch requests (Safari y Next.js RSC), una cookie parcial
          // o corrupta hace que Supabase llame setAll con value='' + maxAge=0
          // para borrar la sesión. Si propagamos ese borrado, el browser
          // pierde la sesión aunque el usuario siga logueado en otras tabs.
          // Para prefetch filtramos los borrados; para requests reales los
          // permitimos para que el refresh de token funcione correctamente
          // (si no, chunks de sesión viejos quedan y corrompen la lectura).
          const isPrefetch =
            request.headers.get('next-router-prefetch') === '1' ||
            request.headers.get('purpose') === 'prefetch' ||
            request.headers.get('x-middleware-prefetch') === '1'

          const writes = isPrefetch
            ? cookiesToSet.filter(({ value, options }) => {
                const isEmptyValue = !value
                const isExpired = options && (options.maxAge === 0 || options.expires?.getTime?.() <= Date.now())
                return !(isEmptyValue || isExpired)
              })
            : cookiesToSet

          if (writes.length === 0) return
          writes.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          writes.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
        },
      },
    },
  )

  // Supabase mutates the response cookies during this call when la sesión
  // necesita refrescarse. Si no lo esperamos, las cookies actualizadas no
  // llegan a la respuesta y el usuario aparece deslogueado en el próximo
  // request. Atrapamos errores de parsing (cookie corrupta) para que el
  // middleware no devuelva 500 — la página se encarga del redirect a login.
  let user = null
  try {
    const result = await supabase.auth.getUser()
    user = result.data?.user || null
  } catch {
    user = null
  }

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
