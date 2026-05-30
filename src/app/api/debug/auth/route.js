import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { getSupabaseServer } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

// Endpoint temporal para depurar auth en producción. Quitar después.
export async function GET() {
  const cookieStore = await cookies()
  const allCookies = cookieStore.getAll().map((c) => ({
    name: c.name,
    valuePreview: c.value ? `${c.value.slice(0, 20)}…(${c.value.length} chars)` : '',
  }))

  const supabase = await getSupabaseServer()
  let userResult = null
  let userError = null
  try {
    const res = await supabase.auth.getUser()
    userResult = res.data?.user
      ? {
          id: res.data.user.id,
          email: res.data.user.email,
          role: res.data.user.role,
          aud: res.data.user.aud,
        }
      : null
    userError = res.error?.message || null
  } catch (e) {
    userError = `getUser threw: ${e.message}`
  }

  let sessionResult = null
  let sessionError = null
  try {
    const res = await supabase.auth.getSession()
    sessionResult = res.data?.session
      ? {
          userId: res.data.session.user?.id,
          expiresAt: res.data.session.expires_at,
          expiresIn: res.data.session.expires_in,
          tokenType: res.data.session.token_type,
        }
      : null
    sessionError = res.error?.message || null
  } catch (e) {
    sessionError = `getSession threw: ${e.message}`
  }

  return NextResponse.json({
    timestamp: new Date().toISOString(),
    cookies: allCookies,
    user: userResult,
    userError,
    session: sessionResult,
    sessionError,
    env: {
      hasSupabaseUrl: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
      hasSupabaseAnonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    },
  })
}
