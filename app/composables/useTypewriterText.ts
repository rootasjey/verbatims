import { onBeforeUnmount, onMounted, ref, watch, type ComputedRef } from 'vue'

const MIN_DURATION = 180
const MAX_DURATION = 320
const MS_PER_CHARACTER = 8

export const useTypewriterText = (source: ComputedRef<string>, enabled: ComputedRef<boolean>) => {
  const displayedText = ref(source.value)

  let animationFrame = 0
  let hasMounted = false
  let hasAnimated = false
  let reducedMotionQuery: MediaQueryList | undefined

  const cancelAnimation = () => {
    if (!animationFrame) return

    cancelAnimationFrame(animationFrame)
    animationFrame = 0
  }

  const revealText = (targetText: string, currentText: string) => {
    cancelAnimation()

    if (!enabled.value || reducedMotionQuery?.matches) {
      displayedText.value = targetText
      return
    }

    const targetCharacters = Array.from(targetText)
    const currentCharacters = Array.from(currentText)
    let sharedPrefixLength = 0

    while (
      sharedPrefixLength < currentCharacters.length &&
      sharedPrefixLength < targetCharacters.length &&
      currentCharacters[sharedPrefixLength] === targetCharacters[sharedPrefixLength]
    ) {
      sharedPrefixLength++
    }

    const sharedPrefix = targetCharacters.slice(0, sharedPrefixLength)
    const remainingCharacters = targetCharacters.slice(sharedPrefixLength)
    displayedText.value = sharedPrefix.join('')

    if (remainingCharacters.length === 0) return

    const duration = Math.min(
      MAX_DURATION,
      Math.max(MIN_DURATION, remainingCharacters.length * MS_PER_CHARACTER)
    )
    let startedAt: number | undefined

    const animateFrame = (timestamp: number) => {
      if (startedAt === undefined) startedAt = timestamp
      const progress = Math.min((timestamp - startedAt) / duration, 1)
      const visibleSuffixLength = Math.ceil(remainingCharacters.length * progress)

      displayedText.value = [...sharedPrefix, ...remainingCharacters.slice(0, visibleSuffixLength)].join('')

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animateFrame)
      } else {
        animationFrame = 0
      }
    }

    animationFrame = requestAnimationFrame(animateFrame)
  }

  const updateText = () => {
    if (!hasMounted) return

    if (!enabled.value) {
      cancelAnimation()
      displayedText.value = source.value
      return
    }

    if (!hasAnimated) {
      hasAnimated = true
      revealText(source.value, '')
      return
    }

    revealText(source.value, displayedText.value)
  }

  const handleReducedMotionChange = () => {
    if (!reducedMotionQuery?.matches) return

    cancelAnimation()
    displayedText.value = source.value
  }

  onMounted(() => {
    hasMounted = true
    reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)')
    reducedMotionQuery.addEventListener('change', handleReducedMotionChange)

    if (enabled.value) {
      hasAnimated = true
      revealText(source.value, '')
    } else {
      displayedText.value = source.value
    }
  })

  onBeforeUnmount(() => {
    hasMounted = false
    cancelAnimation()
    reducedMotionQuery?.removeEventListener('change', handleReducedMotionChange)
  })

  watch([source, enabled], updateText)

  return { displayedText }
}
