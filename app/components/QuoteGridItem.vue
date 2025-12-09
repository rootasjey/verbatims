<template>
  <div
    class="quote-grid-item group border relative p-6 cursor-pointer h-full flex flex-col
    dark:hover:b-blue hover:scale-101 active:scale-99 hover:shadow-lg transition-all duration-300 "
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
    ref="containerRef"
  >
    <div 
      :class="[
        'border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 font-sans font-600 text-size-4 flex items-center justify-between mb-4 flex-shrink-0',
        isHovered ? 'opacity-100' : 'opacity-50'
      ]"
    >
      <NLink
        v-if="quote.author"
        :to="`/authors/${quote.author.id}`"
        class="text-gray-900 dark:text-gray-100 truncate transition-opacity duration-300"
        :class="{ 'group-hover:opacity-100': true, 'opacity-100': !isHovered, 'opacity-0': isHovered }"
      >
        {{ quote.author.name }}
      </NLink>
      <span
        v-else
        class="font-medium text-gray-500 dark:text-gray-400 truncate transition-opacity duration-300"
        :class="{ 'group-hover:opacity-100': true, 'opacity-100': !isHovered, 'opacity-0': isHovered }"
      >
        Unknown Author
      </span>
      
      <NDropdownMenu :items="menuItems">
        <NButton
          icon
          btn="ghost"
          size="xs"
          label="i-ph-dots-three-vertical"
          class="opacity-0 group-hover:opacity-100 flex-shrink-0 transition-opacity duration-300"
          @click.stop
          :title="'Quote actions'"
        />
      </NDropdownMenu>
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

    <NBadge
      v-if="quote.is_featured"
      color="yellow"
      badge="subtle"
      size="xs"
      class="absolute top-2 right-2"
    >
      Featured
    </NBadge>
  </div>
</template>

<script lang="ts" setup>
import type { ProcessedQuoteResult } from '~/types';

interface Props {
  quote: ProcessedQuoteResult
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'edit', quote: ProcessedQuoteResult): void
  (e: 'delete', quote: ProcessedQuoteResult): void
  (e: 'report', quote: ProcessedQuoteResult): void
}>()

const isHovered = ref(false)

const navigateToQuote = () => {
  navigateTo(`/quotes/${props.quote.id}`)
}

// Typewriter animation when the card appears
const containerRef = ref(null)
const displayedText = ref('')
const showCaret = ref(false)
let hasTyped = false
let observer: IntersectionObserver | undefined = undefined
let intervalId: NodeJS.Timeout | undefined = undefined

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
      intervalId = undefined
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
  observer = undefined
  if (intervalId) clearInterval(intervalId)
  intervalId = undefined
})

// Keep displayed text in sync when the quote content changes (e.g., after edit)
watch(() => props.quote?.name, (newText) => {
  const text = (newText || '').toString()
  displayedText.value = text
  showCaret.value = false
})

const { user } = useUserSession()
const sharePending = ref(false)

const menuItems = computed(() => {
  const items: { label: string; leading: string; onclick: () => void }[] = []

  const role = user.value?.role
  if (role === 'admin' || role === 'moderator') {
    items.push(
      {
        label: 'Edit',
        leading: 'i-ph-pencil-simple',
        onclick: () => emit('edit', props.quote)
      },
      {
        label: 'Delete',
        leading: 'i-ph-trash',
        onclick: () => emit('delete', props.quote)
      }
    )
  }

  items.push(
    {
      label: 'Copy link',
      leading: 'i-ph-link',
      onclick: () => copyLink()
    },
    {
      label: 'Copy text',
      leading: 'i-ph-quotes',
      onclick: () => copyQuoteText()
    },
    {
      label: 'Share',
      leading: 'i-ph-share-network',
      onclick: () => shareQuote()
    },
    {
      label: 'Report',
      leading: 'i-ph-flag',
      onclick: () => emit('report', props.quote)
    }
  )

  return items
})

const copyLink = async () => {
  const { toast } = useToast()
  try {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/quotes/${props.quote.id}` : ''
    if (!url) throw new Error('no-url')
    await navigator.clipboard.writeText(url)
    toast({ title: 'Link copied', toast: 'success' })
  } catch (error) {
    toast({ title: 'Copy failed', description: 'Could not copy the link.', toast: 'error' })
  }
}

const copyQuoteText = async () => {
  const { toast } = useToast()
  try {
    const text = `"${props.quote.name}"${props.quote.author ? ` — ${props.quote.author.name}` : ''}${props.quote.reference ? ` (${props.quote.reference.name})` : ''}`
    await navigator.clipboard.writeText(text)
    toast({ title: 'Text copied', toast: 'success' })
  } catch (error) {
    toast({ title: 'Copy failed', description: 'Clipboard is not available.', toast: 'error' })
  }
}

const shareQuote = async () => {
  if (sharePending.value) return
  sharePending.value = true
  const { toast } = useToast()
  try {
    const shareData = {
      title: 'Quote from Verbatims',
      text: `"${props.quote.name}" ${props.quote.author ? `- ${props.quote.author.name}` : ''}`,
      url: typeof window !== 'undefined' ? `${window.location.origin}/quotes/${props.quote.id}` : ''
    }

    if (navigator.share) {
      await navigator.share(shareData as any)
      toast({ title: 'Quote shared!', toast: 'success' })
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      toast({ title: 'Quote link copied', toast: 'success' })
    }

    // Best-effort share tracking
    try { await $fetch(`/api/quotes/${props.quote.id}/share`, { method: 'POST' }) } catch {}
    if (typeof (props.quote as any).shares_count === 'number') {
      ;(props.quote as any).shares_count++
    }
  } catch (error) {
    console.error('Failed to share quote:', error)
    toast({ title: 'Failed to share', description: 'Please try again.', toast: 'error' })
  } finally {
    sharePending.value = false
  }
}

// Dialogs are owned by parent; this item only emits events
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
