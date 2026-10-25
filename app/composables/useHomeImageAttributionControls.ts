import type { HomeImageAttributionMode } from './useHomeImageAttributionPreference'

interface ImageCreditMenuItem {
  label?: string
  leading?: string
  trailing?: string
  items?: ImageCreditMenuItem[]
  onclick?: () => void
}

export const useHomeImageAttributionControls = () => {
  const { $t } = useI18n()
  const preference = useHomeImageAttributionPreference()
  const expanded = ref(true)
  const menuOpen = ref(false)
  const menuPosition = ref<{ left: string; top: string } | null>(null)
  let autoCollapseTimeout: ReturnType<typeof setTimeout> | undefined

  const stopAutoCollapse = () => {
    if (autoCollapseTimeout) clearTimeout(autoCollapseTimeout)
    autoCollapseTimeout = undefined
  }

  const applyMode = () => {
    stopAutoCollapse()
    expanded.value = preference.mode.value !== 'collapsed'
    if (preference.mode.value === 'auto') {
      autoCollapseTimeout = setTimeout(() => {
        expanded.value = false
      }, 6000)
    }
  }

  const toggle = () => {
    stopAutoCollapse()
    expanded.value = !expanded.value
  }

  const setMode = async (mode: HomeImageAttributionMode) => {
    stopAutoCollapse()
    try {
      await preference.save(mode)
      applyMode()
    } catch (error) {
      console.error('Failed to save image attribution preference:', error)
    }
  }

  const menuItems = computed<ImageCreditMenuItem[]>(() => [
    {
      label: String($t(expanded.value ? 'home.collapse_image_credit' : 'home.expand_image_credit')),
      leading: expanded.value ? 'i-ph-caret-up' : 'i-ph-caret-down',
      onclick: toggle
    },
    {
      label: String($t('home.image_credit_on_load')),
      leading: 'i-ph-clock',
      items: (['auto', 'expanded', 'collapsed'] as const).map(mode => ({
        label: String($t(`home.image_credit_mode_${mode}`)),
        trailing: preference.mode.value === mode ? 'i-ph-check' : undefined,
        onclick: () => setMode(mode)
      }))
    }
  ])

  const openMenu = (event: MouseEvent) => {
    const cover = (event.currentTarget as HTMLElement).closest('.homepage-v3-cover')
    const coverBounds = cover?.getBoundingClientRect()
    const left = coverBounds ? event.clientX - coverBounds.left : event.clientX
    const top = coverBounds ? event.clientY - coverBounds.top : event.clientY

    menuPosition.value = {
      left: `${Math.max(8, left)}px`,
      top: `${Math.max(8, top)}px`
    }
    menuOpen.value = true
  }

  onMounted(async () => {
    await preference.load()
    applyMode()
  })
  onBeforeUnmount(stopAutoCollapse)

  return {
    expanded,
    menuItems,
    menuOpen,
    menuPosition,
    openMenu,
    toggle
  }
}
