export default defineEventHandler(async (event) => {
  const { user } = await requireAuth(event)
  const body = await readBody(event)

  const message = String(body?.message || '').trim()
  if (!message) {
    throwServer(400, 'Message is required')
  }

  const config = useRuntimeConfig()
  const siteUrl = config.public.siteUrl
  const productId = config.creemProductId

  if (!productId) {
    throwServer(500, 'Creem product not configured')
  }

  const isTest = config.creemTestMode !== 'false'
  const apiBase = isTest ? 'https://test-api.creem.io' : 'https://api.creem.io'

  try {
    const response = await fetch(`${apiBase}/v1/checkouts`, {
      method: 'POST',
      headers: {
        'x-api-key': config.creemApiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        product_id: productId,
        success_url: `${siteUrl}/sponsor/success`,
        customer: {
          email: user.email || undefined,
        },
        metadata: {
          sponsor_message: JSON.stringify({
            message,
            url: body.url || null,
            leading_icon: body.leading_icon || null,
            trailing_icon: body.trailing_icon || null,
            user_id: user.id,
          }),
        },
      }),
    })

    if (!response.ok) {
      const errText = await response.text()
      console.error('Creem API error:', response.status, errText)
      throwServer(502, 'Payment provider request failed')
    }

    const json: any = await response.json()
    const checkoutUrl = json?.checkout_url

    if (!checkoutUrl) {
      throwServer(502, 'Invalid response from payment provider')
    }

    return { url: checkoutUrl }
  } catch (error: any) {
    if ((error as any).statusCode) throw error
    console.error('Failed to create Creem checkout:', error)
    throwServer(500, 'Failed to create checkout session')
  }
})
