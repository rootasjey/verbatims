<template>
  <p
    v-if="credit || sourceUrl || license || date || location"
    class="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400"
  >
    <a v-if="sourceUrl" :href="sourceUrl" target="_blank" rel="noopener noreferrer" class="underline decoration-gray-300 underline-offset-2 hover:text-gray-800 dark:decoration-gray-600 dark:hover:text-gray-100">
      {{ credit || 'Image source' }}
    </a>
    <span v-else-if="credit">{{ credit }}</span>
    <span v-if="license">{{ credit || sourceUrl ? ' · ' : '' }}{{ license }}</span>
    <span v-if="date">{{ credit || sourceUrl || license ? ' · ' : '' }}{{ date }}</span>
    <span v-if="location">{{ credit || sourceUrl || license || date ? ' · ' : '' }}{{ location }}</span>
  </p>
</template>

<script setup lang="ts">
defineProps<{
  credit?: string | null
  sourceUrl?: string | null
  license?: string | null
  date?: string | null
  location?: string | null
}>()
</script>
