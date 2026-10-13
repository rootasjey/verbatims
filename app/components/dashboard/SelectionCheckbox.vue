<template>
  <Transition :css="false" appear @enter="animateIn" @leave="animateOut">
    <span
      v-if="visible"
      data-selection-ignore
      class="dashboard-selection-checkbox inline-flex shrink-0"
      :data-delay-index="Math.min(delayIndex, 12)"
    >
      <NCheckbox
        checkbox="gray"
        :aria-label="label"
        :model-value="modelValue"
        class="mt-1"
        @click.stop="$emit('toggle', $event)"
      />
    </span>
  </Transition>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  visible: boolean
  label: string
  modelValue: boolean
  delayIndex?: number
}>(), {
  delayIndex: 0
})

defineEmits<{
  (event: 'toggle', value: MouseEvent): void
}>()

const checkboxAnimations = new WeakMap<HTMLElement, { animation: Animation, finish: () => void }>()

const animate = (element: Element, done: () => void, entering: boolean) => {
  const checkbox = element as HTMLElement
  const previous = checkboxAnimations.get(checkbox)
  if (previous) {
    checkboxAnimations.delete(checkbox)
    previous.animation.cancel()
    previous.finish()
  }

  if (typeof checkbox.animate !== 'function') {
    done()
    return
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  const animation = checkbox.animate(
    entering
      ? [
          { opacity: 0, transform: 'translateX(-5.6px) scale(0.94)' },
          { opacity: 1, transform: 'translateX(0) scale(1)' }
        ]
      : [
          { opacity: 1, transform: 'translateX(0) scale(1)' },
          { opacity: 0, transform: 'translateX(-4px) scale(0.96)' }
        ],
    {
      duration: reduceMotion ? 1 : entering ? 160 : 100,
      delay: entering ? Number(checkbox.dataset.delayIndex || 0) * 12 : 0,
      easing: entering ? 'cubic-bezier(0.16, 1, 0.3, 1)' : 'ease-in',
      fill: 'both'
    }
  )

  checkboxAnimations.set(checkbox, { animation, finish: done })
  animation.onfinish = () => {
    checkboxAnimations.delete(checkbox)
    animation.cancel()
    done()
  }
}

const animateIn = (element: Element, done: () => void) => animate(element, done, true)
const animateOut = (element: Element, done: () => void) => animate(element, done, false)
</script>
