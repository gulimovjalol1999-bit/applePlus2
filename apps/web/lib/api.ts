const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1'

// Avoid circular import: read auth state lazily
function getAccessToken(): string | null {
  try {
    const raw = localStorage.getItem('ap-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.accessToken ?? null
  } catch {
    return null
  }
}

const GUEST_SESSION_KEY = 'ap-guest-session'

export function getOrCreateGuestSessionId(): string {
  try {
    let id = localStorage.getItem(GUEST_SESSION_KEY)
    if (!id) {
      id = crypto.randomUUID()
      localStorage.setItem(GUEST_SESSION_KEY, id)
    }
    return id
  } catch {
    return crypto.randomUUID()
  }
}

export function clearGuestSessionId(): void {
  try {
    localStorage.removeItem(GUEST_SESSION_KEY)
  } catch { /* ignore */ }
}

function getRefreshTokenValue(): string | null {
  try {
    const raw = localStorage.getItem('ap-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state?.refreshToken ?? null
  } catch {
    return null
  }
}

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshTokenValue()
  if (!refreshToken) return null
  try {
    const res = await fetch(`${BASE_URL}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    })
    if (!res.ok) return null
    const json = await res.json()
    const payload = json?.data ?? json
    const { accessToken, refreshToken: newRefresh } = payload
    // Update persisted store directly
    const raw = localStorage.getItem('ap-auth')
    if (raw) {
      const parsed = JSON.parse(raw)
      parsed.state.accessToken = accessToken
      parsed.state.refreshToken = newRefresh
      localStorage.setItem('ap-auth', JSON.stringify(parsed))
    }
    return accessToken as string
  } catch {
    return null
  }
}

type QueryParams = Record<string, string | number | boolean | undefined>

function buildQuery(params?: QueryParams): string {
  if (!params) return ''
  const q = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== '') q.set(k, String(v))
  }
  const s = q.toString()
  return s ? `?${s}` : ''
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  retry = true,
): Promise<T> {
  const token = getAccessToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`
  else if (path.startsWith('/cart')) headers['X-Session-Id'] = getOrCreateGuestSessionId()

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  if (res.status === 401 && retry) {
    const newToken = await refreshAccessToken()
    if (newToken) return request<T>(path, options, false)
    // Clear stale auth
    try {
      const raw = localStorage.getItem('ap-auth')
      if (raw) {
        const parsed = JSON.parse(raw)
        parsed.state.accessToken = null
        parsed.state.refreshToken = null
        parsed.state.user = null
        parsed.state.isAuthenticated = false
        localStorage.setItem('ap-auth', JSON.stringify(parsed))
      }
    } catch { /* ignore */ }
    throw new Error('Session expired. Please sign in again.')
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}))
    // Error may be at top level or nested inside .data
    const errBody = body?.data ?? body
    const message = Array.isArray(errBody?.message)
      ? errBody.message.join(', ')
      : (errBody?.message ?? body?.message ?? `Request failed: ${res.status}`)
    throw new Error(message)
  }

  if (res.status === 204) return undefined as T
  const json = await res.json()
  // Unwrap NestJS ResponseTransformInterceptor: { success: true, data: T }
  return ((json as { data?: unknown })?.data ?? json) as T
}

export const api = {
  get: <T>(path: string, params?: QueryParams) =>
    request<T>(`${path}${buildQuery(params)}`, { method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: { headers?: Record<string, string> }) =>
    request<T>(path, {
      method: 'POST',
      headers: options?.headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      body: body !== undefined ? JSON.stringify(body) : undefined,
    }),
  del: <T = void>(path: string) => request<T>(path, { method: 'DELETE' }),
}
