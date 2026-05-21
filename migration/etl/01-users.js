import crypto from 'node:crypto'
import { parseCliArgs } from '../lib/cli.js'

const HELP_TEXT = `
Usage:
  npm run migration:users -- --limit=5
  npm run migration:users -- --email=user@example.com
  npm run migration:users -- --dry-run
`

function mapWpRole(capabilities) {
  const raw = String(capabilities || '')

  if (raw.includes('administrator')) return 'admin'
  if (raw.includes('editor')) return 'editorial'
  return 'student'
}

function buildFullName(firstName, lastName, displayName, login) {
  const fullName = [firstName, lastName].filter(Boolean).join(' ').trim()
  if (fullName) return fullName
  if (displayName) return displayName
  return login || null
}

function buildPlaceholderPassword() {
  return `wp-import-${crypto.randomBytes(18).toString('hex')}`
}

async function fetchWordpressUsers(connection, options) {
  const where = []
  const params = []

  if (options.email) {
    where.push('lower(u.user_email) = ?')
    params.push(options.email)
  }

  const whereSql = where.length ? `where ${where.join(' and ')}` : ''
  const limitSql = options.limit ? 'limit ?' : ''
  if (options.limit) {
    params.push(options.limit)
  }

  const [rows] = await connection.execute(
    `
      select
        u.ID as wp_user_id,
        u.user_email as email,
        u.user_login as login,
        u.user_pass as user_pass,
        u.display_name as display_name,
        u.user_registered as user_registered,
        um_first.meta_value as first_name,
        um_last.meta_value as last_name,
        um_phone.meta_value as phone,
        um_billing_phone.meta_value as billing_phone,
        um_bio.meta_value as bio,
        um_caps.meta_value as capabilities
      from wp_users u
      left join wp_usermeta um_first on um_first.user_id = u.ID and um_first.meta_key = 'first_name'
      left join wp_usermeta um_last on um_last.user_id = u.ID and um_last.meta_key = 'last_name'
      left join wp_usermeta um_phone on um_phone.user_id = u.ID and um_phone.meta_key = 'phone'
      left join wp_usermeta um_billing_phone on um_billing_phone.user_id = u.ID and um_billing_phone.meta_key = 'billing_phone'
      left join wp_usermeta um_bio on um_bio.user_id = u.ID and um_bio.meta_key = 'description'
      left join wp_usermeta um_caps on um_caps.user_id = u.ID and um_caps.meta_key = 'wp_capabilities'
      ${whereSql}
      order by u.ID asc
      ${limitSql}
    `,
    params,
  )

  return rows
}

async function listAuthUsersByEmail(supabase) {
  const usersByEmail = new Map()
  let page = 1
  const perPage = 1000

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage })
    if (error) {
      throw new Error(`Unable to list auth users: ${error.message}`)
    }

    const users = data?.users || []
    for (const user of users) {
      if (user.email) {
        usersByEmail.set(user.email.toLowerCase(), user)
      }
    }

    if (users.length < perPage) {
      break
    }

    page += 1
  }

  return usersByEmail
}

async function ensureAuthUser(supabase, existingUser, wpUser, dryRun) {
  if (existingUser) {
    if (!dryRun) {
      const { error } = await supabase.auth.admin.updateUserById(existingUser.id, {
        email_confirm: true,
        user_metadata: {
          full_name: buildFullName(wpUser.first_name, wpUser.last_name, wpUser.display_name, wpUser.login),
          source: 'wordpress-migration',
        },
      })

      if (error) {
        throw new Error(`Unable to update auth user ${wpUser.email}: ${error.message}`)
      }
    }

    return existingUser.id
  }

  if (dryRun) {
    return `dry-run-${wpUser.wp_user_id}`
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: wpUser.email,
    password: buildPlaceholderPassword(),
    email_confirm: true,
    user_metadata: {
      full_name: buildFullName(wpUser.first_name, wpUser.last_name, wpUser.display_name, wpUser.login),
      source: 'wordpress-migration',
    },
  })

  if (error) {
    throw new Error(`Unable to create auth user ${wpUser.email}: ${error.message}`)
  }

  return data.user.id
}

async function upsertProfile(supabase, authUserId, wpUser, dryRun) {
  const payload = {
    id: authUserId,
    email: wpUser.email,
    full_name: buildFullName(wpUser.first_name, wpUser.last_name, wpUser.display_name, wpUser.login),
    display_name: wpUser.display_name || null,
    phone: wpUser.phone || wpUser.billing_phone || null,
    bio: wpUser.bio || null,
    role: mapWpRole(wpUser.capabilities),
    legacy_wp_id: wpUser.wp_user_id,
    updated_at: new Date().toISOString(),
  }

  if (dryRun) {
    return payload
  }

  const { error } = await supabase.from('profiles').upsert(payload, { onConflict: 'id' })
  if (error) {
    throw new Error(`Unable to upsert profile ${wpUser.email}: ${error.message}`)
  }

  return payload
}

async function upsertLegacyPassword(supabase, authUserId, wpUser, dryRun) {
  const payload = {
    user_id: authUserId,
    phpass_hash: wpUser.user_pass,
    migrated: false,
  }

  if (dryRun) {
    return payload
  }

  const { error } = await supabase
    .from('legacy_passwords')
    .upsert(payload, { onConflict: 'user_id' })

  if (error) {
    throw new Error(`Unable to upsert legacy password ${wpUser.email}: ${error.message}`)
  }

  return payload
}

async function main() {
  const options = parseCliArgs(process.argv)
  if (options.help) {
    console.log(HELP_TEXT.trim())
    return
  }

  const [{ createMigrationLogger }, { getMysqlConnection }, { getSupabaseAdminForMigration }] =
    await Promise.all([
      import('../lib/logger.js'),
      import('../lib/mysql.js'),
      import('../lib/supabase-admin.js'),
    ])

  const logger = createMigrationLogger('01-users')
  const mysql = await getMysqlConnection()
  const supabase = getSupabaseAdminForMigration()

  try {
    logger.info('Starting user migration', options)
    const wpUsers = await fetchWordpressUsers(mysql, options)
    const authUsersByEmail = await listAuthUsersByEmail(supabase)

    let created = 0
    let reused = 0

    for (const wpUser of wpUsers) {
      const email = String(wpUser.email || '').trim().toLowerCase()
      if (!email) {
        logger.warn('Skipping user without email', { wpUserId: wpUser.wp_user_id })
        continue
      }

      const existingUser = authUsersByEmail.get(email) || null
      const authUserId = await ensureAuthUser(supabase, existingUser, wpUser, options.dryRun)

      if (existingUser) {
        reused += 1
      } else {
        created += 1
        authUsersByEmail.set(email, { id: authUserId, email })
      }

      await upsertProfile(supabase, authUserId, wpUser, options.dryRun)
      await upsertLegacyPassword(supabase, authUserId, wpUser, options.dryRun)

      logger.info('Migrated user', {
        wpUserId: wpUser.wp_user_id,
        authUserId,
        email,
        mode: existingUser ? 'reused' : 'created',
        dryRun: options.dryRun,
      })
    }

    logger.info('User migration completed', {
      total: wpUsers.length,
      created,
      reused,
      dryRun: options.dryRun,
    })
  } finally {
    await mysql.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
