<template>
  <div class="px-8 py-6 sm:py-12">
    <div class="max-w-xl mx-auto text-center">
      <p v-if="searchQuery" class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        {{ $t('authors.empty_view.no_match') }}
      </p>
      <p v-else class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        {{ $t('authors.empty_view.no_authors') }}
      </p>

      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
        {{ searchQuery ? $t('authors.empty_view.no_results_for', { query: searchQuery }) : $t('authors.empty_view.empty_description') }}
      </p>

      <div class="mt-8 flex flex-wrap items-center justify-center gap-3">
        <NButton
          v-if="searchQuery"
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          {{ $t('authors.empty_view.clear_filters') }}
        </NButton>

        <NButton
          btn="light:soft-secondary dark:soft-blue"
          leading="i-ph-plus-circle"
          class="hover:scale-102 active:scale-99 transition-[transform] duration-150"
          @click="$emit('openSubmitAuthor')"
        >
          {{ $t('authors.empty_view.submit_author') }}
        </NButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $t } = useI18n()

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

defineEmits(['openSubmitAuthor', 'clearFilters'])
</script>
