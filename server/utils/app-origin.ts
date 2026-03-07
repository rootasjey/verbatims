import { getRequestURL } from 'h3'
import type { H3Event } from 'h3'

export function resolveAppOrigin(event: H3Event): string {
  const runtimeConfig = useRuntimeConfig(event)
  const requestUrl = getRequestURL(event)
  const requestOrigin = requestUrl.origin.replace(/\/$/, '')
  const authUrl = normalizeUrl(String(runtimeConfig.public.authUrl || ''))
  const siteUrl = normalizeUrl(String(runtimeConfig.public.siteUrl || ''))
  const hostname = requestUrl.hostname.toLowerCase()
  const hasExplicitPort = Boolean(requestUrl.port)
  const isLocalHost = hostname === 'localhost'
    || hostname === '127.0.0.1'
    || hostname === '::1'
    || hostname.endsWith('.local')

  if (import.meta.dev && isLocalHost && !hasExplicitPort && authUrl) {
    return authUrl
  }

  if (requestOrigin) {
    return requestOrigin
  }

  if (import.meta.dev && authUrl) {
    return authUrl
  }

  if (siteUrl) {
    return siteUrl
  }

  return authUrl || requestOrigin
}

function normalizeUrl(value: string): string {
  return value.trim().replace(/\/$/, '')
}