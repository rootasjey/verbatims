import { computed, nextTick, onScopeDispose, ref, type Ref } from 'vue'

export function useQuoteStepTransition(step: Ref<number>) {
  const stepViewportRef = ref<HTMLElement | null>(null)
  const stepViewportHeight = ref('auto')
  const direction = ref<'forward' | 'backward'>('forward')
  const transitionName = computed(() => `quote-step-${direction.value}`)
  let finishTimer: ReturnType<typeof setTimeout> | undefined

  const changeStep = async (target: number) => {
    if (step.value === target) return

    if (finishTimer) clearTimeout(finishTimer)
    finishTimer = undefined

    const viewport = stepViewportRef.value
    if (!viewport) {
      step.value = target
      return
    }

    stepViewportHeight.value = `${viewport.getBoundingClientRect().height}px`
    direction.value = target > step.value ? 'forward' : 'backward'
    step.value = target

    await nextTick()
    await new Promise<void>(resolve => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))

    const activeStep = stepViewportRef.value?.querySelector<HTMLElement>(`[data-quote-step="${target}"]`)
    if (activeStep) {
      stepViewportHeight.value = `${activeStep.getBoundingClientRect().height}px`
      finishTimer = setTimeout(finishStepTransition, 450)
    }
  }

  const finishStepTransition = () => {
    if (finishTimer) clearTimeout(finishTimer)
    finishTimer = undefined
    stepViewportHeight.value = 'auto'
  }

  onScopeDispose(() => {
    if (finishTimer) clearTimeout(finishTimer)
  })

  return {
    stepViewportRef,
    stepViewportHeight,
    transitionName,
    changeStep,
    finishStepTransition
  }
}
