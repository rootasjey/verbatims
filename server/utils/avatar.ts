const TRONCHE_AVATAR_URL = /^https:\/\/tronche\.cc\/api\/avatar\/[^/?#]+(?:\?[^#]*)?$/

export function isTroncheAvatarUrl(value: string | null | undefined): value is string {
  return typeof value === 'string' && value.length <= 2048 && TRONCHE_AVATAR_URL.test(value)
}
