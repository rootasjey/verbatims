import { createError } from 'h3'

export function throwServer(statusCode: number, statusMessage?: string, extra?: Record<string, unknown>): never {
  const payload: Record<string, unknown> = {
    statusCode: Number(statusCode) || 500
  }
  if (statusMessage) payload.statusMessage = String(statusMessage)
  if (extra) payload.data = extra

  throw createError(payload)
}

export default throwServer
