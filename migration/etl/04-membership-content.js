import { mkdir, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { parseCliArgs } from '../lib/cli.js'
import {
  detectMembershipContentType,
  extractPrimaryMediaUrl,
  htmlToSummary,
  isLikelyMembershipContent,
  mapWpPostStatus,
  scoreMembershipContentCandidate,
  removeIframeTags,
} from '../lib/wp-content.js'

const HELP_TEXT = `
Usage:
  npm run migration:membership-content -- --inventory
  npm run migration:membership-content -- --tier-slug=club-vecka-costura --source-ids=10537,14017
  npm run migration:membership-content -- --tier-slug=club-vecka-costura --source-ids=10537,14017 --dry-run

Options:
  --inventory              Exporta candidatos desde WordPress a migration/exports/membership-content.inventory.json
  --tier-slug=<slug>       Tier destino para la importación
  --source-ids=1,2,3       IDs de wp_posts a importar
  --dry-run                Calcula todo pero no escribe en Supabase
`

const ALLOWED_POST_TYPES = ['page', 'post', 'elementor_library', 'sfwd-lessons', 'product']
const ALLOWED_POST_STATUSES = ['publish', 'draft', 'private', 'trash', 'future', 'pending']

function uniqueNumericValues(values) {
  return [...new Set(values.map((value) => Number(value)).filter((value) => Number.isFinite(value) && value > 0))]
}

function buildInventoryRow(row) {
  const scoreData = scoreMembershipContentCandidate(row)
  return {
    wp_id: row.wp_id,
    post_type: row.post_type,
    post_status: row.post_status,
    title: row.post_title,
    slug: row.post_name,
    content_type: detectMembershipContentType(row),
    summary: htmlToSummary(row.post_excerpt || row.post_content, 180),
    body_preview: htmlToSummary(row.post_content, 280),
    score: scoreData.score,
    reasons: scoreData.reasons,
  }
}

async function fetchAllMembershipContentRows(connection) {
  const [rows] = await connection.execute(
    `
      select
        p.ID as wp_id,
        p.post_type,
        p.post_status,
        p.post_title,
        p.post_name,
        p.post_excerpt,
        p.post_content
      from wp_posts p
      where p.post_type in (${ALLOWED_POST_TYPES.map(() => '?').join(', ')})
        and p.post_status in (${ALLOWED_POST_STATUSES.map(() => '?').join(', ')})
      order by p.ID asc
    `,
    [...ALLOWED_POST_TYPES, ...ALLOWED_POST_STATUSES],
  )

  return rows.filter((row) => isLikelyMembershipContent(row))
}

async function fetchMembershipContentRowsByIds(connection, ids) {
  if (!ids.length) return []

  const placeholders = ids.map(() => '?').join(', ')
  const [rows] = await connection.execute(
    `
      select
        p.ID as wp_id,
        p.post_type,
        p.post_status,
        p.post_title,
        p.post_name,
        p.post_excerpt,
        p.post_content
      from wp_posts p
      where p.ID in (${placeholders})
      order by p.ID asc
    `,
    ids,
  )

  return rows
}

async function getTierBySlug(supabase, slug) {
  const { data, error } = await supabase
    .from('membership_tiers')
    .select('id, slug, name, status')
    .eq('slug', slug)
    .maybeSingle()

  if (error) {
    throw new Error(`Unable to load membership tier "${slug}": ${error.message}`)
  }

  if (!data) {
    throw new Error(`Membership tier "${slug}" not found`)
  }

  return data
}

async function upsertContentItem(supabase, payload) {
  const { data: existing, error: lookupError } = await supabase
    .from('membership_content_items')
    .select('id')
    .eq('legacy_wp_id', payload.legacy_wp_id)
    .maybeSingle()

  if (lookupError) {
    throw new Error(`Unable to look up membership content ${payload.legacy_wp_id}: ${lookupError.message}`)
  }

  if (existing) {
    const { error: updateError } = await supabase
      .from('membership_content_items')
      .update(payload)
      .eq('id', existing.id)

    if (updateError) {
      throw new Error(`Unable to update membership content ${payload.legacy_wp_id}: ${updateError.message}`)
    }

    return { action: 'updated', id: existing.id }
  }

  const { data, error: insertError } = await supabase
    .from('membership_content_items')
    .insert(payload)
    .select('id')
    .single()

  if (insertError) {
    throw new Error(`Unable to insert membership content ${payload.legacy_wp_id}: ${insertError.message}`)
  }

  return { action: 'inserted', id: data.id }
}

async function writeInventoryFile(rootDir, rows) {
  const exportsDir = path.join(rootDir, 'migration', 'exports')
  await mkdir(exportsDir, { recursive: true })
  const filePath = path.join(exportsDir, 'membership-content.inventory.json')
  await writeFile(filePath, `${JSON.stringify(rows, null, 2)}\n`, 'utf8')
  return filePath
}

async function main() {
  const options = parseCliArgs(process.argv)
  if (options.help) {
    console.log(HELP_TEXT.trim())
    return
  }

  const [{ createMigrationLogger }, { getMysqlConnection }, { getSupabaseAdminForMigration }, { migrationConfig }] =
    await Promise.all([
      import('../lib/logger.js'),
      import('../lib/mysql.js'),
      import('../lib/supabase-admin.js'),
      import('../lib/config.js'),
    ])

  const logger = createMigrationLogger('04-membership-content')
  const mysql = await getMysqlConnection()
  const supabase = getSupabaseAdminForMigration()

  try {
    if (options.inventory) {
      const rows = await fetchAllMembershipContentRows(mysql)
      const inventory = rows.map(buildInventoryRow).sort((a, b) => b.score - a.score || a.wp_id - b.wp_id)
      const filePath = await writeInventoryFile(migrationConfig.rootDir, inventory)
      logger.info('Membership content inventory written', { total: inventory.length, filePath })
      inventory.slice(0, 25).forEach((item) => {
        logger.info('Inventory item', item)
      })
      return
    }

    const sourceIds = uniqueNumericValues(options.sourceIds)
    if (!options.tierSlug) {
      throw new Error('Missing required option: --tier-slug=<slug>')
    }
    if (!sourceIds.length) {
      throw new Error('Missing required option: --source-ids=1,2,3. Run with --inventory first.')
    }

    const tier = await getTierBySlug(supabase, options.tierSlug)
    const rows = await fetchMembershipContentRowsByIds(mysql, sourceIds)
    const rowMap = new Map(rows.map((row) => [Number(row.wp_id), row]))
    const orderedRows = sourceIds.map((id) => rowMap.get(id)).filter(Boolean)

    if (!orderedRows.length) {
      throw new Error('None of the requested WordPress IDs were found in wp_posts')
    }

    logger.info('Starting membership content migration', {
      tierSlug: tier.slug,
      tierId: tier.id,
      total: orderedRows.length,
      dryRun: options.dryRun,
    })

    let migrated = 0
    let skipped = 0

    for (const row of orderedRows) {
      const contentType = detectMembershipContentType(row)
      const mediaUrl = extractPrimaryMediaUrl(row.post_content)
      const bodyHtml = contentType === 'embed' ? removeIframeTags(row.post_content) : row.post_content
      const payload = {
        tier_id: tier.id,
        legacy_wp_id: row.wp_id,
        type: contentType,
        title: String(row.post_title || `Contenido ${row.wp_id}`).trim(),
        summary: htmlToSummary(row.post_excerpt || row.post_content, 180),
        body: String(bodyHtml || '').trim() || null,
        media_url: mediaUrl,
        bucket_name: null,
        storage_path: null,
        file_name: null,
        mime_type: null,
        size_bytes: 0,
        sort_order: migrated + skipped,
        status: mapWpPostStatus(row.post_status),
      }

      if (options.dryRun) {
        logger.info('Dry-run membership content payload', {
          wpId: row.wp_id,
          type: payload.type,
          title: payload.title,
          status: payload.status,
          mediaUrl: payload.media_url,
        })
        migrated += 1
        continue
      }

      const result = await upsertContentItem(supabase, payload)
      migrated += 1
      logger.info('Migrated membership content', {
        wpId: row.wp_id,
        action: result.action,
        type: payload.type,
        title: payload.title,
        status: payload.status,
        mediaUrl: payload.media_url,
      })
    }

    logger.info('Membership content migration completed', {
      tierSlug: tier.slug,
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
