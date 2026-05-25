import { createBrowserClient } from '@supabase/ssr'

let browserClient = null

function requirePublicEnv(name, value) {
  if (!value) {
    throw new Error(`Missing environment variable: ${name}`)
  }

  return value
}

export function getSupabaseBrowser() {
  if (!browserClient) {
    browserClient = createBrowserClient(
      requirePublicEnv('NEXT_PUBLIC_SUPABASE_URL', process.env.NEXT_PUBLIC_SUPABASE_URL),
      requirePublicEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    )
  }

  return browserClient
}
