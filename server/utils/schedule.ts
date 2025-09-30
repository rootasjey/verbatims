/**
 * Background task scheduler utility.
 *
 * Prefers Nitro/H3's event.waitUntil (Cloudflare Workers/Pages adapter),
 * falls back to Cloudflare ctx.waitUntil if present, otherwise fire-and-forget.
 */

export type BackgroundTask = Promise<any> | (() => Promise<any>)

export function scheduleBackground(event: any, task: BackgroundTask): void {
  try {
    const run = typeof task === 'function' ? (task as () => Promise<any>) : () => task as Promise<any>

    // 1) Preferred: Nitro/H3 injects waitUntil on the event in Workers/Pages
    const w = (event as any)?.waitUntil
    if (typeof w === 'function') {
      w(run())
      return
    }

    // 2) Fallback: Some environments expose Cloudflare context on event.context.cloudflare.ctx
    const cf = (event as any)?.context?.cloudflare?.ctx
    if (cf && typeof cf.waitUntil === 'function') {
      cf.waitUntil(run())
      return
    }

    // 3) Node/dev: fire-and-forget
    // eslint-disable-next-line @typescript-eslint/no-floating-promises
    run()
  } catch {
    // Last-resort: attempt to run anyway
    try { /* eslint-disable @typescript-eslint/no-floating-promises */
      if (typeof task === 'function') (task as () => Promise<any>)()
      else (task as Promise<any>)
      /* eslint-enable */
    } catch {}
  }
}
