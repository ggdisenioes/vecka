import { NextResponse } from 'next/server'
import { getSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export async function GET(request) {
  // Next.js prefetchea los <Link> por defecto. Si una página tiene un link
  // "Cerrar sesión" hacia /logout sin prefetch={false}, el prefetch dispara
  // este handler y ejecuta signOut(), borrando la cookie de sesión sin que
  // la usuaria haya hecho click — quedaba deslogueada apenas entraba a la
  // página. Ignoramos los requests de prefetch para que el logout solo
  // ocurra en una navegación real.
  const isPrefetch =
    request.headers.get('next-router-prefetch') === '1' ||
    request.headers.get('purpose') === 'prefetch' ||
    request.headers.get('x-purpose') === 'prefetch'

  if (isPrefetch) {
    return new NextResponse(null, { status: 204 })
  }

  const supabase = await getSupabaseServer()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/', request.url))
}
