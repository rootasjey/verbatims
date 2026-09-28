const editableSelector = [
  'input:not([type="button"]):not([type="submit"]):not([type="reset"]):not([type="checkbox"]):not([type="radio"])',
  'textarea',
  'select',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="textbox"]',
  '[role="combobox"]'
].join(', ')

export function isPrintableSearchKey(event: KeyboardEvent) {
  return !event.defaultPrevented
    && !event.isComposing
    && !event.ctrlKey
    && !event.metaKey
    && !event.altKey
    && event.key !== 'Dead'
    && event.key !== 'Process'
    && event.key !== 'Unidentified'
    && Array.from(event.key).length === 1
}

export function hasEditableFocus() {
  const activeElement = document.activeElement
  return activeElement instanceof HTMLElement
    && (activeElement.isContentEditable || Boolean(activeElement.closest(editableSelector)))
}
