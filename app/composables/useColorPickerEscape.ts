export function useColorPickerEscape() {
  function pickerIsExpanded() {
    return document.querySelector('[aria-expanded="true"]') !== null
  }

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape' && pickerIsExpanded()) {
      e.preventDefault()
      document.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true, cancelable: true }))
    }
  }

  onMounted(() => document.addEventListener('keydown', onKeydown))
  onUnmounted(() => document.removeEventListener('keydown', onKeydown))
}
