import { Polar } from '@polar-sh/sdk'

export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody(event)

  const message = String(body?.message || '').trim()
  if (!message) {
    throwServer(400, 'Message is required')
  }

  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl
  const productId = config.polarSponsorProductId

  if (!productId) {
    throwServer(500, 'Polar sponsor product not configured')
  }

  const polar = new Polar({
    accessToken: config.polarAccessToken,
    server: (config.polarServer as 'sandbox' | 'production') || 'sandbox',
  })

  try {
    const checkout = await polar.checkouts.create({
      products: [productId],
      customerEmail: user.email || undefined,
      customerName: user.name || undefined,
      externalCustomerId: String(user.id),
      metadata: {
        sponsor_message: JSON.stringify({
          message,
          url: body.url || null,
          leading_icon: body.leading_icon || null,
          trailing_icon: body.trailing_icon || null,
          user_id: user.id,
        }),
      },
      successUrl: `${siteUrl}/sponsor/success`,
    })

    return { url: checkout.url }
  } catch (error: any) {
    console.error('Failed to create Polar checkout:', error)
    throwServer(500, 'Failed to create checkout session')
  }
})
