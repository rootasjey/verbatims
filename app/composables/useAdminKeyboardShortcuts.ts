interface AdminKeyboardShortcutsOptions {
  selectAllOnPage: () => void
  clearSelection: () => void
  hasSelection: () => boolean
  isDialogOpen: () => boolean
  isDropdownOpen: () => boolean

  onEdit?: () => void
  onSubmit?: () => void
  onDelete?: () => void
  onConfirmDialog?: () => void

  customKeys?: Record<string, () => void>

  highlightedRowIndex?: () => number | null
  onSingleEdit?: () => void
  onSingleView?: () => void
  onSingleSubmit?: () => void
  onSingleDelete?: () => void
}

export function useAdminKeyboardShortcuts(options: AdminKeyboardShortcutsOptions) {
  const handler = (e: KeyboardEvent) => {
    const isMac = navigator.platform.toLowerCase().includes('mac')
    const metaPressed = isMac ? e.metaKey : e.ctrlKey

    if (options.isDialogOpen()) {
      if (options.onConfirmDialog && metaPressed && e.key === 'Enter') {
        e.preventDefault()
        options.onConfirmDialog()
      }
      return
    }

    if (options.isDropdownOpen()) return

    if (metaPressed && (e.key === 'a' || e.key === 'A')) {
      e.preventDefault()
      options.selectAllOnPage()
      return
    }

    if (e.key === 'Escape' && options.hasSelection()) {
      const target = e.target as HTMLElement | null
      if (target) {
        const tag = target.tagName?.toLowerCase()
        if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
          return
        }
      }
      e.preventDefault()
      options.clearSelection()
      return
    }

    if (e.metaKey || e.altKey || e.ctrlKey) return

    const target = e.target as HTMLElement | null
    if (target) {
      const tag = target.tagName?.toLowerCase()
      if (tag === 'input' || tag === 'textarea' || tag === 'select' || target.isContentEditable) {
        return
      }
    }

    if (!options.hasSelection()) {
      const highlightedIdx = options.highlightedRowIndex?.()
      if (highlightedIdx !== null && highlightedIdx !== undefined) {
        const key = e.key.toLowerCase()
        switch (key) {
          case 'e':
            if (options.onSingleEdit) {
              e.preventDefault()
              options.onSingleEdit()
            }
            break
          case 'd':
            if (options.onSingleDelete) {
              e.preventDefault()
              options.onSingleDelete()
            }
            break
          case 'v':
            if (options.onSingleView) {
              e.preventDefault()
              options.onSingleView()
            }
            break
          case 's':
            if (options.onSingleSubmit) {
              e.preventDefault()
              options.onSingleSubmit()
            }
            break
        }
      }
      return
    }

    const key = e.key.toLowerCase()

    if (options.customKeys && key in options.customKeys) {
      e.preventDefault()
      options.customKeys[key]()
      return
    }

    switch (key) {
      case 'e':
        if (options.onEdit) {
          e.preventDefault()
          options.onEdit()
        }
        break
      case 's':
        if (options.onSubmit) {
          e.preventDefault()
          options.onSubmit()
        }
        break
      case 'd':
        if (options.onDelete) {
          e.preventDefault()
          options.onDelete()
        }
        break
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handler, { capture: true })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('keydown', handler, { capture: true })
  })
}
