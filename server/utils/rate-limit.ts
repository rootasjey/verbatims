import { kv } from 'hub:kv'

export interface RateLimitOptions {
  key: string
  max: number
  window: number
}

export interface RateLimitResult {
  success: boolean
  remaining: number
  reset: number
}

export async function checkRateLimit(opts: RateLimitOptions): Promise<RateLimitResult> {
  const now = Math.floor(Date.now() / 1000)
  const windowKey = `${opts.key}:${Math.floor(now / opts.window)}`

  const current = (await kv.get<number>(windowKey)) ?? 0

  if (current >= opts.max) {
    const reset = (Math.floor(now / opts.window) + 1) * opts.window
    return { success: false, remaining: 0, reset }
  }

  await kv.set(windowKey, current + 1, { ttl: opts.window * 2 })

  const reset = (Math.floor(now / opts.window) + 1) * opts.window
  return { success: true, remaining: opts.max - current - 1, reset }
}

export function setRateLimitHeaders(event: any, result: RateLimitResult) {
  setHeader(event, 'X-RateLimit-Remaining', String(result.remaining))
  setHeader(event, 'X-RateLimit-Reset', String(result.reset))
}

export async function requireRateLimit(event: any, key: string, max: number, windowSeconds: number, message?: string) {
  const result = await checkRateLimit({ key, max, window: windowSeconds })
  setRateLimitHeaders(event, result)
  if (!result.success) throwServer(429, message || 'Too many requests. Please try again later.')
}
