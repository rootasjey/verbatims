import { kv } from 'hub:kv'

export default defineEventHandler(async (event) => {
  const quoteId = getRouterParam(event, 'id')
  if (!quoteId) {
    throw createError({
      statusCode: 400,
      message: 'Quote ID is required'
    })
  }

  // Delete all cache entries for this quote
  const keyData = `og:quote:${quoteId}:latest`
  const latest = await kv.get<string>(keyData)
  
  const deletedKeys: string[] = []
  
  if (latest) {
    const keyImage = `og:quote:${quoteId}:${latest}.png`
    await kv.del(keyImage)
    deletedKeys.push(keyImage)
  }
  
  await kv.del(keyData)
  deletedKeys.push(keyData)

  return {
    success: true,
    message: `Cleared OG cache for quote ${quoteId}`,
    deletedKeys
  }
})
