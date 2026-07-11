<template>
  <div class="px-8 py-6 sm:py-12">
    <div class="max-w-xl mx-auto text-center">
      <p v-if="searchQuery" class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        {{ $t('tags.empty_view.no_match') }}
      </p>
      <p v-else class="font-serif text-3xl sm:text-4xl text-gray-900 dark:text-gray-100 leading-tight">
        {{ $t('tags.empty_view.no_tags') }}
      </p>

      <p class="font-sans text-lg text-gray-500 dark:text-gray-400 mt-3">
        {{ searchQuery ? $t('tags.empty_view.no_results_for', { query: searchQuery }) : $t('tags.empty_view.empty_description') }}
      </p>

      <div v-if="searchQuery" class="mt-8">
        <NButton
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          {{ $t('tags.empty_view.clear_search') }}
        </NButton>
      </div>

      <template v-else>
        <div class="mt-6">
          <NButton
            leading="i-ph-plus-circle"
            btn="light:soft-secondary dark:soft-blue"
            class="hover:scale-102 active:scale-99 transition-[transform] duration-150"
            @click="$emit('createTag')"
          >
            {{ $t('tags.empty_view.create_tag') }}
          </NButton>
        </div>
      </template>
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

defineEmits(['clearFilters', 'createTag'])
</script>
