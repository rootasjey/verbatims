<template>
  <div v-if="quote.author || quote.reference" class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8 space-y-2">
    <!-- Author -->
    <div v-if="quote.author" class="flex flex-col items-center justify-center">
      <NuxtLink :to="`/authors/${quote.author.id}`">
        <NAvatar
          :src="quote.author.image_url"
          :alt="quote.author.name"
          size="xl"
          :class="[
            'border-1 b-transparent shadow-sm hover:scale-105 active:scale-99 transition-transform',
            quote.author.is_fictional
              ? 'shadow-pink-500/75 hover:shadow-pink-500 active:shadow-none'
              : 'shadow-blue-500/75 hover:shadow-blue-500 active:shadow-none',
            quote.author.is_fictional ? 'hover:b-pink-500' : 'hover:b-blue-600'
          ]"
        />
      </NuxtLink>
      <div class="mt-2">
        <NuxtLink
          :to="`/authors/${quote.author.id}`"
          class="font-subtitle text-size-4  font-400 text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400 transition-colors block"
          :aria-label="`${quote.author.name} — ${quote.author.is_fictional ? 'Fictional character' : 'Real person'}`"
        >
          {{ quote.author.name }}
        </NuxtLink>
      </div>
    </div>

    <!-- Reference -->
    <div v-if="quote.reference" class="flex items-center justify-center space-x-3 text-gray-600 dark:text-gray-400">
      <NIcon :name="getReferenceIcon(quote.reference.primary_type)" />
      <NuxtLink
        :to="`/references/${quote.reference.id}`"
        class="font-subtitle font-medium hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
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
</script>