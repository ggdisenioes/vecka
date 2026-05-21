import wordpressHash from 'wordpress-hash-node'
import { getSupabaseAdmin } from '@/lib/supabase/admin'

function normalizeEmail(email) {
  return String(email || '').trim().toLowerCase()
}

function isPortableWordPressHash(hash) {
  return typeof hash === 'string' && (hash.startsWith('$P$') || hash.startsWith('$H$'))
}

export async function migrateLegacyPasswordAndSignIn({ email, password, supabase }) {
  const normalizedEmail = normalizeEmail(email)
  if (!normalizedEmail || !password) {
    return false
  }

  const admin = getSupabaseAdmin()
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('id, email')
    .ilike('email', normalizedEmail)
    .limit(1)
    .maybeSingle()

  if (profileError) {
    throw new Error(`Legacy profile lookup failed: ${profileError.message}`)
  }

  if (!profile?.id) {
    return false
  }

  const { data: legacyPassword, error: legacyError } = await admin
    .from('legacy_passwords')
    .select('phpass_hash, migrated')
    .eq('user_id', profile.id)
    .maybeSingle()

  if (legacyError) {
    throw new Error(`Legacy password lookup failed: ${legacyError.message}`)
  }

  if (!legacyPassword?.phpass_hash || legacyPassword.migrated) {
    return false
  }

  if (!isPortableWordPressHash(legacyPassword.phpass_hash)) {
    return false
  }

  const valid = wordpressHash.CheckPassword(password, legacyPassword.phpass_hash)
  if (!valid) {
    return false
  }

  const { error: updateError } = await admin.auth.admin.updateUserById(profile.id, { password })
  if (updateError) {
    throw new Error(`Legacy password upgrade failed: ${updateError.message}`)
  }

  const retry = await supabase.auth.signInWithPassword({ email: profile.email || normalizedEmail, password })
  if (retry.error) {
    throw new Error(`Legacy reauthentication failed: ${retry.error.message}`)
  }

  const { error: markMigratedError } = await admin
    .from('legacy_passwords')
    .update({
      migrated: true,
      migrated_at: new Date().toISOString(),
    })
    .eq('user_id', profile.id)

  if (markMigratedError) {
    throw new Error(`Legacy password migration flag failed: ${markMigratedError.message}`)
  }

  return true
}
