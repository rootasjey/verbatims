import { AuthorSocialLink } from "~/types"

export const parseAuthorSocials = (rawSocials: string | null | undefined): AuthorSocialLink[] => {
  if (!rawSocials) return []

  try {
    const parsed = JSON.parse(rawSocials)

    if (Array.isArray(parsed)) {
      return parsed
        .map((entry) => {
          if (!entry || typeof entry !== 'object') return null
          const candidate = entry as Record<string, unknown>
          const platform = typeof candidate.platform === 'string'
            ? candidate.platform
            : typeof candidate.label === 'string'
              ? candidate.label
              : undefined
          const url = typeof candidate.url === 'string'
            ? candidate.url
            : typeof candidate.href === 'string'
              ? candidate.href
              : undefined

          if (!platform || !url) return null

          const social: AuthorSocialLink = { platform, url }

          if (typeof candidate.handle === 'string' && candidate.handle) {
            social.handle = candidate.handle
          }

          if (typeof candidate.icon === 'string' && candidate.icon) {
            social.icon = candidate.icon
          }

          return social
        })
        .filter((value): value is AuthorSocialLink => Boolean(value))
    }

    if (parsed && typeof parsed === 'object') {
      return Object.entries(parsed as Record<string, unknown>)
        .filter(([, value]) => typeof value === 'string' && !!value)
        .map(([platform, url]) => ({ platform, url: url as string }))
    }
  } catch (error) {
    console.error('Failed to parse author socials:', error)
  }

  return []
}