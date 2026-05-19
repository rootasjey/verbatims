interface TableKeyboardNavOptions {
  visibleRowCount: () => number
  onSelectRow: (index: number) => void
  isDialogOpen: () => boolean
  isDropdownOpen: () => boolean
}

export function useTableKeyboardNav(options: TableKeyboardNavOptions) {
  const highlightedRowIndex = ref<number | null>(null)

  function clearHighlight() {
    highlightedRowIndex.value = null
  }

  function moveHighlightUp() {
    const count = options.visibleRowCount()
    if (count === 0) return
    if (highlightedRowIndex.value === null || highlightedRowIndex.value <= 0) {
      highlightedRowIndex.value = count - 1
    } else {
      highlightedRowIndex.value -= 1
    }
    scrollHighlightedIntoView()
  }

  function moveHighlightDown() {
    const count = options.visibleRowCount()
    if (count === 0) return
    if (highlightedRowIndex.value === null || highlightedRowIndex.value >= count - 1) {
      highlightedRowIndex.value = 0
    } else {
      highlightedRowIndex.value += 1
    }
    scrollHighlightedIntoView()
  }

  function scrollHighlightedIntoView() {
    nextTick(() => {
      const el = document.querySelector('[data-highlighted="true"]')
      el?.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
    })
  }

  function handler(e: KeyboardEvent) {
    if (options.isDialogOpen()) return
    if (options.isDropdownOpen()) return

    if (e.metaKey || e.altKey || e.ctrlKey) return

    const target = e.target as HTMLElement | null
    if (target) {
      const tag = target.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
        return
      }
    }

    const count = options.visibleRowCount()
    if (count === 0) return

    const key = e.key

    if (key === 'ArrowRight') {
      e.preventDefault()
      highlightedRowIndex.value = 0
      scrollHighlightedIntoView()
      return
    }

    if (key === 'ArrowLeft') {
      e.preventDefault()
      highlightedRowIndex.value = count - 1
      scrollHighlightedIntoView()
      return
    }

    if (highlightedRowIndex.value === null) return

    if (e.shiftKey && key === 'ArrowUp') {
      e.preventDefault()
      moveHighlightUp()
      options.onSelectRow(highlightedRowIndex.value)
      return
    }

    if (e.shiftKey && key === 'ArrowDown') {
      e.preventDefault()
      moveHighlightDown()
      options.onSelectRow(highlightedRowIndex.value)
      return
    }

    if (key === 'ArrowUp') {
      e.preventDefault()
      moveHighlightUp()
      return
    }

    if (key === 'ArrowDown') {
      e.preventDefault()
      moveHighlightDown()
      return
    }

    if (key === ' ') {
      e.preventDefault()
      options.onSelectRow(highlightedRowIndex.value)
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handler, { capture: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handler, { capture: true })
  })

  return {
    highlightedRowIndex,
    clearHighlight
  }
}
