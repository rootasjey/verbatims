<template>
  <div
    class="quote-grid-item group border relative p-6 cursor-pointer h-full flex flex-col
    dark:hover:b-lime hover:scale-101 active:scale-99 hover:shadow-lg transition-all duration-300 "
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    ref="containerRef"
  >
    <!-- Author and Reference Info (Top) -->
    <div 
      :class="[
        'border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 font-sans font-600 text-size-4 flex items-center justify-between mb-4 flex-shrink-0',
        isHovered ? 'opacity-100' : 'opacity-50'
      ]"
    >
      <!-- Author Name -->
      <span
        v-if="quote.author"
        class="text-gray-900 dark:text-gray-100 truncate transition-opacity duration-300"
        :class="{ 'group-hover:opacity-100': true, 'opacity-100': !isHovered, 'opacity-0': isHovered }"
      >
        {{ quote.author.name }}
      </span>
      <span
        v-else
        class="font-medium text-gray-500 dark:text-gray-400 truncate transition-opacity duration-300"
        :class="{ 'group-hover:opacity-100': true, 'opacity-100': !isHovered, 'opacity-0': isHovered }"
      >
        Unknown Author
      </span>
      
      <!-- Book Icon (if reference exists) -->
      <UIcon
        v-if="quote.reference"
        name="i-ph-book-open-text-bold"
        :class="[
          'opacity-0 group-hover:opacity-100',
          'text-gray-600 dark:text-gray-400 flex-shrink-0 transition-opacity duration-300',
          'hover:scale-125 hover:rotate-180 active:scale-99 ease-in-out transition-transform duration-300'
        ]"
        :title="`From: ${quote.reference.name}`"
      />
    </div>

    <!-- Quote Content (Main) -->
    <div class="flex-1 flex">
      <!-- Client-only typewriter with SSR fallback -->
      <ClientOnly>
        <blockquote
          class="font-serif text-gray-800 dark:text-gray-200 leading-relaxed transition-opacity duration-300"
          :class="{
            'text-sm': (quote.name || '').length > 200,
            'text-base': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
            'text-lg': (quote.name || '').length <= 100
          }"
        >
          <span>{{ displayedText }}</span>
          <span v-show="showCaret" class="caret align-[-0.1em]"></span>
        </blockquote>

        <template #fallback>
          <blockquote
            class="font-serif text-gray-800 dark:text-gray-200 leading-relaxed transition-opacity duration-300"
            :class="{
              'text-sm': (quote.name || '').length > 200,
              'text-base': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
              'text-lg': (quote.name || '').length <= 100
            }"
          >
            {{ quote.name }}
          </blockquote>
        </template>
      </ClientOnly>
    </div>

    <!-- Featured Badge (if featured) -->
    <UBadge
      v-if="quote.is_featured"
      color="yellow"
      variant="subtle"
      size="xs"
      class="absolute top-2 right-2"
    >
      Featured
    </UBadge>
  </div>
</template>

<script setup>
const props = defineProps({
  quote: {
    type: Object,
    required: true
  }
})

const isHovered = ref(false)

const navigateToQuote = () => {
  navigateTo(`/quote/${props.quote.id}`)
}


// Typewriter animation when the card appears
const containerRef = ref(null)
const displayedText = ref('')
const showCaret = ref(false)
let hasTyped = false
let observer = null
let intervalId = null

const startTyping = () => {
  if (hasTyped) return
  const text = (props.quote?.name || '').toString()
  if (!text) return

  hasTyped = true
  displayedText.value = ''
  showCaret.value = true

  const maxDuration = 1200 // ms cap
  const baseInterval = 18 // ms
  const steps = Math.max(1, Math.ceil(maxDuration / baseInterval))
  const stepChars = Math.max(1, Math.ceil(text.length / steps))
  let i = 0

  intervalId = setInterval(() => {
    displayedText.value = text.slice(0, i)
    i += stepChars
    if (i >= text.length) {
      displayedText.value = text
      clearInterval(intervalId)
      intervalId = null
      setTimeout(() => (showCaret.value = false), 400)
    }
  }, baseInterval)
}

onMounted(() => {
  observer = new IntersectionObserver((entries) => {
    for (const entry of entries) {
      if (entry.isIntersecting) {
        startTyping()
        if (observer && containerRef.value) observer.unobserve(containerRef.value)
      }
    }
  }, { threshold: 0.2 })

  if (containerRef.value && observer) observer.observe(containerRef.value)
})

onBeforeUnmount(() => {
  if (observer && containerRef.value) observer.unobserve(containerRef.value)
  if (observer) observer.disconnect()
  observer = null
  if (intervalId) clearInterval(intervalId)
  intervalId = null
})
</script>

<style scoped>
.caret {
  display: inline-block;
  width: 0.6ch;
  border-right: 2px solid currentColor;
  margin-left: 2px;
  animation: caret-blink 1s steps(1, end) infinite;
}

@keyframes caret-blink {
  0%, 49% { opacity: 1; }
  50%, 100% { opacity: 0; }
}
</style>
