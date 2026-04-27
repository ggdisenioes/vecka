import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { env, requireEnv } from '@/lib/env'

export async function getSupabaseServer() {
  const cookieStore = await cookies()

  return createServerClient(
    requireEnv('NEXT_PUBLIC_SUPABASE_URL', env.supabaseUrl),
    requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', env.supabaseAnonKey),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options)
          })
        },
      },
    },
  )
}
