<template>
  <ContextMenu :items="menuItems" native-on-modifier="ctrl" wrapper-class="relative w-full">
    <div class="relative w-full">
      <div class="mb-1 flex items-center justify-between gap-3">
        <div class="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 font-sans text-sm text-gray-500 dark:text-gray-400">
          <NuxtLink
            v-if="quote.author"
            :to="`/authors/${quote.author.id}`"
            class="font-500 text-gray-700 transition-colors hover:text-gray-950 focus-visible:underline dark:text-gray-300 dark:hover:text-white"
          >
            {{ quote.author.name }}
          </NuxtLink>
          <span v-else class="font-500 text-gray-700 dark:text-gray-300">
            {{ $t('home.unknown_author') }}
          </span>

          <template v-if="quote.reference?.name">
            <span aria-hidden="true">·</span>
            <NuxtLink
              :to="`/references/${quote.reference.id}`"
              class="text-gray-500 transition-colors hover:text-gray-800 focus-visible:underline dark:text-gray-400 dark:hover:text-gray-200"
            >
              {{ quote.reference.name }}
            </NuxtLink>
          </template>

          <span
            v-if="quote.tags?.length"
            class="quote-tag-cluster hidden shrink-0 items-center pl-1 md:inline-flex"
            role="group"
            :aria-label="$t('tags') as string"
            :style="{ width: `${14 + quote.tags.length * 8}px` }"
          >
            <NTooltip v-for="(tag, index) in quote.tags" :key="tag.name" :content="tag.name">
              <NuxtLink
                :to="`/tags/${encodeURIComponent(tag.name)}`"
                :aria-label="tag.name"
                class="quote-tag-dot h-2.5 w-2.5 rounded-full border border-[#e7e4dd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:border-[#17191e] dark:focus-visible:outline-gray-100"
                :class="{ 'quote-tag-dot-first': index === 0 }"
                :style="{ '--tag-index': index, backgroundColor: tag.color?.trim() || '#78716c', zIndex: quote.tags.length - index }"
              >
                <span class="sr-only">{{ tag.name }}</span>
              </NuxtLink>
            </NTooltip>
          </span>

          <NBadge v-if="quote.is_featured" color="yellow" badge="soft" size="xs">{{ $t('home.featured') }}</NBadge>
          <NBadge v-if="quote.language !== 'en'" badge="outline-gray" size="xs">{{ quote.language }}</NBadge>
        </div>
        <div class="shrink-0">
          <NDropdownMenu :items="menuItems" :modal="false">
            <NButton
              icon
              btn="ghost-gray"
              size="xs"
              label="i-ph-dots-three-vertical"
              :aria-label="$t('components.quote_actions.quick_actions') as string"
              :title="$t('components.quote_actions.quick_actions') as string"
              @click.stop
            />
          </NDropdownMenu>
        </div>
      </div>

      <NuxtLink :to="`/quotes/${quote.id}`" class="quote-link quote-editorial-link group block no-underline">
        <QuoteEditorialText
          :text="quote.name"
          :tags="quote.tags"
          class="relative -mx-2 max-w-[64ch] px-2 pb-0 pt-1"
          :class="{
            'text-base sm:text-lg': (quote.name || '').length > 200,
            'text-lg sm:text-xl': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
            'text-xl font-500 sm:text-2xl': (quote.name || '').length <= 100
          }"
        />
      </NuxtLink>
    </div>
  </ContextMenu>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'

interface Props {
  quote: ProcessedQuoteResult
}

const props = defineProps<Props>()
const { $t } = useI18n()

const emit = defineEmits<{
  (e: 'edit', quote: ProcessedQuoteResult): void
  (e: 'delete', quote: ProcessedQuoteResult): void
  (e: 'report', quote: ProcessedQuoteResult): void
}>()

const { user } = useUserSession()
const sharePending = ref(false)
const { showErrorToast } = useErrorToast()

