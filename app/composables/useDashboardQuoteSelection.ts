import type { ComputedRef } from 'vue'

interface SelectableQuote {
  id: number
}

export function useDashboardQuoteSelection<T extends SelectableQuote>(rows: ComputedRef<T[]>) {
  const selectionMode = ref(false)
  const rowSelection = ref<Record<number, boolean>>({})
  const lastSelectedIndex = ref<number | null>(null)

  const selectedQuotes = computed<number[]>(() => Object
    .entries(rowSelection.value)
    .filter(([, selected]) => selected)
    .map(([id]) => Number(id)))
  const allVisibleSelected = computed(() => rows.value.length > 0 && selectedQuotes.value.length >= rows.value.length)

  const clearSelection = () => {
    rowSelection.value = {}
    lastSelectedIndex.value = null
  }

  const exitSelectionMode = () => {
    selectionMode.value = false
    clearSelection()
  }

  const toggleSelectionMode = () => {
    if (selectionMode.value) exitSelectionMode()
    else selectionMode.value = true
  }

  const selectQuote = (index: number, id: number) => {
    selectionMode.value = true
    clearSelection()
    rowSelection.value[id] = true
    lastSelectedIndex.value = index
  }

  const toggleQuote = (index: number, id: number, extendRange = false) => {
    if (!selectionMode.value) return

    const selected = !rowSelection.value[id]
    if (extendRange && lastSelectedIndex.value !== null) {
      const start = Math.min(lastSelectedIndex.value, index)
      const end = Math.max(lastSelectedIndex.value, index)
      for (let cursor = start; cursor <= end; cursor += 1) {
        const quote = rows.value[cursor]
        if (quote) rowSelection.value[quote.id] = selected
      }
    } else {
      rowSelection.value[id] = selected
    }
    lastSelectedIndex.value = index
  }

  const selectAllVisible = () => {
    for (const quote of rows.value) rowSelection.value[quote.id] = true
    lastSelectedIndex.value = null
  }

  const toggleSelectAllVisible = () => {
    if (allVisibleSelected.value) clearSelection()
    else selectAllVisible()
  }

  const handleRowClickCapture = (event: MouseEvent, index: number, id: number) => {
    if (!selectionMode.value) return

    const target = event.target as Element | null
    if (!target || target.closest('[data-selection-ignore]')) return

    const isPrimaryQuoteLink = !!target.closest('[data-selection-primary]')
    const isInteractive = !!target.closest('a, button, input, select, [role="button"]')
    if (isInteractive && !isPrimaryQuoteLink) return

    event.preventDefault()
    event.stopPropagation()
    toggleQuote(index, id, event.shiftKey)
  }

  const handleRowKeydown = (event: KeyboardEvent, index: number, id: number) => {
    const target = event.target as Element | null
    if (target?.closest('[data-selection-ignore]')) return
    if (!selectionMode.value && target?.closest('a:not([data-selection-primary]), button, input, select, textarea, [contenteditable="true"]')) return

    if (selectionMode.value && (event.key === ' ' || event.key === 'Spacebar')) {
      event.preventDefault()
      toggleQuote(index, id, event.shiftKey)
      return
    }

    if (!selectionMode.value && event.key === 'Enter' && target === event.currentTarget) {
      const quoteLink = (event.currentTarget as HTMLElement).querySelector<HTMLAnchorElement>('[data-selection-primary]')
      if (quoteLink) {
        event.preventDefault()
        quoteLink.click()
      }
      return
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()

    const visibleRows = Array.from(document.querySelectorAll<HTMLElement>('[data-dashboard-quote-row]'))
      .filter(row => row.getClientRects().length > 0)
    const currentIndex = visibleRows.indexOf(event.currentTarget as HTMLElement)
    if (currentIndex < 0 || visibleRows.length === 0) return

    const direction = event.key === 'ArrowDown' ? 1 : -1
    const nextIndex = selectionMode.value
      ? (currentIndex + direction + visibleRows.length) % visibleRows.length
      : Math.min(visibleRows.length - 1, Math.max(0, currentIndex + direction))
    if (nextIndex === currentIndex) return
    const nextRow = visibleRows[nextIndex]
    if (!nextRow) return

    const bounds = nextRow.getBoundingClientRect()
    const paginationBar = document.querySelector<HTMLElement>('[data-dashboard-pagination-bar]')
    const visibleBottom = paginationBar?.getBoundingClientRect().top ?? window.innerHeight
    const stickyTop = Array.from(document.querySelectorAll<HTMLElement>('header, [class*="sticky"], [class*="fixed"]'))
      .filter(element => {
        const rect = element.getBoundingClientRect()
        const position = getComputedStyle(element).position
        return (position === 'sticky' || position === 'fixed')
          && rect.top <= 1
          && rect.bottom > 0
          && rect.width >= window.innerWidth * 0.6
          && rect.height < 160
      })
      .reduce((bottom, element) => Math.max(bottom, element.getBoundingClientRect().bottom), 0)
    const visibleTop = stickyTop + 16
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    const behavior: ScrollBehavior = reduceMotion ? 'instant' : 'smooth'

    if (bounds.top < visibleTop) {
      window.scrollBy({ top: bounds.top - visibleTop, behavior })
    } else if (bounds.bottom > visibleBottom) {
      window.scrollBy({ top: bounds.bottom - visibleBottom + 12, behavior })
    }
    nextRow.focus({ preventScroll: true })
  }

  return {
    selectionMode,
    rowSelection,
    selectedQuotes,
    allVisibleSelected,
    clearSelection,
    exitSelectionMode,
    toggleSelectionMode,
    selectQuote,
    toggleQuote,
    selectAllVisible,
    toggleSelectAllVisible,
    handleRowClickCapture,
    handleRowKeydown
  }
}
