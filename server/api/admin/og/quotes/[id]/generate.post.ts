/**
 * POST /api/admin/og/quotes/[id]/generate
 * Generate and cache the OG image for a quote by ID
 * Admin access required
 */
export default defineEventHandler(async (event) => {
  const session = await getUserSession(event)
  if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'moderator')) {
    throwServer(403, 'Admin access required'); return
  }

  let id = getRouterParam(event, 'id')
  if (!id) { throwServer(400, 'Quote id is required'); return }
  if (id.endsWith('.png')) id = id.slice(0, -4)

  // Call the OG endpoint to render and cache
  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`
  const res = await $fetch.raw(`${origin}/api/og/quotes/${id}.png`)
  if (!res.ok) { throwServer(500, 'Failed to generate OG image'); return }
  return { ok: true, id }
})
