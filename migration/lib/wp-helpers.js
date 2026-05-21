export function parseSerializedIntegerList(value) {
  const input = String(value || '')
  const result = []
  const regex = /i:\d+;i:(\d+);/g
  let match = regex.exec(input)

  while (match) {
    const parsed = Number.parseInt(match[1], 10)
    if (Number.isFinite(parsed)) {
      result.push(parsed)
    }
    match = regex.exec(input)
  }

  return result
}

export function normalizeWpDate(value) {
  const input = String(value || '').trim()
  if (!input || input === '0000-00-00 00:00:00') {
    return null
  }

  const iso = input.includes('T') ? input : `${input.replace(' ', 'T')}Z`
  const date = new Date(iso)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

export function mapMembershipStatus(wpStatus) {
  switch (wpStatus) {
    case 'wcm-active':
      return 'active'
    case 'wcm-expired':
      return 'expired'
    case 'wcm-cancelled':
      return 'revoked'
    default:
      return 'revoked'
  }
}

export function inferMembershipBillingPeriod({ title, productRows, accessLength }) {
  const normalizedTitle = String(title || '').toLowerCase()
  const normalizedAccessLength = String(accessLength || '').toLowerCase()
  const productTitles = productRows.map((row) => String(row.title || '').toLowerCase())

  if (normalizedTitle.includes('mensual') || productTitles.some((titleItem) => titleItem.includes('mensual'))) {
    return 'monthly'
  }

  if (normalizedTitle.includes('anual') || productTitles.some((titleItem) => titleItem.includes('anual'))) {
    return 'annual'
  }

  if (normalizedAccessLength.includes('year')) {
    return 'annual'
  }

  if (productRows.some((row) => row.subscription_period === 'month')) {
    return 'monthly'
  }

  return 'monthly'
}

export function inferMembershipPrice(productRows) {
  const numericPrices = productRows
    .map((row) => Number(row.regular_price || row.price || 0))
    .filter((value) => Number.isFinite(value) && value > 0)

  if (!numericPrices.length) {
    return 0
  }

  return Math.round(Math.max(...numericPrices))
}
