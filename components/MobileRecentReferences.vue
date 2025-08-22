<template>
  <div class="px-6 py-6">
    <div class="flex items-center justify-between mb-4">
      <h2 class="text-lg font-body font-200 text-gray-900 dark:text-white">
        recent references
      </h2>
      <UButton
        icon
        btn="ghost-gray"
        label="i-ph-dots-three-bold"
        size="sm"
        @click="showMoreReferences"
      />
    </div>

    <div class="grid grid-cols-2 gap-3">
      <ReferenceCard
        v-for="reference in recentReferences"
        :key="reference.id"
        :reference="reference"
        @click="navigateToReference(reference.id)"
      />
    </div>

    <div v-if="loading" class="grid grid-cols-2 gap-3">
      <div
        v-for="i in 6"
        :key="i"
        class="w-full h-32 rounded-2xl bg-gray-200 dark:bg-gray-700 animate-pulse"
      ></div>
    </div>

    <div v-else-if="!recentReferences.length" class="text-center py-8">
      <UIcon name="i-ph-books" class="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
      <p class="text-sm text-gray-500 dark:text-gray-400">
        No recent references yet
      </p>
      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
        Submit quotes to see references here
      </p>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { QuoteReference } from '~/types';

const recentReferences = ref<QuoteReference[]>([])
const loading = ref(true)

const emit = defineEmits<{
  showMore: []
}>()

const navigateToReference = (referenceId: number) => {
  navigateTo(`/references/${referenceId}`)
}

const showMoreReferences = () => {
  emit('showMore')
}

const fetchRecentReferences = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/references', {
      query: {
        limit: 4,
        sort_by: 'created_at',
        sort_order: 'DESC'
      }
    })
    
    if (response.success) {
      recentReferences.value = response.data || []
    }
  } catch (error) {
    console.error('Failed to fetch recent references:', error)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  fetchRecentReferences()
})
</script>
