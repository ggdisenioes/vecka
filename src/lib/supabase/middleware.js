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
          // Race condition de refresh token: cuando el access token está
          // vencido y llegan varios requests casi simultáneos (típicamente
          // el prefetch del Link + la navegación real), todos traen el mismo
          // refresh token. El primero lo usa y lo rota; los demás fallan al
          // refrescar y Supabase responde llamando setAll SOLO con borrados
          // (value='' + maxAge=0) para limpiar la sesión. Si propagamos ese
          // borrado, pisamos las cookies buenas que escribió el request que
          // sí refrescó, y el usuario aparece deslogueado (se arregla al
          // recargar). La regla: si el lote es 100% borrados, lo ignoramos
          // (refresh fallido); si trae al menos un valor real, lo aplicamos
          // entero (refresh exitoso que además limpia chunks viejos). El
          // logout real escribe sus cookies en /logout/route.js, no acá.
          const isDeletion = ({ value, options }) => {
            const isEmptyValue = !value
            const isExpired = options && (options.maxAge === 0 || options.expires?.getTime?.() <= Date.now())
            return isEmptyValue || isExpired
          }

          const hasRealWrite = cookiesToSet.some((cookie) => !isDeletion(cookie))
          if (!hasRealWrite) return

          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options))
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
