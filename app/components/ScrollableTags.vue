<template>
  <div v-if="tags.length" class="relative">
    <button
      v-if="canScrollLeft"
      type="button"
      :aria-label="$t('desktop_quotes_grid.tags_scroll_left') as string"
      class="absolute inset-y-0 left-0 z-1 flex w-10 items-center justify-start bg-gradient-to-r from-gray-50 via-gray-50/90 to-transparent pl-1 text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-900 dark:from-[#0C0A09] dark:via-[#0C0A09]/90 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:outline-gray-100"
      @click="scrollLeft"
    >
      <NIcon name="i-ph-caret-left-bold" class="h-4 w-4" aria-hidden="true" />
    </button>
    <button
      v-if="canScrollRight"
      type="button"
      :aria-label="$t('desktop_quotes_grid.tags_scroll_right') as string"
      class="absolute inset-y-0 right-0 z-1 flex w-10 items-center justify-end bg-gradient-to-l from-gray-50 via-gray-50/90 to-transparent pr-1 text-gray-500 transition-colors hover:text-gray-900 focus-visible:outline-2 focus-visible:outline-gray-900 dark:from-[#0C0A09] dark:via-[#0C0A09]/90 dark:text-gray-400 dark:hover:text-gray-100 dark:focus-visible:outline-gray-100"
      @click="scrollRight"
    >
      <NIcon name="i-ph-caret-right-bold" class="h-4 w-4" aria-hidden="true" />
    </button>
    <nav
      ref="scrollRef"
      :aria-label="$t('desktop_quotes_grid.popular_tags') as string"
      tabindex="0"
      class="flex items-center gap-x-5 overflow-x-auto pb-3 scrollbar-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:focus-visible:outline-gray-100"
      @scroll="onScroll"
    >
      <NuxtLink
        v-for="tag in tags"
        :key="tag.id"
        :to="`/tags/${encodeURIComponent(tag.name)}`"
        :style="{ '--tag-color': tag.color || 'currentColor' }"
        class="tag-link inline-flex shrink-0 items-center py-1 text-xs font-600 font-sans uppercase tracking-[0.12em] text-stone-500 transition-colors hover:text-stone-900 dark:text-stone-400 dark:hover:text-stone-100"
      >
        <span class="mr-2 inline-block h-1.5 w-1.5 shrink-0 rounded-full" :style="{ backgroundColor: tag.color || 'currentColor' }" aria-hidden="true" />
        {{ tag.name }}
      </NuxtLink>
    </nav>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface TagItem {
  id: number
  name: string
  color?: string | null
}

const tags = ref<TagItem[]>([])
const scrollRef = ref<HTMLElement | null>(null)
const canScrollLeft = ref(false)
const canScrollRight = ref(false)

const scroll = (direction: 'left' | 'right') => {
  const el = scrollRef.value
  if (!el) return
  const amount = Math.max(180, el.clientWidth * 0.7)
  el.scrollBy({ left: direction === 'left' ? -amount : amount, behavior: 'smooth' })
}

const scrollLeft = () => scroll('left')
const scrollRight = () => scroll('right')

const onScroll = () => {
  const el = scrollRef.value
  if (!el) return
  canScrollLeft.value = el.scrollLeft > 0
  canScrollRight.value = el.scrollLeft < el.scrollWidth - el.clientWidth - 2
}

onMounted(async () => {
  try {
    const res = await $fetch('/api/tags', {
      query: { sort_by: 'quotes_count', sort_order: 'DESC', limit: 12 }
    })
    tags.value = (res as any)?.data || []
    await nextTick()
    onScroll()
    window.addEventListener('resize', onScroll, { passive: true })
  } catch (e) {
    console.error('Failed to load popular tags:', e)
  }
})

onUnmounted(() => window.removeEventListener('resize', onScroll))
</script>

<style scoped>
.tag-link:focus-visible {
  outline: 2px solid var(--tag-color);
  outline-offset: 3px;
}
</style>
