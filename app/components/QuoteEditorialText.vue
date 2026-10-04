<template>
  <blockquote
    class="quote-editorial-text relative font-serif leading-relaxed text-gray-900 text-balance dark:text-gray-100"
    :style="{ '--quote-hover-accent': accent }"
  >
    <span class="quote-editorial-underline">{{ text }}</span>
  </blockquote>
</template>

<script setup lang="ts">
const props = withDefaults(defineProps<{
  text: string
  tags?: Array<{ color?: string | null }>
}>(), {
  tags: () => []
})

const accent = computed(() => props.tags.find(tag => tag.color?.trim())?.color?.trim() || 'currentColor')
</script>

<style scoped>
.quote-editorial-underline {
  -webkit-box-decoration-break: clone;
  box-decoration-break: clone;
  background-image: linear-gradient(var(--quote-hover-accent), var(--quote-hover-accent));
  background-repeat: no-repeat;
  background-position: 0 100%;
  background-size: 0% 1px;
  transition: background-size 320ms cubic-bezier(0.22, 1, 0.36, 1);
}

:global(.quote-editorial-link:hover .quote-editorial-underline),
:global(.quote-editorial-link:focus-visible .quote-editorial-underline),
:global(.quote-editorial-surface:hover .quote-editorial-underline) {
  background-size: 100% 1px;
}

@media (prefers-reduced-motion: reduce) {
  .quote-editorial-underline {
    transition: none;
  }
}
</style>
