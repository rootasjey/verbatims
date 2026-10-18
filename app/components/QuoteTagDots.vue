<template>
  <span
    v-if="tags.length"
    class="quote-tag-cluster hidden shrink-0 items-center pl-1 md:inline-flex"
    role="group"
    :aria-label="String($t('tags'))"
    :style="{ width: `${14 + tags.length * 8}px` }"
  >
    <NTooltip v-for="(tag, index) in tags" :key="tag.name" :content="tag.name">
      <NuxtLink
        :to="`/tags/${encodeURIComponent(tag.name)}`"
        :aria-label="tag.name"
        class="quote-tag-dot h-2.5 w-2.5 rounded-full border border-[#e7e4dd] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gray-900 dark:border-[#17191e] dark:focus-visible:outline-gray-100"
        :class="{ 'quote-tag-dot-first': index === 0 }"
        :style="{ '--tag-index': index, backgroundColor: tag.color?.trim() || '#78716c', zIndex: tags.length - index }"
      >
        <span class="sr-only">{{ tag.name }}</span>
      </NuxtLink>
    </NTooltip>
  </span>
</template>

<script setup lang="ts">
withDefaults(defineProps<{
  tags?: Array<{ name: string; color?: string | null }>
}>(), {
  tags: () => []
})

const { $t } = useI18n()
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
