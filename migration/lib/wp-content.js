const MEMBERSHIP_KEYWORDS = [
  'club',
  'membresia',
  'membresía',
  'aula',
  'suscripcion',
  'suscripción',
  'vivo',
  'clase en vivo',
  'clase online',
  'contenido exclusivo',
  'bonus',
  'pack',
]

const MEDIA_EXTENSIONS = ['pdf', 'zip', 'jpg', 'jpeg', 'png', 'webp', 'gif', 'mp4', 'mov']

function normalize(value) {
  return String(value || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function decodeEntities(value) {
  return String(value || '')
    .replaceAll('&amp;', '&')
    .replaceAll('&quot;', '"')
    .replaceAll('&#039;', "'")
    .replaceAll('&lt;', '<')
    .replaceAll('&gt;', '>')
}

export function stripHtml(value) {
  return decodeEntities(String(value || ''))
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

export function removeIframeTags(value) {
  return String(value || '').replace(/<iframe[\s\S]*?<\/iframe>/gi, ' ')
}

export function htmlToSummary(value, limit = 220) {
  const plain = stripHtml(value)
  if (!plain) return null
  return plain.length > limit ? `${plain.slice(0, limit).trim()}…` : plain
}

export function mapWpPostStatus(status) {
  switch (String(status || '').toLowerCase()) {
    case 'publish':
    case 'private':
    case 'future':
      return 'published'
    case 'trash':
      return 'archived'
    case 'draft':
    case 'pending':
    default:
      return 'draft'
  }
}

export function detectMembershipContentType(row) {
  const source = normalize(
    [row.post_title, row.post_name, row.post_excerpt, row.post_content].filter(Boolean).join(' '),
  )

  if (/<iframe\b/i.test(row.post_content || '') || source.includes('vimeo') || source.includes('youtube')) {
    return 'embed'
  }

  if (/<img\b/i.test(row.post_content || '')) {
    return 'image'
  }

  if (MEDIA_EXTENSIONS.some((extension) => source.includes(`.${extension}`))) {
    return 'download'
  }

  if (source.includes('descarg') || source.includes('moldes') || source.includes('archivo')) {
    return 'download'
  }

  return 'text'
}

export function extractPrimaryMediaUrl(value) {
  const html = decodeEntities(String(value || ''))

  const iframeMatch = html.match(/<iframe[^>]+src=["']([^"']+)["']/i)
  if (iframeMatch?.[1]) return iframeMatch[1]

  const imageMatch = html.match(/<img[^>]+src=["']([^"']+)["']/i)
  if (imageMatch?.[1]) return imageMatch[1]

  const mediaLinkMatch = html.match(/<a[^>]+href=["']([^"']+\.(?:pdf|zip|jpg|jpeg|png|webp|gif|mp4|mov))["']/i)
  if (mediaLinkMatch?.[1]) return mediaLinkMatch[1]

  return null
}

export function scoreMembershipContentCandidate(row) {
  const haystack = normalize(
    [row.post_title, row.post_name, row.post_excerpt, row.post_content].filter(Boolean).join(' '),
  )

  let score = 0
  const reasons = []

  for (const keyword of MEMBERSHIP_KEYWORDS) {
    if (haystack.includes(keyword)) {
      score += 2
      reasons.push(`keyword:${keyword}`)
    }
  }

  if (row.post_type === 'elementor_library') {
    score += 2
    reasons.push('post_type:elementor_library')
  }

  if (row.post_type === 'sfwd-lessons') {
    score += 1
    reasons.push('post_type:sfwd-lessons')
  }

  if (row.post_title && normalize(row.post_title).includes('club vecka')) {
    score += 2
    reasons.push('title:club-vecka')
  }

  if (/<iframe\b/i.test(row.post_content || '')) {
    score += 2
    reasons.push('contains:iframe')
  }

  if (/<img\b/i.test(row.post_content || '')) {
    score += 1
    reasons.push('contains:image')
  }

  return { score, reasons }
}

export function isLikelyMembershipContent(row) {
  return scoreMembershipContentCandidate(row).score > 0
}
