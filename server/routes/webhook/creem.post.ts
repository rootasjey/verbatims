import { db, schema } from 'hub:db'
import { createHmac, timingSafeEqual } from 'node:crypto'

export default defineEventHandler(async (event) => {
  const config = useRuntimeConfig()
  const secret = config.creemWebhookSecret

  if (!secret) {
    throwServer(500, 'Creem webhook secret not configured')
  }

  const signature = getHeader(event, 'creem-signature')
  if (!signature) {
    throwServer(400, 'Missing creem-signature header')
  }

  const rawBody = await readRawBody(event)
  if (!rawBody) {
    throwServer(400, 'Missing request body')
  }

  const hmac = createHmac('sha256', secret)
  const expected = hmac.update(rawBody).digest('hex')

  const sigBytes = new Uint8Array(Buffer.from(signature, 'hex'))
  const expBytes = new Uint8Array(Buffer.from(expected, 'hex'))

  if (sigBytes.byteLength !== 32 || !timingSafeEqual(sigBytes, expBytes)) {
    throwServer(401, 'Invalid webhook signature')
  }

  let payload: any
  try {
    payload = JSON.parse(rawBody)
  } catch {
    throwServer(400, 'Invalid JSON body')
  }

  if (payload.eventType !== 'checkout.completed') {
    return { received: true }
  }

  const checkout = payload.object
  if (!checkout?.metadata) {
    return { received: true }
  }

  const raw = checkout.metadata.sponsor_message
  if (!raw || typeof raw !== 'string') {
    console.warn('Webhook checkout.completed missing sponsor_message metadata', { checkoutId: checkout.id })
    return { received: true }
  }

  let sponsorData: Record<string, any> = {}
  try {
    sponsorData = JSON.parse(raw)
  } catch {
    console.warn('Webhook checkout.completed invalid sponsor_message JSON', { raw })
    return { received: true }
  }

  const message = String(sponsorData.message || '').trim()
  if (!message) {
    console.warn('Webhook checkout.completed empty sponsor message', { checkoutId: checkout.id })
    return { received: true }
  }

  const userId = sponsorData.user_id ? Number(sponsorData.user_id) : null

  try {
    await db.insert(schema.sponsorMessages).values({
      message,
      leadingIcon: sponsorData.leading_icon || null,
      trailingIcon: sponsorData.trailing_icon || null,
      url: sponsorData.url || null,
      type: 'sponsored',
      isActive: false,
      priority: 0,
      userId,
      paid: true,
      paymentRef: checkout.id,
    })
    console.log('Sponsor message created from Creem checkout', { checkoutId: checkout.id, message })
  } catch (err) {
    console.error('Failed to insert sponsor message from webhook', err)
  }

  return { received: true }
})
