<template>
  <div class="px-8 py-6 sm:py-12">
    <div class="max-w-xl mx-auto text-center">
      <p v-if="searchQuery" class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        No tags match
      </p>
      <p v-else class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        No tags yet.
      </p>

      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
        {{ searchQuery ? `No results for &ldquo;${searchQuery}&rdquo;.` : 'Tags organize quotes by topic. Create one or submit a quote with tags. They also appear once quotes are submitted and categorized.' }}
      </p>

      <div v-if="searchQuery" class="mt-8">
        <NButton
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          Clear search
        </NButton>
      </div>

      <template v-else>
        <div class="mt-6">
          <NButton
            leading="i-ph-plus-circle"
            btn="soft-secondary"
            @click="$emit('createTag')"
          >
            Create a tag
          </NButton>
        </div>
      </template>
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

defineEmits(['clearFilters', 'createTag'])
</script>
