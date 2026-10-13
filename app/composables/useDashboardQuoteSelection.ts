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
    if (!selectionMode.value) return

    const target = event.target as Element | null
    if (target?.closest('[data-selection-ignore]')) return

    if (event.key === ' ' || event.key === 'Spacebar') {
      event.preventDefault()
      toggleQuote(index, id, event.shiftKey)
      return
    }

    if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
    event.preventDefault()

    const visibleRows = Array.from(document.querySelectorAll<HTMLElement>('[data-dashboard-selection-row]'))
      .filter(row => row.getClientRects().length > 0)
    const currentIndex = visibleRows.indexOf(event.currentTarget as HTMLElement)
    const nextIndex = Math.max(0, Math.min(visibleRows.length - 1, currentIndex + (event.key === 'ArrowDown' ? 1 : -1)))
    visibleRows[nextIndex]?.focus()
  }

  return {
    selectionMode,
    rowSelection,
    selectedQuotes,
    clearSelection,
    exitSelectionMode,
    toggleSelectionMode,
    toggleQuote,
    selectAllVisible,
    handleRowClickCapture,
    handleRowKeydown
  }
}
