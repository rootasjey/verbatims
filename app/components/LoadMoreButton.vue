<template>
  <div class="inline-flex flex-col items-center">
    <button
      ref="buttonEl"
      :disabled="isLoading"
      @click="emit('load')"
      class="group relative inline-block p-px font-semibold leading-6 text-white bg-gray-800 shadow-2xl cursor-pointer rounded-xl shadow-zinc-900 transition-transform duration-300 ease-in-out hover:scale-102 active:scale-99 disabled:cursor-not-allowed disabled:opacity-70"
    >
      <span
        class="absolute inset-0 rounded-xl bg-gradient-to-r from-teal-400 via-blue-500 to-purple-500 p-[2px] opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      ></span>
      <span class="relative z-10 block px-6 py-3 rounded-xl bg-gray-950">
        <div class="relative z-10 flex items-center space-x-2">
          <NIcon v-if="isLoading" name="i-ph-spinner" class="animate-spin" />
          <span class="transition-all duration-500 group-hover:translate-x-1">
            {{ isLoading ? loadingText : idleText }}
          </span>
          <svg
            class="w-6 h-6 transition-transform duration-500 group-hover:translate-x-1"
            data-slot="icon"
            aria-hidden="true"
            fill="currentColor"
            viewBox="0 0 20 20"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              clip-rule="evenodd"
              d="M8.22 5.22a.75.75 0 0 1 1.06 0l4.25 4.25a.75.75 0 0 1 0 1.06l-4.25 4.25a.75.75 0 0 1-1.06-1.06L11.94 10 8.22 6.28a.75.75 0 0 1 0-1.06Z"
              fill-rule="evenodd"
            ></path>
          </svg>
        </div>
      </span>
    </button>

    <p v-if="hintText" class="mt-2 max-w-xs text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
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