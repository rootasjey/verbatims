export const shouldHandleSuggestionPanelKeydown = (event: Pick<KeyboardEvent, 'key' | 'target'>) => {
  if (event.key !== 'Enter' && event.key !== ' ') return true

  const target = event.target as (EventTarget & { closest?: (selector: string) => unknown }) | null
  return !target?.closest?.('button')
}

export const handleQuoteFormKeydown = (
  event: Pick<KeyboardEvent, 'key' | 'target' | 'isComposing' | 'defaultPrevented' | 'ctrlKey' | 'metaKey' | 'preventDefault'>,
  options: { step: number, submitting: boolean, advance: () => void, submit: () => void },
) => {
  if (event.defaultPrevented || event.isComposing || !shouldHandleSuggestionPanelKeydown(event)) return

  if (options.step === 1 && (event.ctrlKey || event.metaKey) && event.key === 'Enter') {
    event.preventDefault()
    options.advance()
    return
  }

  if (options.step > 1 && event.key === 'Enter' && !options.submitting) {
    event.preventDefault()
    options.submit()
  }
}
