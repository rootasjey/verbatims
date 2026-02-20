import type { Ref } from 'vue'

type FocusableTarget = {
  focus?: () => void
  typeCharacter?: (key: string) => void
  $el?: Element | null
} | null

interface UseFocusOnTypingOptions {
  skipOnMobile?: boolean
  fallbackSelector?: string
}

const ALPHANUMERIC_KEY_REGEX = /^[a-zA-Z0-9]$/

const isEditableElement = (element: Element | null) => {
  if (!(element instanceof HTMLElement)) return false

  const tagName = element.tagName.toLowerCase()
  if (['input', 'textarea', 'select'].includes(tagName)) return true

  return element.isContentEditable
}

const resolveInputFromTarget = (target: FocusableTarget): HTMLInputElement | null => {
  if (!target) return null

  if (typeof target.focus === 'function') {
    target.focus()
    if (document.activeElement instanceof HTMLInputElement) {
      return document.activeElement
    }
  }

  const rootElement = (target.$el ?? target) as Element | null
  const input = rootElement?.querySelector?.('input')

  return input instanceof HTMLInputElement ? input : null
}

const focusTargetInput = (target: FocusableTarget, fallbackSelector?: string) => {
  const inputFromTarget = resolveInputFromTarget(target)

  if (inputFromTarget) {
    inputFromTarget.focus()
    return inputFromTarget
  }

  if (!fallbackSelector) return null

  const fallbackInput = document.querySelector(fallbackSelector)

  if (fallbackInput instanceof HTMLInputElement) {
    fallbackInput.focus()
    return fallbackInput
  }

  return null
}

const appendTypedCharacter = (input: HTMLInputElement, key: string) => {
  const selectionStart = input.selectionStart ?? input.value.length
  const selectionEnd = input.selectionEnd ?? input.value.length

  const nextValue = `${input.value.slice(0, selectionStart)}${key}${input.value.slice(selectionEnd)}`
  input.value = nextValue

  const nextCaret = selectionStart + key.length
  input.setSelectionRange(nextCaret, nextCaret)
  input.dispatchEvent(new Event('input', { bubbles: true }))
}

const shouldSkipKey = (event: KeyboardEvent) => {
  if (event.defaultPrevented || event.repeat) return true
  if (event.metaKey || event.ctrlKey || event.altKey) return true
  if (!ALPHANUMERIC_KEY_REGEX.test(event.key)) return true
  if (isEditableElement(document.activeElement)) return true

  return false
}

export const useFocusOnTyping = (
  targetRef: Ref<FocusableTarget>,
  options: UseFocusOnTypingOptions = {}
) => {
  const { skipOnMobile = true, fallbackSelector } = options
  const { isMobile } = useMobileDetection()

  const onKeydown = (event: KeyboardEvent) => {
    if (skipOnMobile && isMobile.value) return
    if (shouldSkipKey(event)) return

    if (targetRef.value && typeof targetRef.value.typeCharacter === 'function') {
      event.preventDefault()
      targetRef.value.typeCharacter(event.key)
      return
    }

    const targetInput = focusTargetInput(targetRef.value, fallbackSelector)
    if (!targetInput) return

    event.preventDefault()
    appendTypedCharacter(targetInput, event.key)
  }

  onMounted(() => {
    window.addEventListener('keydown', onKeydown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', onKeydown)
  })
}