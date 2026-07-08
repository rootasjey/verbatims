<template>
  <div class="px-8 py-6 sm:py-12">
    <div class="max-w-xl mx-auto text-center">
      <p v-if="searchQuery" class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        No authors match
      </p>
      <p v-else class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        No authors yet.
      </p>

      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
        {{ searchQuery ? `No results for &ldquo;${searchQuery}&rdquo;.` : 'Every quote has a voice. Add one with proper attribution and help the collection grow.' }}
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NButton
          v-if="searchQuery"
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          Clear filters
        </NButton>

        <NButton
          btn="soft-secondary"
          leading="i-ph-plus-circle"
          class="hover:scale-105 active:scale-99 transition-[transform] duration-150"
          @click="$emit('openSubmitModal')"
        >
          Submit a quote
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

defineEmits(['openSubmitModal', 'clearFilters'])
</script>
