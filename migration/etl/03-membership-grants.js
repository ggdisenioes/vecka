import { parseCliArgs } from '../lib/cli.js'
import { mapMembershipStatus, normalizeWpDate } from '../lib/wp-helpers.js'

const HELP_TEXT = `
Usage:
  npm run migration:membership-grants
  npm run migration:membership-grants -- --limit=10
  npm run migration:membership-grants -- --dry-run
`

async function fetchMembershipRows(connection, options) {
  const limitSql = options.limit ? 'limit ?' : ''
  const params = options.limit ? [options.limit] : []

  const [rows] = await connection.execute(
    `
      select
        p.ID as membership_id,
        p.post_author as wp_user_id,
        p.post_parent as plan_wp_id,
        p.post_status as wp_status,
        p.post_date_gmt as post_date_gmt,
        max(case when pm.meta_key = '_product_id' then pm.meta_value end) as product_id,
        max(case when pm.meta_key = '_order_id' then pm.meta_value end) as order_id,
        max(case when pm.meta_key = '_start_date' then pm.meta_value end) as start_date,
        max(case when pm.meta_key = '_end_date' then pm.meta_value end) as end_date,
        max(case when pm.meta_key = '_cancelled_date' then pm.meta_value end) as cancelled_date
      from wp_posts p
      left join wp_postmeta pm on pm.post_id = p.ID
      where p.post_type = 'wc_user_membership'
      group by p.ID, p.post_author, p.post_parent, p.post_status, p.post_date_gmt
      order by p.ID asc
      ${limitSql}
    `,
    params,
  )

  return rows
}

function toNullableInt(value) {
  const parsed = Number.parseInt(String(value || '').trim(), 10)
  return Number.isFinite(parsed) ? parsed : null
}

function uniqueNumericValues(values) {
  return [...new Set(values.map((value) => Number(value)).filter((value) => Number.isFinite(value)))]
}

function chunkValues(values, size = 200) {
  const chunks = []
  for (let index = 0; index < values.length; index += size) {
    chunks.push(values.slice(index, index + size))
  }
  return chunks
}

async function fetchProfilesByLegacyIds(supabase, legacyIds) {
  const rows = []

  for (const chunk of chunkValues(uniqueNumericValues(legacyIds))) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, legacy_wp_id')
      .in('legacy_wp_id', chunk)

    if (error) {
      throw new Error(`Unable to load migrated profiles: ${error.message}`)
    }

    rows.push(...(data || []))
  }

  return rows
}

async function fetchMembershipTiersByLegacyIds(supabase, legacyIds) {
  const rows = []

  for (const chunk of chunkValues(uniqueNumericValues(legacyIds))) {
    const { data, error } = await supabase
      .from('membership_tiers')
      .select('id, legacy_wp_id')
      .in('legacy_wp_id', chunk)

    if (error) {
      throw new Error(`Unable to load migrated membership tiers: ${error.message}`)
    }

    rows.push(...(data || []))
  }

  return rows
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

  const logger = createMigrationLogger('03-membership-grants')
  const mysql = await getMysqlConnection()
  const supabase = getSupabaseAdminForMigration()

  try {
    const memberships = await fetchMembershipRows(mysql, options)
    logger.info('Starting membership grant migration', {
      total: memberships.length,
      dryRun: options.dryRun,
    })

    const wpUserIds = memberships.map((membership) => membership.wp_user_id)
    const planWpIds = memberships.map((membership) => membership.plan_wp_id)

    const [profiles, tiers] = await Promise.all([
      fetchProfilesByLegacyIds(supabase, wpUserIds),
      fetchMembershipTiersByLegacyIds(supabase, planWpIds),
    ])

    const profileMap = new Map((profiles || []).map((row) => [Number(row.legacy_wp_id), row.id]))
    const tierMap = new Map((tiers || []).map((row) => [Number(row.legacy_wp_id), row.id]))

    let migrated = 0
    let skipped = 0

    for (const membership of memberships) {
      const userId = profileMap.get(Number(membership.wp_user_id))
      const tierId = tierMap.get(Number(membership.plan_wp_id))

      if (!userId || !tierId) {
        skipped += 1
        logger.warn('Skipped membership grant due to missing dependency', {
          membershipId: membership.membership_id,
          wpUserId: membership.wp_user_id,
          planWpId: membership.plan_wp_id,
          hasUser: Boolean(userId),
          hasTier: Boolean(tierId),
        })
        continue
      }

      const grantedAt =
        normalizeWpDate(membership.post_date_gmt) ||
        normalizeWpDate(membership.start_date) ||
        new Date().toISOString()
      const startsAt = normalizeWpDate(membership.start_date) || grantedAt
      const expiresAt = normalizeWpDate(membership.end_date)
      const cancelledAt = normalizeWpDate(membership.cancelled_date)
      const payload = {
        tier_id: tierId,
        user_id: userId,
        access_status: mapMembershipStatus(membership.wp_status),
        grant_type: membership.order_id || membership.product_id ? 'payment' : 'manual',
        granted_at: grantedAt,
        starts_at: startsAt,
        expires_at: expiresAt,
        cancelled_at: cancelledAt,
        notes: `Migrated from WordPress membership #${membership.membership_id}`,
        legacy_wp_id: membership.membership_id,
        legacy_order_wp_id: toNullableInt(membership.order_id),
        legacy_product_wp_id: toNullableInt(membership.product_id),
        legacy_status: membership.wp_status,
        updated_at: new Date().toISOString(),
      }

      if (!options.dryRun) {
        const { data: existingGrant, error: existingGrantError } = await supabase
          .from('membership_grants')
          .select('id')
          .eq('legacy_wp_id', membership.membership_id)
          .maybeSingle()

        if (existingGrantError) {
          throw new Error(
            `Unable to look up membership grant ${membership.membership_id}: ${existingGrantError.message}`,
          )
        }

        if (existingGrant) {
          const { error: updateError } = await supabase
            .from('membership_grants')
            .update(payload)
            .eq('id', existingGrant.id)

          if (updateError) {
            throw new Error(
              `Unable to update membership grant ${membership.membership_id}: ${updateError.message}`,
            )
          }
        } else {
          const { error: insertError } = await supabase.from('membership_grants').insert(payload)

          if (insertError) {
            throw new Error(
              `Unable to insert membership grant ${membership.membership_id}: ${insertError.message}`,
            )
          }
        }
      }

      migrated += 1
      logger.info('Migrated membership grant', {
        membershipId: membership.membership_id,
        wpUserId: membership.wp_user_id,
        planWpId: membership.plan_wp_id,
        accessStatus: payload.access_status,
        grantType: payload.grant_type,
        dryRun: options.dryRun,
      })
    }

    logger.info('Membership grant migration completed', {
      total: memberships.length,
      migrated,
      skipped,
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
