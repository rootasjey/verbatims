<template>
  <div class="group relative">
    <NuxtLink
      :to="`/quotes/${quote.id}`"
      class="block no-underline"
    >
      <blockquote
        class="font-serif text-gray-900 dark:text-gray-100 leading-relaxed text-balance relative overflow-hidden py-2 -mx-2 px-2 transition-all duration-300"
        :class="{
          'text-base': (quote.name || '').length > 200,
          'text-lg': (quote.name || '').length <= 200 && (quote.name || '').length > 100,
          'text-xl font-500': (quote.name || '').length <= 100
        }"
      >
        <span class="absolute inset-0 translate-x-[-101%] group-hover:translate-x-0 transition-transform duration-500 ease-out" :style="{ background: tagBackground }" />
        <span class="relative">{{ quote.name }}</span>
      </blockquote>
    </NuxtLink>

    <div class="flex items-center gap-2 mt-3">
      <div class="text-sm font-500 text-gray-700 dark:text-gray-300">
        <span>— </span> <NLink :to="quote.author ? `/authors/${quote.author.id}` : null">{{ quote.author?.name || 'Unknown' }}</NLink>
      </div>
      <span v-if="quote.reference?.name" class="text-xs text-gray-400 dark:text-gray-500">
        {{ quote.reference.name }}
      </span>
      <NBadge v-if="quote.is_featured" color="yellow" badge="soft" size="xs">Featured</NBadge>
      <NBadge v-if="quote.language !== 'en'" badge="outline-gray" size="xs">{{ quote.language }}</NBadge>
      <NDropdownMenu :items="menuItems">
        <NButton
          icon
          btn="ghost-gray"
          size="xs"
          label="i-ph-dots-three-vertical"
          @click.stop
        />
      </NDropdownMenu>
    </div>

    <!-- Thin separator -->
    <div class="h-px bg-gradient-to-r from-gray-200 via-gray-100 to-transparent dark:from-gray-700 dark:via-gray-800" />
  </div>
</template>

<script setup lang="ts">
import type { ProcessedQuoteResult } from '~~/server/types'

interface Props {
  quote: ProcessedQuoteResult
}

const props = defineProps<Props>()

const tagColors = computed(() => {
  if (!Array.isArray(props.quote.tags)) return []
  return props.quote.tags.map(t => t.color?.trim()).filter((c): c is string => Boolean(c))
})

const tagBackground = computed(() => {
  const colors = tagColors.value
  if (colors.length === 0) return 'transparent'
  if (colors.length === 1) return `${colors[0]}25`
  return `linear-gradient(135deg, ${colors.map(c => c + '15').join(', ')})`
})
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
</script>
