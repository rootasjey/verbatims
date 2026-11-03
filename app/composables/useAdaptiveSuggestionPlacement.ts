import { nextTick, onBeforeUnmount, ref, watch, type Ref } from 'vue'

type SuggestionPlacement = 'above' | 'below'

export function useAdaptiveSuggestionPlacement(
  inputContainer: Ref<HTMLElement | null>,
  suggestionListbox: Ref<HTMLElement | null>,
  isOpen: Readonly<Ref<boolean>>,
) {
  const placement = ref<SuggestionPlacement>('above')
  const maxHeight = ref(192)

  function updatePlacement(): void {
    const input = inputContainer.value?.querySelector('input')
    const listbox = suggestionListbox.value
    if (!input || !listbox || !import.meta.client) return

    let topBoundary = 0
    let bottomBoundary = window.innerHeight
    let ancestor = inputContainer.value?.parentElement ?? null

    while (ancestor && ancestor !== document.body) {
      if (getComputedStyle(ancestor).overflowY !== 'visible') {
        const rect = ancestor.getBoundingClientRect()
        const contentTop = rect.top + ancestor.clientTop
        topBoundary = Math.max(topBoundary, contentTop)
        bottomBoundary = Math.min(bottomBoundary, contentTop + ancestor.clientHeight)
      }
      ancestor = ancestor.parentElement
    }

    const inputRect = input.getBoundingClientRect()
    const spaceAbove = Math.max(0, inputRect.top - topBoundary)
    const spaceBelow = Math.max(0, bottomBoundary - inputRect.bottom)
    const desiredHeight = Math.min(listbox.scrollHeight, 192)
    const gap = 8
    const aboveFits = spaceAbove >= desiredHeight + gap
    const belowFits = spaceBelow >= desiredHeight + gap

    if (aboveFits && belowFits) {
      placement.value = spaceBelow >= spaceAbove ? 'below' : 'above'
    } else if (belowFits) {
      placement.value = 'below'
    } else if (aboveFits) {
      placement.value = 'above'
    } else {
      placement.value = spaceBelow >= spaceAbove ? 'below' : 'above'
    }

    const availableSpace = placement.value === 'below' ? spaceBelow : spaceAbove
    maxHeight.value = Math.max(48, Math.min(192, availableSpace - gap))
  }

  watch(isOpen, (open) => {
    if (!import.meta.client) return
    if (open) {
      window.addEventListener('resize', updatePlacement)
      document.addEventListener('scroll', updatePlacement, true)
      nextTick(updatePlacement)
    } else {
      window.removeEventListener('resize', updatePlacement)
      document.removeEventListener('scroll', updatePlacement, true)
    }
  }, { immediate: true })

  onBeforeUnmount(() => {
    if (!import.meta.client) return
    window.removeEventListener('resize', updatePlacement)
    document.removeEventListener('scroll', updatePlacement, true)
  })

  return { placement, maxHeight, updatePlacement }
}
