export type HomeImageAttributionMode = 'auto' | 'expanded' | 'collapsed'

const STORAGE_KEY = 'verbatims-home-image-attribution-mode'
const DEFAULT_MODE: HomeImageAttributionMode = 'auto'

const isHomeImageAttributionMode = (value: unknown): value is HomeImageAttributionMode =>
  value === 'auto' || value === 'expanded' || value === 'collapsed'

export const useHomeImageAttributionPreference = () => {
  const mode = useState<HomeImageAttributionMode>('home-image-attribution-mode', () => DEFAULT_MODE)
  const loaded = useState<boolean>('home-image-attribution-mode-loaded', () => false)
  const { user } = useUserSession()

  const load = async () => {
    if (!import.meta.client || loaded.value) return

    const savedMode = window.localStorage.getItem(STORAGE_KEY)
    if (isHomeImageAttributionMode(savedMode)) mode.value = savedMode

    if (user.value) {
      try {
        const response = await $fetch<{ data?: { mode?: unknown } }>('/api/user/preferences/home-image-attribution')
        if (isHomeImageAttributionMode(response.data?.mode)) mode.value = response.data.mode
      } catch (error) {
        console.error('Failed to load image attribution preference:', error)
      }
    }

    loaded.value = true
  }

  const save = async (nextMode: HomeImageAttributionMode) => {
    mode.value = nextMode
    if (!import.meta.client) return

    window.localStorage.setItem(STORAGE_KEY, nextMode)
    if (!user.value) return

    await $fetch('/api/user/preferences/home-image-attribution', {
      method: 'PUT',
      body: { mode: nextMode }
    })
  }

  return { mode, load, save }
}
