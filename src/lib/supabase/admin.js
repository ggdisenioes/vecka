import { createClient } from '@supabase/supabase-js'
import { env, requireEnv } from '@/lib/env'

let adminClient = null

export function getSupabaseAdmin() {
  if (!adminClient) {
    adminClient = createClient(
      requireEnv('NEXT_PUBLIC_SUPABASE_URL', env.supabaseUrl),
      requireEnv('SUPABASE_SERVICE_ROLE_KEY', env.supabaseServiceRoleKey),
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      },
    )
  }

  return adminClient
}
