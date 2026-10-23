<template>
  <div class="px-2 py-10 sm:px-6 sm:py-14">
    <div class="mx-auto max-w-xl text-center">
      <p v-if="searchQuery" class="font-serif text-3xl leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
        {{ $ts('tags_empty_no_match') }}
      </p>
      <p v-else class="font-serif text-3xl leading-tight text-gray-900 dark:text-gray-100 sm:text-4xl">
        {{ $ts('tags_empty_no_tags') }}
      </p>

      <p class="mt-3 font-sans text-base leading-relaxed text-gray-600 dark:text-gray-400 sm:text-lg">
        {{ searchQuery ? $ts('tags_empty_no_results_for', { query: searchQuery }) : $ts('tags_empty_description') }}
      </p>

      <div v-if="searchQuery" class="mt-7">
        <NButton
          leading="i-ph-funnel-simple-x"
          btn="soft-gray"
          @click="$emit('clearFilters')"
        >
          {{ $ts('tags_empty_clear_search') }}
        </NButton>
      </div>

      <template v-else>
        <div class="mt-7">
          <NButton
            leading="i-ph-plus-circle"
            btn="light:soft-gray dark:soft-blue"
            class="hover:scale-102 active:scale-99 transition-[transform] duration-150"
            @click="$emit('createTag')"
          >
            {{ $ts('tags_empty_create_tag') }}
          </NButton>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
const { $ts } = useI18n()

const props = defineProps({
  searchQuery: {
    type: String,
    default: ''
  }
})

defineEmits(['clearFilters', 'createTag'])
</script>
