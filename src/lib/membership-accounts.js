import crypto from 'node:crypto'

export function normalizeCheckoutEmail(value) {
  return String(value || '').trim().toLowerCase()
}

export function generateTemporaryPassword() {
  return `VeCKA-${crypto.randomBytes(6).toString('base64url')}-25`
}

async function findAuthUserByEmail(supabase, email) {
  const normalized = normalizeCheckoutEmail(email)
  if (!normalized) return null

  for (let page = 1; page <= 10; page += 1) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 1000 })
    if (error) throw error

    const user = data?.users?.find((candidate) => normalizeCheckoutEmail(candidate.email) === normalized)
    if (user) return user
    if (!data?.users || data.users.length < 1000) return null
  }

  return null
}

async function getProfileByEmail(supabase, email) {
  const normalized = normalizeCheckoutEmail(email)
  if (!normalized) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, display_name, role')
    .eq('email', normalized)
    .maybeSingle()

  return data || null
}

async function getProfileById(supabase, userId) {
  if (!userId) return null

  const { data } = await supabase
    .from('profiles')
    .select('id, email, full_name, display_name, role')
    .eq('id', userId)
    .maybeSingle()

  return data || null
}

async function upsertCheckoutProfile(supabase, { userId, email, fullName }) {
  const normalizedEmail = normalizeCheckoutEmail(email)
  if (!userId || !normalizedEmail) return getProfileById(supabase, userId)

  await supabase
    .from('profiles')
    .upsert({
      id: userId,
      email: normalizedEmail,
      full_name: fullName || null,
    }, { onConflict: 'id' })

  return getProfileById(supabase, userId)
}

export async function ensureMembershipCheckoutUser(supabase, { userId, email, fullName }) {
  const normalizedEmail = normalizeCheckoutEmail(email)
  const cleanName = String(fullName || '').trim()

  if (userId) {
    const profile = await getProfileById(supabase, userId)
    if (profile) return { userId, profile, temporaryPassword: null, created: false }

    const authUser = await supabase.auth.admin.getUserById(userId).then((result) => result.data?.user).catch(() => null)
    return {
      userId,
      profile: await upsertCheckoutProfile(supabase, {
        userId,
        email: authUser?.email || normalizedEmail,
        fullName: cleanName || authUser?.user_metadata?.full_name || '',
      }),
      temporaryPassword: null,
      created: false,
    }
  }

  const existingProfile = await getProfileByEmail(supabase, normalizedEmail)
  if (existingProfile?.id) {
    return { userId: existingProfile.id, profile: existingProfile, temporaryPassword: null, created: false }
  }

  const temporaryPassword = generateTemporaryPassword()
  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: temporaryPassword,
    email_confirm: true,
    user_metadata: {
      full_name: cleanName,
      requires_password_change: true,
      created_from_membership_checkout: true,
      temporary_password_created_at: new Date().toISOString(),
    },
  })

  if (error) {
    const authUser = await findAuthUserByEmail(supabase, normalizedEmail)
    if (authUser?.id) {
      return {
        userId: authUser.id,
        profile: await upsertCheckoutProfile(supabase, {
          userId: authUser.id,
          email: authUser.email || normalizedEmail,
          fullName: cleanName || authUser.user_metadata?.full_name || '',
        }),
        temporaryPassword: null,
        created: false,
      }
    }
    throw error
  }

  const createdUser = data?.user
  const profile = await upsertCheckoutProfile(supabase, {
    userId: createdUser.id,
    email: createdUser.email || normalizedEmail,
    fullName: cleanName,
  })

  return {
    userId: createdUser.id,
    profile,
    temporaryPassword,
    created: true,
  }
}

export async function findMembershipCheckoutUser(supabase, email) {
  const profile = await getProfileByEmail(supabase, email)
  if (profile?.id) return { userId: profile.id, profile }

  const authUser = await findAuthUserByEmail(supabase, email)
  if (!authUser?.id) return { userId: null, profile: null }

  return {
    userId: authUser.id,
    profile: await upsertCheckoutProfile(supabase, {
      userId: authUser.id,
      email: authUser.email || email,
      fullName: authUser.user_metadata?.full_name || '',
    }),
  }
}
