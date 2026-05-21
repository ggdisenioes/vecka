import { parseCliArgs } from '../lib/cli.js'
import {
  inferMembershipBillingPeriod,
  inferMembershipPrice,
  parseSerializedIntegerList,
} from '../lib/wp-helpers.js'

const HELP_TEXT = `
Usage:
  npm run migration:membership-tiers
  npm run migration:membership-tiers -- --dry-run
`

async function fetchMembershipPlans(connection) {
  const [rows] = await connection.execute(
    `
      select
        p.ID as plan_id,
        p.post_title as title,
        p.post_name as slug,
        p.post_status as post_status,
        max(case when pm.meta_key = '_product_ids' then pm.meta_value end) as product_ids,
        max(case when pm.meta_key = '_access_length' then pm.meta_value end) as access_length
      from wp_posts p
      left join wp_postmeta pm on pm.post_id = p.ID
      where p.post_type = 'wc_membership_plan'
      group by p.ID, p.post_title, p.post_name, p.post_status
      order by p.ID asc
    `,
  )

  return rows
}

async function fetchProductsByIds(connection, productIds) {
  if (!productIds.length) {
    return []
  }

  const placeholders = productIds.map(() => '?').join(', ')
  const [rows] = await connection.execute(
    `
      select
        p.ID as product_id,
        p.post_title as title,
        max(case when pm.meta_key = '_price' then pm.meta_value end) as price,
        max(case when pm.meta_key = '_regular_price' then pm.meta_value end) as regular_price,
        max(case when pm.meta_key = '_subscription_period' then pm.meta_value end) as subscription_period,
        max(case when pm.meta_key = '_subscription_period_interval' then pm.meta_value end) as subscription_interval,
        max(case when pm.meta_key = '_subscription_trial_length' then pm.meta_value end) as trial_length
      from wp_posts p
      left join wp_postmeta pm on pm.post_id = p.ID
      where p.ID in (${placeholders})
      group by p.ID, p.post_title
      order by p.ID asc
    `,
    productIds,
  )

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

  const logger = createMigrationLogger('02-membership-tiers')
  const mysql = await getMysqlConnection()
  const supabase = getSupabaseAdminForMigration()

  try {
    const plans = await fetchMembershipPlans(mysql)
    logger.info('Starting membership tier migration', { total: plans.length, dryRun: options.dryRun })

    for (const plan of plans) {
      const productIds = parseSerializedIntegerList(plan.product_ids)
      const productRows = await fetchProductsByIds(mysql, productIds)
      const payload = {
        slug: plan.slug,
        name: plan.title,
        description: null,
        status: plan.post_status === 'publish' ? 'published' : 'draft',
        price_ars: inferMembershipPrice(productRows),
        billing_period: inferMembershipBillingPeriod({
          title: plan.title,
          productRows,
          accessLength: plan.access_length,
        }),
        trial_days: 0,
        sort_order: 0,
        legacy_wp_id: plan.plan_id,
        legacy_product_wp_ids: productIds.length ? productIds : null,
        legacy_access_length: plan.access_length || null,
        updated_at: new Date().toISOString(),
      }

      if (!options.dryRun) {
        const { data: existingTier, error: existingTierError } = await supabase
          .from('membership_tiers')
          .select('id')
          .eq('legacy_wp_id', plan.plan_id)
          .maybeSingle()

        if (existingTierError) {
          throw new Error(
            `Unable to look up membership tier ${plan.plan_id}: ${existingTierError.message}`,
          )
        }

        if (existingTier) {
          const { error: updateError } = await supabase
            .from('membership_tiers')
            .update(payload)
            .eq('id', existingTier.id)

          if (updateError) {
            throw new Error(`Unable to update membership tier ${plan.plan_id}: ${updateError.message}`)
          }
        } else {
          const { error: insertError } = await supabase.from('membership_tiers').insert(payload)

          if (insertError) {
            throw new Error(`Unable to insert membership tier ${plan.plan_id}: ${insertError.message}`)
          }
        }
      }

      logger.info('Migrated membership tier', {
        planId: plan.plan_id,
        slug: plan.slug,
        productIds,
        priceArs: payload.price_ars,
        billingPeriod: payload.billing_period,
        dryRun: options.dryRun,
      })
    }

    logger.info('Membership tier migration completed', { total: plans.length, dryRun: options.dryRun })
  } finally {
    await mysql.end()
  }
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
