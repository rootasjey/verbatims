export const SOCIAL_PLATFORMS = ['x', 'bluesky', 'instagram', 'threads', 'facebook', 'pinterest'] as const

export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number]

export const SOCIAL_QUEUE_STATUSES = ['queued', 'processing', 'posted', 'failed'] as const
export type SocialQueueStatus = (typeof SOCIAL_QUEUE_STATUSES)[number]

export const SOCIAL_POST_STATUSES = ['success', 'failed'] as const
export type SocialPostStatus = (typeof SOCIAL_POST_STATUSES)[number]

export const SOCIAL_PLATFORM_LABELS: Record<SocialPlatform, string> = {
  x: 'X',
  bluesky: 'Bluesky',
  instagram: 'Instagram',
  threads: 'Threads',
  facebook: 'Facebook',
  pinterest: 'Pinterest'
}

export const UNIMPLEMENTED_SOCIAL_PLATFORMS = [] as const

export const SOCIAL_PLATFORM_ERROR_MESSAGE = 'platform must be x, bluesky, instagram, threads, facebook, or pinterest'

export function isSocialPlatform(value: string): value is SocialPlatform {
  return (SOCIAL_PLATFORMS as readonly string[]).includes(value)
}

export function isUnimplementedSocialPlatform(platform: SocialPlatform): boolean {
  return (UNIMPLEMENTED_SOCIAL_PLATFORMS as readonly string[]).includes(platform)
}

export function isSocialQueueStatus(value: string): value is SocialQueueStatus {
  return (SOCIAL_QUEUE_STATUSES as readonly string[]).includes(value)
}