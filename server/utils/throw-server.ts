import { createError } from 'h3'

/**
 * Utility to throw a Nuxt createError with a compact API.
 * Usage: throwServer(401, 'Authentication required', { data: { foo: 'bar' } })
 */
export function throwServer(statusCode: number, statusMessage?: string, extra?: Record<string, any>) {
  const payload: Record<string, any> = {
    statusCode: Number(statusCode) || 500
  }
  if (statusMessage) payload.statusMessage = String(statusMessage)
  if (extra && typeof extra === 'object') Object.assign(payload, extra)

  throw createError(payload)
}

export default throwServer
