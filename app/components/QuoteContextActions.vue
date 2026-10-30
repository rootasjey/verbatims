<template>
  <ContextMenu
    :items="menuItems"
    size="xs"
    native-on-modifier="ctrl"
    wrapper-class="relative w-full"
  >
    <slot :menu-items="menuItems" />
  </ContextMenu>
</template>

<script setup lang="ts">
import type { QuoteWithMetadata, QuoteWithRelations } from '~~/shared/types/quote'

type QuoteActionTarget = (QuoteWithMetadata | QuoteWithRelations) & { is_liked?: boolean }

interface MenuItem {
  label: string
  leading: string
  onclick: () => void
}

interface Props {
  quote: QuoteActionTarget
}

const props = defineProps<Props>()
const emit = defineEmits<{
  edit: [quote: QuoteActionTarget]
  delete: [quote: QuoteActionTarget]
  report: [quote: QuoteActionTarget]
}>()

const { $t } = useI18n()
const { user } = useUserSession()
const { showErrorToast } = useErrorToast()
const sharePending = ref(false)

const menuItems = computed<MenuItem[]>(() => {
  const items: MenuItem[] = []
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
      onclick: toggleFavourite
    })
  }

  if (items.length) items.push({ label: '', leading: '', onclick: () => {} })
  items.push(
    { label: String($t('components.quote_actions.copy_link')), leading: 'i-ph-link', onclick: copyLink },
    { label: String($t('components.quote_actions.copy_text')), leading: 'i-ph-quotes', onclick: copyQuoteText },
    { label: String($t('components.quote_actions.share')), leading: 'i-ph-share-network', onclick: shareQuote },
    { label: '', leading: '', onclick: () => {} },
    { label: String($t('components.quote_actions.report')), leading: 'i-ph-flag', onclick: () => emit('report', props.quote) }
  )

  return items
})

const toggleFavourite = async () => {
  try {
    const likePath = `/api/quotes/${props.quote.id}/like` as '/api/quotes/:id/like'
    const result = await $fetch<{ data: { isLiked: boolean; likesCount: number } }, '/api/quotes/:id/like'>(likePath, { method: 'POST' })
    const wasLiked = Boolean(props.quote.is_liked)
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
    await navigator.clipboard.writeText(`${window.location.origin}/quotes/${props.quote.id}`)
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
    const text = `"${props.quote.name}"${props.quote.author?.name ? ` — ${props.quote.author.name}` : ''}${props.quote.reference?.name ? ` (${props.quote.reference.name})` : ''}`
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
  const shareData = {
    title: String($t('components.quote_actions.share_title')),
    text: `"${props.quote.name}"${props.quote.author?.name ? ` — ${props.quote.author.name}` : ''}`,
    url: `${window.location.origin}/quotes/${props.quote.id}`
  }

  try {
    if (navigator.share) {
      await navigator.share(shareData)
      toast({ title: String($t('components.quote_actions.quote_shared')), toast: 'outline-success' })
      return
    }

    await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
    toast({ title: String($t('components.quote_actions.quote_link_copied')), toast: 'outline-success' })
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
