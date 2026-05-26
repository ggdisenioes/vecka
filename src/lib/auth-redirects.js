export function getSafeInternalPath(value, fallback = '/') {
  const input = String(value || '').trim()

  if (!input.startsWith('/') || input.startsWith('//') || input.includes('\\')) {
    return fallback
  }

  return input
}

export function getPostLoginPath(role, requestedPath) {
  const safePath = getSafeInternalPath(requestedPath, '/')
  const isStaff = role === 'admin' || role === 'editorial'

  if (safePath === '/admin' || safePath.startsWith('/admin/')) {
    return isStaff ? safePath : '/cuenta'
  }

  if (safePath === '/cuenta' || safePath.startsWith('/cuenta')) {
    return isStaff ? '/admin' : safePath
  }

  if (safePath === '/login' || safePath.startsWith('/login?') || safePath === '/') {
    return isStaff ? '/admin' : '/cuenta'
  }

  return safePath
}

export function buildRelativeUrl(path, params = {}) {
  const url = new URL(getSafeInternalPath(path, '/'), 'http://localhost')

  Object.entries(params).forEach(([key, value]) => {
    if (value) {
      url.searchParams.set(key, value)
    }
  })

  return `${url.pathname}${url.search}`
}

export function buildLoginPageUrl(nextPath, params = {}) {
  return buildRelativeUrl('/login', {
    ...params,
    next: getSafeInternalPath(nextPath, '/'),
  })
}
