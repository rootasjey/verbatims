<template>
  <NuxtLink
    :to="`/quotes/${quote.id}`"
    class="group block p-5 no-underline rounded-xl hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
  >
    <blockquote class="font-serif text-gray-900 dark:text-gray-100 leading-relaxed text-balance"
      :class="{
        'text-base': (quote.name || '').length > 200,
        'text-lg': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
        'text-xl font-500': (quote.name || '').length <= 100
      }"
    >
      {{ quote.name }}
    </blockquote>

    <div class="h-px bg-gradient-to-r from-gray-100 via-gray-100 to-transparent dark:from-gray-800 dark:via-gray-800 mt-4 mb-3"></div>

    <div class="flex items-center justify-between gap-3">
      <div class="flex items-center gap-3 min-w-0 flex-1">
        <NAvatar
          v-if="quote.author"
          :src="quote.author.image_url || undefined"
          :alt="quote.author.name"
          size="xs"
          :fallback="getAuthorInitials(quote.author.name)"
          class="shrink-0"
        />
        <div class="min-w-0">
          <div class="text-sm font-500 text-gray-900 dark:text-white truncate group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {{ quote.author?.name || 'Unknown Author' }}
          </div>
          <div v-if="quote.reference?.name" class="text-xs text-gray-400 dark:text-gray-500 truncate">
            {{ quote.reference.name }}
          </div>
        </div>
      </div>

      <div class="flex items-center gap-2 shrink-0">
        <NBadge v-if="quote.is_featured" color="yellow" badge="soft" size="xs" class="opacity-0 group-hover:opacity-100 transition-opacity">
          Featured
        </NBadge>
        <NDropdownMenu :items="menuItems">
          <NButton
            icon
            btn="ghost-gray"
            size="xs"
            label="i-ph-dots-three-vertical"
            class="opacity-0 group-hover:opacity-100 transition-opacity"
            @click.stop
          />
        </NDropdownMenu>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'

interface Props {
  quote: ProcessedQuoteResult
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'edit', quote: ProcessedQuoteResult): void
  (e: 'delete', quote: ProcessedQuoteResult): void
  (e: 'report', quote: ProcessedQuoteResult): void
}>()

const { user } = useUserSession()
const sharePending = ref(false)

const menuItems = computed(() => {
  const items: { label: string; leading: string; onclick: () => void }[] = []

  const role = user.value?.role
  if (role === 'admin' || role === 'moderator') {
    items.push(
      { label: 'Edit', leading: 'i-ph-pencil-simple', onclick: () => emit('edit', props.quote) },
      { label: 'Delete', leading: 'i-ph-trash', onclick: () => emit('delete', props.quote) }
    )
  }

  items.push(
    { label: 'Copy link', leading: 'i-ph-link', onclick: () => copyLink() },
    { label: 'Copy text', leading: 'i-ph-quotes', onclick: () => copyQuoteText() },
    { label: 'Share', leading: 'i-ph-share-network', onclick: () => shareQuote() },
    { label: 'Report', leading: 'i-ph-flag', onclick: () => emit('report', props.quote) }
  )

  return items
})

const copyLink = async () => {
  const { toast } = useToast()
  try {
    const url = typeof window !== 'undefined' ? `${window.location.origin}/quotes/${props.quote.id}` : ''
    if (!url) throw new Error('no-url')
    await navigator.clipboard.writeText(url)
    toast({ title: 'Link copied' })
  } catch {
    toast({ title: 'Copy failed', description: 'Could not copy the link.' })
  }
}

const copyQuoteText = async () => {
  const { toast } = useToast()
  try {
    const text = `"${props.quote.name}"${props.quote.author ? ` — ${props.quote.author.name}` : ''}${props.quote.reference ? ` (${props.quote.reference.name})` : ''}`
    await navigator.clipboard.writeText(text)
    toast({ title: 'Text copied' })
  } catch {
    toast({ title: 'Copy failed', description: 'Clipboard is not available.' })
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
      toast({ title: 'Quote shared!' })
    } else {
      await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`)
      toast({ title: 'Quote link copied' })
    }
  } catch {
    toast({ title: 'Failed to share', description: 'Please try again.' })
  } finally {
    sharePending.value = false
  }
}

const getAuthorInitials = (name: string): string => {
  if (!name) return '??'
  return name
    .split(' ')
    .map(word => word.charAt(0))
    .join('')
    .toUpperCase()
    .slice(0, 2)
}
</script>
