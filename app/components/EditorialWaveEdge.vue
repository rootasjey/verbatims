<template>
  <svg
    class="pointer-events-none block h-4 w-full"
    aria-hidden="true"
  >
    <defs>
      <pattern :id="patternId" width="35" height="16" patternUnits="userSpaceOnUse">
        <path
          v-if="mode === 'masthead'"
          d="M 0 0 C 5.6 0 12.1 12 17.5 12 C 22.9 12 29.4 0 35 0 L 35 0 H 0 Z"
          fill="currentColor"
        />
        <path
          v-if="mode === 'cutout'"
          d="M 0 8 C 5.6 8 12.1 3.8 17.5 3.8 C 22.9 3.8 29.4 8 35 8 L 35 16 H 0 Z"
          fill="currentColor"
        />
      </pattern>
    </defs>
    <rect width="100%" height="16" :fill="`url(#${patternId})`" />
  </svg>
</template>

<script setup lang="ts">
defineProps<{ mode: 'cutout' | 'masthead' }>()

const patternId = useId().replaceAll(':', '')
</script>
