<template>
  <ContextMenu size="xs" :items="menuItems" native-on-modifier="ctrl" wrapper-class="relative w-full">
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

          <QuoteTagDots :tags="quote.tags" />

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

  const role = user.value?.role
  if (role === 'admin' || role === 'moderator') {
    items.push(
      { label: String($t('components.quote_actions.edit')), leading: 'i-ph-pencil-simple', onclick: () => emit('edit', props.quote) },
      { label: String($t('components.quote_actions.delete')), leading: 'i-ph-trash', onclick: () => emit('delete', props.quote) }
    )
  }

  if (user.value && props.quote.status === 'approved') {
    if (items.length) items.push({ label: '', leading: '', onclick: () => {} })
    items.push({
      label: String($t(props.quote.is_liked ? 'components.quote_actions.remove_favourite' : 'components.quote_actions.add_favourite')),
      leading: props.quote.is_liked ? 'i-ph-heart-break' : 'i-ph-heart',
      onclick: () => toggleFavourite()
    })
  }

  if (items.length) items.push({ label: '', leading: '', onclick: () => {} })
  items.push(
    { label: String($t('components.quote_actions.copy_link')), leading: 'i-ph-link', onclick: () => copyLink() },
    { label: String($t('components.quote_actions.copy_text')), leading: 'i-ph-quotes', onclick: () => copyQuoteText() },
    { label: String($t('components.quote_actions.share')), leading: 'i-ph-share-network', onclick: () => shareQuote() }
  )

  items.push({ label: '', leading: '', onclick: () => {} })
  items.push({ label: String($t('components.quote_actions.report')), leading: 'i-ph-flag', onclick: () => emit('report', props.quote) })

  const entityActions = [
    ...(props.quote.author?.id ? [{
      label: String($t('components.quote_actions.view_author_page')),
      leading: 'i-ph-user',
      onclick: () => navigateTo(`/authors/${props.quote.author!.id}`)
    }] : []),
    ...(props.quote.reference?.id ? [{
      label: String($t('components.quote_actions.view_reference_page')),
      leading: 'i-ph-book-open-text',
      onclick: () => navigateTo(`/references/${props.quote.reference!.id}`)
    }] : [])
  ]
  if (entityActions.length) items.push({ label: '', leading: '', onclick: () => {} }, ...entityActions)

  return items
})

const toggleFavourite = async () => {
  try {
    const result = await $fetch<{ data: { isLiked: boolean; likesCount: number } }>(`/api/quotes/${props.quote.id}/like`, { method: 'POST' })
    const wasLiked = !!props.quote.is_liked
    props.quote.is_liked = result.data.isLiked
    props.quote.likes_count = result.data.likesCount
    const favouritesCount = user.value?.id
      ? useState<number | null>(`dashboard-favourites-count-${user.value.id}`, () => null)
      : null
    if (favouritesCount?.value !== null && favouritesCount?.value !== undefined && wasLiked !== result.data.isLiked) {
      favouritesCount.value = Math.max(0, favouritesCount.value + (result.data.isLiked ? 1 : -1))
    }
  } catch (error) {
    showErrorToast(error, String($t('components.quote_actions.favourite_update_failed')))
  }
}

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
