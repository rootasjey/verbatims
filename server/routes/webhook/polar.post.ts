import { db, schema } from 'hub:db'

export default defineEventHandler((event) => {
  const config = useRuntimeConfig()

  if (!config.polarWebhookSecret) {
    throwServer(500, 'Polar webhook secret not configured')
  }

  const webhooksHandler = Webhooks({
    webhookSecret: config.polarWebhookSecret,
    onOrderPaid: async (payload) => {
      const order = payload.data
      const metadata = order.metadata || {}

      const raw = metadata.sponsor_message
      if (!raw || typeof raw !== 'string') {
        console.warn('Webhook order.paid missing sponsor_message metadata', { orderId: order.id })
        return
      }

      let sponsorData: Record<string, any> = {}
      try {
        sponsorData = JSON.parse(raw)
      } catch {
        console.warn('Webhook order.paid invalid sponsor_message JSON', { raw })
        return
      }

      const message = String(sponsorData.message || '').trim()
      if (!message) {
        console.warn('Webhook order.paid empty sponsor message', { orderId: order.id })
        return
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
          paymentRef: order.id,
        })
        console.log('Sponsor message created from Polar order', { orderId: order.id, message })
      } catch (err) {
        console.error('Failed to insert sponsor message from webhook', err)
      }
    },
  })

  return webhooksHandler(event)
})
