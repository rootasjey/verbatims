export type DownloadImageSettings = {
  theme: 'light' | 'dark'
  background: 'solid' | 'transparent'
  size: number
}

const STORAGE_KEY = 'verbatims.downloadImageSettings'

function isClient() {
  return typeof window !== 'undefined' && typeof localStorage !== 'undefined'
}

export function loadDownloadImageSettings(): DownloadImageSettings | null {
  if (!isClient()) return null
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (!data) return null
    // Basic shape validation
    if ((data.theme === 'light' || data.theme === 'dark') &&
        (data.background === 'solid' || data.background === 'transparent') &&
        typeof data.size === 'number') {
      return data as DownloadImageSettings
    }
    return null
  } catch {
    return null
  }
}

export function saveDownloadImageSettings(settings: DownloadImageSettings) {
  if (!isClient()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // ignore quota or serialization errors
  }
}
