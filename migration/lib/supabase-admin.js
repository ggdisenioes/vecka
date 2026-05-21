import { createClient } from '@supabase/supabase-js'
import { migrationConfig } from './config.js'

let client = null

export function getSupabaseAdminForMigration() {
  if (!client) {
    client = createClient(migrationConfig.supabase.url, migrationConfig.supabase.serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    })
  }

  return client
}
