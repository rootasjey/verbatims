import { getRequestURL } from 'h3'
import { getMetaOAuthAppConfig, resolveMetaOAuthConfig } from '../../../../utils/social-meta-config'

export default defineEventHandler(async (event) => {
  const { user } = await requireModerator(event)

  const requestUrl = getRequestURL(event)
  const origin = `${requestUrl.protocol}//${requestUrl.host}`.replace(/\/$/, '')

  const stored = await getMetaOAuthAppConfig()
  const resolved = await resolveMetaOAuthConfig({ origin })

  return {
    success: true,
    data: {
      updatedAt: stored?.updatedAt || null,
      appId: resolved.appId,
      redirectUri: resolved.redirectUri,
      hasAppSecret: Boolean(resolved.appSecret),
      sources: {
        appId: resolved.appIdSource,
        appSecret: resolved.appSecretSource,
        redirectUri: resolved.redirectUriSource
      }
    }
  }
})
