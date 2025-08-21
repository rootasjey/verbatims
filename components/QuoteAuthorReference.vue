<template>
  <div v-if="quote.author || quote.reference" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8 space-y-2">
    <!-- Author -->
    <div v-if="quote.author" class="flex flex-col items-center justify-center">
      <NuxtLink :to="`/authors/${quote.author.id}`">
        <UAvatar
          :src="quote.author.image_url"
          :alt="quote.author.name"
          size="xl"
          class="ring-2 ring-gray-200 dark:ring-gray-700 hover:scale-105 active:scale-99 transition-transform"
        />
      </NuxtLink>
      <div class="mt-2">
        <NuxtLink
          :to="`/authors/${quote.author.id}`"
          class="font-body text-size-4  font-400 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
        >
          {{ quote.author.name }}
        </NuxtLink>
        <UBadge
          v-if="quote.author.is_fictional"
          class="mt-1"
          label="Fictional Character"
        />
      </div>
    </div>

    <!-- Reference -->
    <div v-if="quote.reference" class="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400">
      <UIcon :name="getReferenceIcon(quote.reference.primary_type)" />
      <NuxtLink
        :to="`/references/${quote.reference.id}`"
        class="font-serif font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
      >
        {{ quote.reference.name }}
      </NuxtLink>
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { Quote, QuoteWithRelations } from '~/types';

interface Props {
  quote: QuoteWithRelations
}

defineProps<Props>()
</script>