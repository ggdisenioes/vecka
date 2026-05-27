export const CONTENT_MEMBERSHIP_SLUG = 'club-vecka-costura'
export const PUBLIC_MEMBERSHIP_SLUG = CONTENT_MEMBERSHIP_SLUG
export const PUBLIC_MEMBERSHIP_NAME = 'Club VeCKA'

export const LEGACY_CLUB_MEMBERSHIP_SLUGS = [
  PUBLIC_MEMBERSHIP_SLUG,
  CONTENT_MEMBERSHIP_SLUG,
  'club-vecka-suscripcion-mensual',
  'club-vecka-suscripcion-anual',
  'club-vecka-suscripcion-anual-organizador-y-pack-de-errores-comunes',
]

export const MAY_2025_FOUNDERS_START = new Date('2025-05-01T00:00:00.000Z')
export const MAY_2025_FOUNDERS_END = new Date('2025-06-01T00:00:00.000Z')
export const STANDARD_CONTENT_START = new Date('2025-06-01T00:00:00.000Z')

const LEGACY_CONTENT_AVAILABLE_FROM = {
  7713: '2023-12-27T18:14:37.000Z',
  10537: '2025-01-14T07:42:04.000Z',
  12578: '2025-06-24T09:33:23.000Z',
  12885: '2025-08-04T07:13:29.000Z',
  14168: '2026-03-04T11:18:41.000Z',
  14178: '2026-03-04T11:45:28.000Z',
  14375: '2026-04-06T11:43:05.000Z',
  14537: '2026-05-12T06:33:10.000Z',
}

export function isLegacyClubMembershipSlug(slug) {
  return LEGACY_CLUB_MEMBERSHIP_SLUGS.includes(String(slug || ''))
}

export function isValidActiveGrant(grant, now = new Date()) {
  return (
    grant?.access_status === 'active' &&
    (!grant.expires_at || new Date(grant.expires_at) > now)
  )
}

export function getGrantAccessDate(grant) {
  const value = grant?.starts_at || grant?.granted_at || grant?.created_at
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function isMay2025FounderGrant(grant) {
  const accessDate = getGrantAccessDate(grant)
  return (
    accessDate &&
    accessDate >= MAY_2025_FOUNDERS_START &&
    accessDate < MAY_2025_FOUNDERS_END
  )
}

export function getClubAccessFromGrants(grants = [], now = new Date()) {
  const activeClubGrants = grants.filter((grant) => {
    const tierSlug = grant.membership_tiers?.slug || grant.tier_slug || grant.tierSlug
    return isValidActiveGrant(grant, now) && isLegacyClubMembershipSlug(tierSlug)
  })

  if (!activeClubGrants.length) {
    return { hasAccess: false, isFounder: false, grant: null, grants: [] }
  }

  const founderGrant = activeClubGrants.find(isMay2025FounderGrant)
  return {
    hasAccess: true,
    isFounder: Boolean(founderGrant),
    grant: founderGrant || activeClubGrants[0],
    grants: activeClubGrants,
  }
}

export function getContentAvailableDate(item) {
  const legacyDate = LEGACY_CONTENT_AVAILABLE_FROM[Number(item?.legacy_wp_id)]
  const value = item?.available_from || legacyDate || item?.published_at || item?.created_at
  if (!value) return null

  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function canAccessMembershipContentItem(item, access) {
  if (!access?.hasAccess) return false
  if (access.isFounder) return true

  const availableFrom = getContentAvailableDate(item)
  return Boolean(availableFrom && availableFrom >= STANDARD_CONTENT_START)
}

export function buildPublicMembershipSummary(access) {
  if (!access?.hasAccess) return []

  const grant = access.grant || {}
  return [{
    id: `public-${PUBLIC_MEMBERSHIP_SLUG}`,
    tierId: grant.tier_id || null,
    tierSlug: PUBLIC_MEMBERSHIP_SLUG,
    tierName: PUBLIC_MEMBERSHIP_NAME,
    billingPeriod: grant.membership_tiers?.billing_period || null,
    priceArs: Number(grant.membership_tiers?.price_ars || 0),
    features: Array.isArray(grant.membership_tiers?.features) ? grant.membership_tiers.features : [],
    description: grant.membership_tiers?.description || '',
    grantedAt: grant.granted_at || null,
    startsAt: grant.starts_at || null,
    expiresAt: grant.expires_at || null,
    accessStatus: grant.access_status || 'active',
    founderArchiveAccess: access.isFounder,
  }]
}
