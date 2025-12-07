<template>
  <div class="flex-1 flex flex-col bg-white dark:bg-[#0C0A09]">
    <div class="flex-1 overflow-auto">
      <div class="divide-y divide-dashed divide-gray-200 dark:divide-gray-700">
        <div
          v-for="i in rows"
          :key="i"
          class="flex items-center gap-4 p-3 animate-pulse"
        >
          <template v-for="(variant, idx) in resolvedLayout" :key="idx">
            <div :class="colClasses[idx] || 'flex-1'">
              <!-- checkbox -->
              <div v-if="variant === 'checkbox'" class="h-4 w-4 rounded bg-gray-200 dark:bg-gray-700"></div>

              <!-- multi-line (title + subtitle) -->
              <div v-else-if="variant === 'multi'">
                <div class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700 mb-2"></div>
                <div class="h-3 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>
              </div>

              <!-- text (default width) -->
              <div v-else-if="variant === 'text'" class="h-4 w-3/4 rounded bg-gray-200 dark:bg-gray-700"></div>

              <!-- short text -->
              <div v-else-if="variant === 'short'" class="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>

              <!-- tiny text -->
              <div v-else-if="variant === 'tiny'" class="h-4 w-1/2 rounded bg-gray-200 dark:bg-gray-700"></div>

              <!-- date width -->
              <div v-else-if="variant === 'date'" class="h-4 w-3/5 rounded bg-gray-200 dark:bg-gray-700"></div>

              <!-- badge/pill -->
              <div v-else-if="variant === 'pill'" class="h-5 w-16 rounded-full bg-gray-200 dark:bg-gray-700"></div>

              <!-- dot / small icon -->
              <div v-else-if="variant === 'dot'" class="h-4 w-6 rounded bg-gray-200 dark:bg-gray-700"></div>

              <!-- fallback -->
              <div v-else class="h-4 w-2/3 rounded bg-gray-200 dark:bg-gray-700"></div>
            </div>
          </template>
        </div>
      </div>
    </div>

    <!-- Footer (pagination) skeleton -->
    <div v-if="showFooter" class="flex-shrink-0 flex items-center justify-between pt-4">
      <div class="h-4 w-32 rounded bg-gray-200 dark:bg-gray-700"></div>
      <div class="h-8 w-48 rounded bg-gray-200 dark:bg-gray-700"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Props {
  rows?: number
  colClasses?: string[]
  layout?: Array<'checkbox' | 'multi' | 'text' | 'short' | 'tiny' | 'pill' | 'date' | 'dot'>
  showFooter?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  rows: 10,
  colClasses: () => [
    'w-12',
    'min-w-80 flex-1',
    'w-40',
    'w-40',
    'w-32',
    'w-24',
    'w-28',
    'w-16'
  ],
  layout: () => ['checkbox', 'multi', 'text', 'short', 'tiny', 'pill', 'date', 'dot'],
  showFooter: true
})

const resolvedLayout = computed(() => props.layout)
</script>

<style scoped>
/* No additional styles; relies on utility classes for appearance */
</style>
