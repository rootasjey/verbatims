/**
 * Utility to throw a Nuxt createError with a compact API.
 * Usage: throwServer(401, 'Authentication required', { data: { foo: 'bar' } })
 */
export function throwServer(statusCode: number, statusMessage?: string, extra?: Record<string, any>) {
  // Import createError lazily so this module is safe to import from both server and tests
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { createError } = require('h3')

  const payload: Record<string, any> = {
    statusCode: Number(statusCode) || 500
  }
  if (statusMessage) payload.statusMessage = String(statusMessage)
  if (extra && typeof extra === 'object') Object.assign(payload, extra)

  throw createError(payload)
}

export default throwServer
