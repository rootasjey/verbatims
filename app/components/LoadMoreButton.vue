<template>
  <div class="w-full text-center">
    <button
      ref="buttonEl"
      :disabled="isLoading"
      @click="emit('load')"
      class="group font-sans text-xs uppercase tracking-[0.2em] text-gray-400 dark:text-gray-600 hover:text-gray-700 dark:hover:text-gray-300 transition-colors duration-300 disabled:opacity-40 disabled:cursor-not-allowed"
    >
      <span class="inline-flex items-center gap-1.5">
        <span>{{ isLoading ? loadingText : idleText }}</span>
        <span v-if="!isLoading" class="inline-block transition-transform duration-300 group-hover:translate-x-0.5">
          <NIcon name="i-ph-arrow-right" class="w-3 h-3" />
        </span>
        <NIcon v-else name="i-ph-dots-three" class="w-3 h-3 animate-pulse" />
      </span>
    </button>

    <p v-if="hintText" class="mt-3 text-center text-xs leading-5 text-gray-400 dark:text-gray-600">
      {{ hintText }}
    </p>
  </div>
</template>

<script setup lang="ts">
interface Props {
  isLoading?: boolean
  idleText?: string
  loadingText?: string
  hintText?: string
}

const props = withDefaults(defineProps<Props>(), {
  isLoading: false,
  idleText: 'load more',
  loadingText: 'loading...',
  hintText: 'Keyboard: press Space or M while this button is visible.'
})

const emit = defineEmits<{
  load: []
}>()

const buttonEl = ref<HTMLButtonElement | null>(null)
const isInView = ref(false)
let observer: IntersectionObserver | null = null

const isBlockedTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) return false

  return Boolean(target.closest('input, textarea, select, button, a[href], [contenteditable="true"], [contenteditable=""], [contenteditable="plaintext-only"]'))
}

const handleKeydown = (event: KeyboardEvent) => {
  if (!isInView.value || props.isLoading) return
  if (event.metaKey || event.ctrlKey || event.altKey) return

  const key = event.key.toLowerCase()
  const target = event.target
  const targetIsOwnButton = target instanceof Node && Boolean(buttonEl.value?.contains(target))

  if (targetIsOwnButton && key === ' ') {
    return
  }

  if (isBlockedTarget(target) && !targetIsOwnButton) return

  if (key !== ' ' && key !== 'm') return

  event.preventDefault()
  emit('load')
}

onMounted(() => {
  if (typeof window !== 'undefined') {
    window.addEventListener('keydown', handleKeydown)
  }

  if (!buttonEl.value || typeof IntersectionObserver === 'undefined') return

  observer = new IntersectionObserver(
    ([entry]) => {
      isInView.value = Boolean(entry?.isIntersecting)
    },
    { threshold: 0 }
  )

  observer.observe(buttonEl.value)
})

onBeforeUnmount(() => {
  if (typeof window !== 'undefined') {
    window.removeEventListener('keydown', handleKeydown)
  }

  observer?.disconnect()
  observer = null
})
</script>
