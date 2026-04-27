import { Readable } from 'node:stream'
import { env, requireEnv } from '@/lib/env'

const VIMEO_API_BASE_URL = 'https://api.vimeo.com'

function buildHeaders(extraHeaders = {}) {
  return {
    Accept: 'application/vnd.vimeo.*+json;version=3.4',
    Authorization: `Bearer ${requireEnv('VIMEO_ACCESS_TOKEN', env.vimeoAccessToken)}`,
    ...extraHeaders,
  }
}

async function parseJsonSafely(response) {
  const text = await response.text()
  if (!text) return {}

  try {
    return JSON.parse(text)
  } catch {
    return { message: text }
  }
}

async function vimeoFetch(path, options = {}) {
  const response = await fetch(`${VIMEO_API_BASE_URL}${path}`, {
    ...options,
    headers: buildHeaders(options.headers),
  })

  if (!response.ok) {
    const payload = await parseJsonSafely(response)
    const message = payload.error || payload.message || `Vimeo request failed with status ${response.status}`
    throw new Error(message)
  }

  return parseJsonSafely(response)
}

export function hasVimeoUploadConfig() {
  return Boolean(env.vimeoAccessToken)
}

export function extractVimeoId(value) {
  const input = String(value || '').trim()
  if (!input) return ''

  const match = input.match(
    /(?:player\.)?vimeo\.com\/(?:video\/|channels\/[^/]+\/|groups\/[^/]+\/videos\/)?(\d+)/i,
  )

  if (match?.[1]) {
    return match[1]
  }

  if (/^\d+$/.test(input)) {
    return input
  }

  return ''
}

export function normalizeVimeoUrl(value) {
  const input = String(value || '').trim()
  if (!input) return ''

  const vimeoId = extractVimeoId(input)
  if (vimeoId) {
    return `https://player.vimeo.com/video/${vimeoId}`
  }

  return input
}

export function normalizeLessonVideoFields(videoProvider, values = {}) {
  const provider = String(videoProvider || 'none')
  const normalizedVimeoUrl = normalizeVimeoUrl(values.vimeoUrl)
  const normalizedExternalUrl = String(values.externalVideoUrl || '').trim()

  if (provider === 'vimeo') {
    return {
      video_provider: 'vimeo',
      vimeo_url: normalizedVimeoUrl,
      external_video_url: '',
    }
  }

  if (provider === 'external') {
    return {
      video_provider: 'external',
      vimeo_url: '',
      external_video_url: normalizedExternalUrl,
    }
  }

  return {
    video_provider: 'none',
    vimeo_url: '',
    external_video_url: '',
  }
}

export async function getVimeoVideo(uri) {
  if (!uri) {
    throw new Error('Missing Vimeo video URI')
  }

  return vimeoFetch(`${uri}?fields=uri,link,name,player_embed_url,duration,transcode.status`)
}

export async function uploadVideoToVimeo({ file, title, description = '' }) {
  if (!file || typeof file === 'string') {
    throw new Error('Missing video file')
  }

  const createPayload = {
    name: String(title || file.name || 'Clase Vecka').trim(),
    description: String(description || '').trim(),
    upload: {
      approach: 'tus',
      size: String(file.size || 0),
    },
  }

  const createdVideo = await vimeoFetch('/me/videos', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(createPayload),
  })

  const uploadLink = createdVideo?.upload?.upload_link
  if (!uploadLink) {
    throw new Error('Vimeo did not return an upload URL')
  }

  const uploadResponse = await fetch(uploadLink, {
    method: 'PATCH',
    headers: {
      'Tus-Resumable': '1.0.0',
      'Upload-Offset': '0',
      'Content-Type': 'application/offset+octet-stream',
    },
    body: Readable.fromWeb(file.stream()),
    duplex: 'half',
  })

  if (!uploadResponse.ok) {
    const message = await uploadResponse.text()
    throw new Error(message || `Vimeo upload failed with status ${uploadResponse.status}`)
  }

  const video = await getVimeoVideo(createdVideo.uri)

  return {
    durationSeconds: Number(video.duration || 0),
    embedUrl: normalizeVimeoUrl(video.player_embed_url || video.link || ''),
    name: video.name || createPayload.name,
    transcodeStatus: video.transcode?.status || 'in_progress',
    uri: video.uri || createdVideo.uri,
  }
}
