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
          // Server Components no pueden escribir cookies. El middleware se
          // encarga del refresh real; acá ignoramos el error en silencio
          // para que el getUser() del componente no quede sin sesión.
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, options)
            })
          } catch {
            // ignored — refresh handled by middleware
          }
        },
      },
    },
  )
}
