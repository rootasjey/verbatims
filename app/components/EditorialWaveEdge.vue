<template>
  <svg
    class="pointer-events-none block h-4 w-full"
    aria-hidden="true"
  >
    <defs>
      <pattern :id="patternId" width="35" height="16" patternUnits="userSpaceOnUse">
        <path
          v-if="mode === 'cutout'"
          d="M 0 8 C 5.6 8 12.1 3.8 17.5 3.8 C 22.9 3.8 29.4 8 35 8 L 35 16 H 0 Z"
          fill="currentColor"
        />
        <path
          v-else
          d="M 0.75 8 C 6.35 8 12.1 3.8 17.5 3.8 C 22.9 3.8 28.65 8 34.25 8"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          stroke-linecap="round"
        />
      </pattern>
    </defs>
    <rect width="100%" height="16" :fill="`url(#${patternId})`" />
  </svg>
</template>

<script setup lang="ts">
withDefaults(defineProps<{ mode?: 'line' | 'cutout' }>(), {
  mode: 'line'
})

const patternId = useId().replaceAll(':', '')
</script>
