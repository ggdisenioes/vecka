import { createClient } from '@supabase/supabase-js'
import { env, requireEnv } from '@/lib/env'

let publicClient = null

export function getSupabasePublic() {
  if (!publicClient) {
    publicClient = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL', env.supabaseUrl),
      requireEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', env.supabaseAnonKey),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  return publicClient
}
