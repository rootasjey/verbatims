export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody(event)

  const message = String(body?.message || '').trim()
  if (!message) {
    throwServer(400, 'Message is required')
  }

  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl
  const storeId = config.lemonsqueezyStoreId
  const variantId = config.lemonsqueezyVariantId

  if (!storeId || !variantId) {
    throwServer(500, 'Lemon Squeezy not configured')
  }

  try {
    const response = await fetch('https://api.lemonsqueezy.com/v1/checkouts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${config.lemonsqueezyApiKey}`,
        'Content-Type': 'application/vnd.api+json',
        'Accept': 'application/vnd.api+json',
      },
      body: JSON.stringify({
        data: {
          type: 'checkouts',
          attributes: {
            product_options: {
              redirect_url: `${siteUrl}/sponsor/success`,
            },
            checkout_data: {
              email: user.email || '',
              name: user.name || '',
              custom: {
                sponsor_message: JSON.stringify({
                  message,
                  url: body.url || null,
                  leading_icon: body.leading_icon || null,
                  trailing_icon: body.trailing_icon || null,
                  user_id: user.id,
                }),
              },
            },
          },
          relationships: {
            store: {
              data: { type: 'stores', id: String(storeId) },
            },
            variant: {
              data: { type: 'variants', id: String(variantId) },
            },
          },
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Lemon Squeezy API error:', response.status, errText)
      throwServer(502, 'Payment provider request failed')
    }

    const json: any = await response.json()
    const checkoutUrl = json?.data?.attributes?.url

    if (!checkoutUrl) {
      throwServer(502, 'Invalid response from payment provider')
    }

    return { url: checkoutUrl }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Failed to create Lemon Squeezy checkout:', error)
    throwServer(500, 'Failed to create checkout session')
  }
})
