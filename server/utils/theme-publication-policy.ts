export function isThemePublished(publicationStatus: string | null | undefined): boolean {
  return publicationStatus === 'published'
}

export function getThemeCacheControl(isDraftPreview: boolean): string {
  return isDraftPreview ? 'private, no-store' : 'no-store'
}
