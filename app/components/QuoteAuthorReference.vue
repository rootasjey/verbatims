<template>
  <div v-if="quote.author || quote.reference">
    <!-- Signature variant: right-aligned, minimal, no avatar -->
    <template v-if="signature">
      <div class="flex flex-col items-end">
        <NuxtLink
          v-if="quote.author"
          :to="`/authors/${quote.author.id}`"
          class="group flex items-center gap-2"
        >
          <span class="font-serif text-lg md:text-xl font-400 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">—</span>
          <span class="font-serif text-lg md:text-xl font-400 text-gray-700 dark:text-gray-300 group-hover:text-gray-900 dark:group-hover:text-white transition-colors">
            {{ quote.author.name }}
          </span>
        </NuxtLink>
        <NuxtLink
          v-if="quote.reference"
          :to="`/references/${quote.reference.id}`"
          class="mt-1 font-sans text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors"
        >
          {{ quote.reference.name }}
        </NuxtLink>
      </div>
    </template>

    <!-- Default variant: centered with avatar -->
    <template v-else>
      <div class="border-t border-dashed border-gray-300 dark:border-gray-600 pt-8 space-y-2">
        <div v-if="quote.author" class="flex flex-col items-center justify-center">
          <NuxtLink :to="`/authors/${quote.author.id}`">
            <NAvatar
              :src="quote.author.image_url"
              :alt="quote.author.name"
              size="xl"
              :class="[
                'border-1 b-transparent shadow-sm hover:scale-105 active:scale-99 hover:shadow-lg active:shadow-none transition-transform',
                quote.author.is_fictional ? 'hover:b-purple' : 'hover:b-blue-600'
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
  </div>
</template>

<script lang="ts" setup>
interface Props {
  quote: QuoteWithRelations
  signature?: boolean
}

withDefaults(defineProps<Props>(), {
  signature: false
})
</script>