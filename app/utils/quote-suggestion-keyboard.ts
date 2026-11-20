export const shouldHandleSuggestionPanelKeydown = (event: Pick<KeyboardEvent, 'key' | 'target'>) => {
  if (event.key !== 'Enter' && event.key !== ' ') return true

  const target = event.target as (EventTarget & { closest?: (selector: string) => unknown }) | null
  return !target?.closest?.('button')
}
