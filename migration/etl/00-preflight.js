import { createMigrationLogger } from '../lib/logger.js'
import { getMysqlConnection } from '../lib/mysql.js'
import { getSupabaseAdminForMigration } from '../lib/supabase-admin.js'

async function main() {
  const logger = createMigrationLogger('00-preflight')
  const mysql = await getMysqlConnection()
  const supabase = getSupabaseAdminForMigration()

  try {
    logger.info('Checking MariaDB connectivity')
    const [wpUsersCountRows] = await mysql.execute('select count(*) as count from wp_users')
    const [wpUsermetaCountRows] = await mysql.execute('select count(*) as count from wp_usermeta')

    logger.info('MariaDB ready', {
      wpUsers: wpUsersCountRows[0]?.count ?? 0,
      wpUsermeta: wpUsermetaCountRows[0]?.count ?? 0,
    })

    logger.info('Checking Supabase connectivity')
    const [{ data: authUsers, error: authError }, { error: profilesError }, { error: legacyError }] =
      await Promise.all([
        supabase.auth.admin.listUsers({ page: 1, perPage: 1 }),
        supabase.from('profiles').select('id').limit(1),
        supabase.from('legacy_passwords').select('user_id').limit(1),
      ])

    if (authError) {
      throw new Error(`Supabase auth check failed: ${authError.message}`)
    }
    if (profilesError) {
      throw new Error(`Profiles check failed: ${profilesError.message}`)
    }
    if (legacyError) {
      throw new Error(`Legacy passwords check failed: ${legacyError.message}`)
    }

    logger.info('Supabase ready', {
      authUsersVisible: authUsers?.users?.length ?? 0,
    })

    logger.info('Preflight passed')
  } finally {
    await mysql.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
