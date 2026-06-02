<template>
  <div v-if="tags.length" class="relative group">
    <button
      class="absolute left-0 top-0 bottom-7 z-1 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-r from-gray-50 dark:from-[#0C0A09] via-gray-50/80 dark:via-[#0C0A09]/80 to-transparent cursor-pointer"
      @click="scrollLeft"
    >
      <NIcon name="i-ph-caret-left-bold" class="text-gray-500 dark:text-gray-400" />
    </button>
    <button
      class="absolute right-0 top-0 bottom-7 z-1 w-8 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 bg-gradient-to-l from-gray-50 dark:from-[#0C0A09] via-gray-50/80 dark:via-[#0C0A09]/80 to-transparent cursor-pointer"
      @click="scrollRight"
    >
      <NIcon name="i-ph-caret-right-bold" class="text-gray-500 dark:text-gray-400" />
    </button>
    <div ref="scrollRef" class="overflow-x-auto pb-4 scrollbar-hide" @scroll="onScroll">
      <div class="flex gap-2">
        <NuxtLink
          v-for="tag in tags"
          :key="tag.id"
          :to="`/tags/${encodeURIComponent(tag.name)}`"
          :style="tag.color ? { '--tag-hover': tag.color } : undefined"
          class="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium border border-gray-200 dark:border-gray-700 transition-colors no-underline text-gray-600 dark:text-gray-400 whitespace-nowrap"
          :class="tag.color ? 'hover-custom' : 'hover:border-blue-500 dark:hover:border-blue-400 hover:text-blue-600 dark:hover:text-blue-400'"
        >
          #{{ tag.name }}
        </NuxtLink>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
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
  const amount = 300
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
      query: { sort_by: 'quotes_count', sort_order: 'DESC', limit: 30 }
    })
    tags.value = (res as any)?.data || []
    await nextTick()
    onScroll()
  } catch (e) {
    console.error('Failed to load popular tags:', e)
  }
})
</script>

<style scoped>
.hover-custom:hover {
  border-color: var(--tag-hover) !important;
  color: var(--tag-hover) !important;
}
</style>
