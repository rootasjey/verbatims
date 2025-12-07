<template>
  <div class="px-8 font-serif">
    <!-- Empty State (when no references) -->
    <div class="text-center py-16 mb-16">
      <div class="max-w-2xl mx-auto">
        <NIcon name="i-ph-books" class="w-16 h-16 text-primary-500 mx-auto mb-6" />
        <h2 class="text-3xl font-600 line-height-none mb-4">
          {{ searchQuery ? 'No references found' : 'No references yet' }}
        </h2>
        <p class="text-gray-600 dark:text-gray-400 text-lg mb-8">
          {{ searchQuery 
            ? `No references match "${searchQuery}". Try a different search term or submit a quote to create new references.`
            : 'Start building your references collection by submitting quotes with source attribution.'
          }}
        </p>
        <NButton
          @click="$emit('openSubmitModal')"
          size="lg"
          icon
          label="i-ph-plus"
          class="px-8 py-4"
        >
          Submit Your First Quote
        </NButton>
      </div>
    </div>

    <!-- Features Bento Grid for References -->
    <div class="mb-20">
      <ReferencesEmptyBentoGrid />
    </div>

    <!-- References Information Section -->
    <div class="max-w-3xl mx-auto mt-42 mb-16">
      <div class="text-center mb-8 border-b b-dashed pb-8">
        <NIcon name="i-ph-book-open-text" class="w-12 h-12 text-blue-500 mx-auto mb-4" />
        <h2 class="font-subtitle text-3xl font-600 line-height-none mb-2">Explore Quote Sources</h2>
        <p class="font-sans text-gray-600 dark:text-gray-400 text-lg">
          From classic literature to modern media, discover the sources behind the most memorable quotes.
        </p>
      </div>

      <div class="font-body font-400 text-size-8 text-center prose prose-gray dark:prose-invert">
        <p class="leading-relaxed">
          References are the sources that give context and meaning to quotes. Whether they're <i class="color-blue-6">timeless books</i> 
          that have influenced generations, <i class="color-red-6">iconic films</i> that captured our imagination, 
          or <i class="color-purple-6">TV series</i> that became cultural phenomena, each reference adds depth to our understanding.
        </p>

        <p>...</p>
        <p class="leading-relaxed mb-6">
          What makes our references collection special:
        </p>

        <div class="font-body font-400 text-size-5 rounded-lg p-6 mb-6">
          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-300 text-black rounded-full flex items-center justify-center font-600">
              1
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>Diverse Media Types.</strong> We catalog quotes from books, films, TV shows, music, speeches, 
                podcasts, and more, creating a comprehensive source library.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4 mb-4">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-300 text-black rounded-full flex items-center justify-center font-600">
              2
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>Rich Metadata.</strong> Each reference includes detailed information like release dates, 
                descriptions, genres, and all associated quotes in one organized place.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-4">
            <div class="flex-shrink-0 w-8 h-8 bg-blue-300 text-black rounded-full flex items-center justify-center font-600">
              3
            </div>
            <div>
              <p class="leading-relaxed">
                <strong>Community-Curated.</strong> References are created organically as users submit quotes, 
                ensuring our collection reflects the most quoted and beloved sources.
              </p>
            </div>
          </div>
        </div>

        <div class="flex flex-col gap-6 items-center">
          <div v-for="i in 9" :key="i" class="w-1 h-1 bg-black dark:bg-gray-2 rounded-full"></div>
        </div>

        <div class="mt-12 font-subtitle font-400 text-size-12 text-center">
          Start exploring references by submitting your first quote.
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
