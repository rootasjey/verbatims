<template>
  <div v-if="quote.author || quote.reference" class="pt-0">
  <div class="w-full h-10 text-gray-300 dark:text-gray-600 mb-6" :style="{ color: waveColor || undefined }" aria-hidden="true">
      <svg viewBox="0 0 1200 40" preserveAspectRatio="none" class="w-full h-full block">
        <!-- Baseline at y=20, amplitude ~8, wavelength 100 → 12 cycles across 1200 -->
        <path
          d="M0 20
             c 25 -8, 75 8, 100 0
             s 75 8, 100 0
             s 75 -8, 100 0
             s 75 8, 100 0
             s 75 -8, 100 0
             s 75 8, 100 0
             s 75 -8, 100 0
             s 75 8, 100 0
             s 75 -8, 100 0
             s 75 8, 100 0
             s 75 -8, 100 0
             s 75 8, 100 0"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
    </div>
    <div v-if="quote.author" class="flex flex-row gap-4 items-center justify-center">
      <div class="flex gap-1">
        <NuxtLink
          :to="`/authors/${quote.author.id}`"
          class="font-subtitle text-size-6  font-600 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
        >
          {{ quote.author.name }}
        </NuxtLink>
        <NTooltip v-if="quote.author.is_fictional">
          <template #default>
            <NIcon name="i-ph-asterisk-bold" size="xs" class="text-primary hover:animate-spin" />
          </template>
          <template #content>
            <div class="text-sm">
              This author is fictional
            </div>
          </template>
        </NTooltip>
      </div>
    </div>

    <div v-if="quote.reference" class="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400"
      :class="{'-ml-4': quote.author?.is_fictional}">
      <NuxtLink
        :to="`/references/${quote.reference.id}`"
        class="font-title text-size-6 font-600 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {{ quote.reference.name }}
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
interface Props {
  quote: QuoteWithRelations
}

defineProps<Props>()

// Random pastel color for the wave divider on page load
const waveColor = ref<string | null>(null)
function randomPastelColor() {
  const hue = Math.floor(Math.random() * 360)
  // Saturation and lightness tuned for a soft pastel look
  return `hsl(${hue} 70% 80%)`
}

onMounted(() => {
  waveColor.value = randomPastelColor()
})

</script>