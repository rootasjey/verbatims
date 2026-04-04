<template>
  <NLink
    v-if="linkCard"
    :to="`/quotes/${quote.id}`"
    :style="topicBorderStyle"
    :class="{ 'has-topic-border': hasTopicBorder }"
    class="quote-grid-item group border relative p-6 cursor-pointer h-full flex flex-col 
      dark:hover:border-gray-600 hover:scale-101 hover:z-2 hover:font-500 active:scale-99 hover:shadow-lg transition-all duration-300 "
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
  >
    <div 
      :class="[
        'border-b b-dashed b-gray-200 dark:border-gray-400 pb-2 font-sans font-600 text-size-4 flex items-center justify-between mb-4 flex-shrink-0',
        isHovered ? 'opacity-100' : 'opacity-50'
      ]"
    >
      <span
        v-if="quote.author"
        class="text-gray-900 dark:text-gray-100 truncate transition-opacity duration-300 cursor-pointer"
        @click.prevent.stop="navigateToAuthor(quote.author.id)"
        @keyup.enter.prevent.stop="navigateToAuthor(quote.author.id)"
        role="link"
        tabindex="0"
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
      
      <NDropdownMenu :items="menuItems">
        <NButton
          icon
          btn="ghost-gray"
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
        <blockquote
          class="font-subtitle text-gray-800 dark:text-gray-200 leading-relaxed transition-opacity duration-300"
          :class="{
            'text-sm': (quote.name || '').length > 200,
            'text-base': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
            'text-lg': (quote.name || '').length <= 100
          }"
        >
          {{ quote.name }}
        </blockquote>
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
  </NLink>

  <div v-else
    :style="topicBorderStyle"
    :class="{ 'has-topic-border': hasTopicBorder }"
    class="quote-grid-item group border relative p-6 cursor-pointer h-full flex flex-col
    dark:hover:border-gray-600 hover:scale-101 active:scale-99 hover:shadow-lg transition-all duration-300 "
    @click="navigateToQuote"
    @mouseenter="isHovered = true"
    @mouseleave="isHovered = false"
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
          btn="ghost-gray"
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
import type { ProcessedQuoteResult } from '~~/server/types';
import { getTopicBorderStyle } from '~/utils/tagAccent'

const props = defineProps<{ quote: ProcessedQuoteResult; linkCard?: boolean }>()
const emit = defineEmits<{
  (e: 'edit', quote: ProcessedQuoteResult): void
  (e: 'delete', quote: ProcessedQuoteResult): void
  (e: 'report', quote: ProcessedQuoteResult): void
}>()

const isHovered = ref(false)
const topicBorderStyle = computed(() => getTopicBorderStyle(props.quote.tags))
const hasTopicBorder = computed(() => (props.quote.tags?.length ?? 0) > 0)

const navigateToQuote = () => {
  navigateTo(`/quotes/${props.quote.id}`)
}

const navigateToAuthor = (authorId: number | string) => {
  navigateTo(`/authors/${authorId}`)
}


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
    toast({ title: 'Link copied', toast: 'outline-success' })
  } catch (error) {
    toast({ title: 'Copy failed', description: 'Could not copy the link.', toast: 'outline-error' })
  }
}

const copyQuoteText = async () => {
  const { toast } = useToast()
  try {
    const text = `"${props.quote.name}"${props.quote.author ? ` — ${props.quote.author.name}` : ''}${props.quote.reference ? ` (${props.quote.reference.name})` : ''}`
    await navigator.clipboard.writeText(text)
    toast({ title: 'Text copied', toast: 'outline-success' })
  } catch (error) {
    toast({ title: 'Copy failed', description: 'Clipboard is not available.', toast: 'outline-error' })
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
      toast({ title: 'Quote shared!', toast: 'outline-success' })
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      toast({ title: 'Quote link copied', toast: 'outline-success' })
    }

    // Best-effort share tracking
    try { await $fetch(`/api/quotes/${props.quote.id}/share`, { method: 'POST' }) } catch {}
    if (typeof (props.quote as any).shares_count === 'number') {
      ;(props.quote as any).shares_count++
    }
  } catch (error) {
    console.error('Failed to share quote:', error)
    toast({ title: 'Failed to share', description: 'Please try again.', toast: 'outline-error' })
  } finally {
    sharePending.value = false
  }
}

// Dialogs are owned by parent; this item only emits events
</script>

<style scoped>
.quote-grid-item.has-topic-border:hover {
  border-color: var(--topic-border-color);
  border-image-source: var(--topic-border-image, none);
  border-image-slice: var(--topic-border-image-slice, 1);
}
</style>
