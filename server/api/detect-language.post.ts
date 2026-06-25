import { createError, readBody } from 'h3'

const SUPPORTED_ISO3_CODES = ['eng', 'fra', 'lat', 'spa', 'deu', 'ita', 'por', 'rus', 'jpn', 'cmn', 'zho']
const MIN_LENGTH = 12

export default defineEventHandler(async (event) => {
  const body = await readBody<{ text?: string }>(event)

  if (!body?.text || body.text.trim().length === 0) {
    throwServer(400, 'Missing text')
  }

  const runtimeConfig = useRuntimeConfig()

  if (!runtimeConfig.francisApiKey) {
    throwServer(500, 'Language detection not configured')
  }

  const response = await $fetch(`${runtimeConfig.francisApiUrl}/api/v1/detect`, {
    method: 'POST',
    headers: { 'x-api-key': runtimeConfig.francisApiKey },
    body: {
      text: body.text,
      minLength: MIN_LENGTH,
      only: SUPPORTED_ISO3_CODES,
    },
  })

  return response
})