const menuItems = computed(() => {
  const items: { label: string; leading: string; onclick: () => void }[] = []

  if (props.quote.author?.id) {
    items.push({
      label: String($t('components.quote_actions.view_author_page')),
      leading: 'i-ph-user',
      onclick: () => navigateTo(`/authors/${props.quote.author!.id}`)
    })
  }
  if (props.quote.reference?.id) {
    items.push({
      label: String($t('components.quote_actions.view_reference_page')),
      leading: 'i-ph-book-open-text',
      onclick: () => navigateTo(`/references/${props.quote.reference!.id}`)
    })
  }
  if (items.length) items.push({ label: '', leading: '', onclick: () => {} })

  const role = user.value?.role
  if (role === 'admin' || role === 'moderator') {
    items.push(
      { label: String($t('components.quote_actions.edit')), leading: 'i-ph-pencil-simple', onclick: () => emit('edit', props.quote) },
      { label: String($t('components.quote_actions.delete')), leading: 'i-ph-trash', onclick: () => emit('delete', props.quote) }
    )
  }

  items.push(
    { label: String($t('components.quote_actions.copy_link')), leading: 'i-ph-link', onclick: () => copyLink() },
    { label: String($t('components.quote_actions.copy_text')), leading: 'i-ph-quotes', onclick: () => copyQuoteText() },
    { label: String($t('components.quote_actions.share')), leading: 'i-ph-share-network', onclick: () => shareQuote() },
    { label: String($t('components.quote_actions.report')), leading: 'i-ph-flag', onclick: () => emit('report', props.quote) }
  )

  return items
})

const copyLink = async () => {
  const { toast } = useToast()
  try {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/quotes/${props.quote.id}` : ''
    if (!url) throw new Error('no-url')
    await navigator.clipboard.writeText(url)
    toast({ title: String($t('components.quote_actions.link_copied')), toast: 'outline-success' })
  } catch {
    showErrorToast(null, {
      title: String($t('components.quote_actions.copy_failed')),
      fallback: String($t('components.quote_actions.copy_link_failed'))
    })
  }
}

const copyQuoteText = async () => {
  const { toast } = useToast()
  try {
    const text = `"${props.quote.name}"${props.quote.author ? ` — ${props.quote.author.name}` : ''}${props.quote.reference ? ` (${props.quote.reference.name})` : ''}`
    await navigator.clipboard.writeText(text)
    toast({ title: String($t('components.quote_actions.text_copied')), toast: 'outline-success' })
  } catch {
    showErrorToast(null, {
      title: String($t('components.quote_actions.copy_failed')),
      fallback: String($t('components.quote_actions.clipboard_unavailable'))
    })
  }
}

const shareQuote = async () => {
  if (sharePending.value) return
  sharePending.value = true
  const { toast } = useToast()
  try {
    const shareData = {
      title: String($t('components.quote_actions.share_title')),
      text: `"${props.quote.name}" ${props.quote.author ? `- ${props.quote.author.name}` : ''}`,
      url: typeof window !== 'undefined' ? `${window.location.origin}/quotes/${props.quote.id}` : ''
    }
    if (navigator.share) {
      await navigator.share(shareData as any)
      toast({ title: String($t('components.quote_actions.quote_shared')), toast: 'outline-success' })
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      toast({ title: String($t('components.quote_actions.quote_link_copied')), toast: 'outline-success' })
    }
  } catch {
    showErrorToast(null, {
      title: String($t('components.quote_actions.share_failed')),
      fallback: String($t('components.quote_actions.try_again'))
    })
  } finally {
    sharePending.value = false
  }
}
</script>

<style scoped>
.quote-tag-cluster {
  position: relative;
  isolation: isolate;
}

.quote-tag-dot {
  position: relative;
  margin-left: -0.375rem;
  transition: transform 180ms ease-out;
}

.quote-tag-dot-first {
  margin-left: 0;
}

.quote-tag-cluster:hover .quote-tag-dot,
.quote-tag-cluster:focus-within .quote-tag-dot {
  transform: translateX(calc(var(--tag-index, 0) * 0.5rem));
}

@media (prefers-reduced-motion: reduce) {
  .quote-tag-dot {
    transition: none;
  }
}
</style>
