<template>
  <div class="px-8 font-serif">
    <!-- Empty State (when no authors) -->
    <div class="text-center py-16 mb-16">
      <div class="max-w-2xl mx-auto">
        <UIcon name="i-ph-users" class="w-16 h-16 text-primary-500 mx-auto mb-6" />
        <h2 class="text-3xl font-600 line-height-none mb-4">
          {{ searchQuery ? 'No authors found' : 'No authors yet' }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-lg mb-8">
          {{ searchQuery 
            ? `No authors match "${searchQuery}". Try a different search term or submit a quote to create new authors.`
            : 'Start building your authors collection by submitting quotes with author attribution.'
          }}
        </p>
        <UButton
          @click="$emit('openSubmitModal')"
          size="lg"
          class="px-8 py-4"
        >
          <UIcon name="i-ph-plus" />
          <span>Submit Your First Quote</span>
        </UButton>
      </div>
    </div>

    <!-- Features Bento Grid for Authors -->
    <div class="mb-20">
      <AuthorsEmptyBentoGrid />
    </div>

    <!-- Authors Information Section -->
    <div class="max-w-3xl mx-auto mt-42 mb-16">
      <div class="text-center mb-8 border-b b-dashed pb-8">
        <UIcon name="i-ph-user-circle" class="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 class="font-subtitle text-3xl font-600 line-height-none mb-2">Discover Inspiring Authors</h2>
        <p class="font-sans text-gray-600 dark:text-gray-400 text-lg">
          From historical figures to fictional characters, explore the minds behind the most memorable quotes.
        </p>
      </div>

      <div class="font-body font-400 text-size-8 text-center prose prose-gray dark:prose-invert">
        <p class="leading-relaxed">
          Authors are the heart of every great quote. Whether they're <i class="color-blue-6">real historical figures</i> 
          who shaped our world, or <i class="color-purple-6">fictional characters</i> who captured our imagination, 
          each author brings their unique perspective and wisdom to our collection.
        </p>

        <p>...</p>
        <p class="leading-relaxed mb-6">
          What makes our authors collection special:
        </p>

        <div class="font-body font-400 text-size-5 rounded-lg p-6 mb-6">
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-300 text-black rounded-full flex items-center justify-center font-600">
              1
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>Real & Fictional Authors.</strong> We celebrate both historical figures and beloved fictional 
                characters, giving equal weight to the wisdom they share through their quotes.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-300 text-black rounded-full flex items-center justify-center font-600">
              2
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>Rich Author Profiles.</strong> Each author comes with detailed information including 
                their profession, life dates, description, and all their attributed quotes in one place.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-300 text-black rounded-full flex items-center justify-center font-600">
              3
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>Community-Driven.</strong> Authors are created organically as users submit quotes, 
                ensuring our collection grows naturally with the most quoted and beloved figures.
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6 items-center">
          <div v-for="i in 9" :key="i" class="w-1 h-1 bg-black dark:bg-gray-2 rounded-full"></div>
        </div>

        <div class="mt-12 font-subtitle font-400 text-size-12 text-center">
          Start exploring authors by submitting your first quote.
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
// Props
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

// Emits
const emit = defineEmits(['openSubmitModal'])
</script>
