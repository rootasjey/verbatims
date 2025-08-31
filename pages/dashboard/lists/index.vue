<template>
  <div class="min-h-screen">
    <!-- Mobile: Collections List -->
    <div v-if="isMobile" class="mobile-collections-page">
      <!-- Header & Controls -->
      <div class="p-4 pt-6">
        <div class="text-center mb-4">
          <h1 class="text-2xl font-600 text-gray-900 dark:text-white">Your Collections</h1>
          <p class="text-gray-600 dark:text-gray-400">Lists you created to organize quotes</p>
        </div>

        <div class="flex gap-3">
          <UInput
            v-model="searchQuery"
            placeholder="Search your lists..."
            leading="i-ph-magnifying-glass"
            size="md"
            class="flex-1"
          />
          <USelect
            v-model="visibilityFilter"
            :items="visibilityOptions"
            placeholder="Visibility"
            size="sm"
            item-key="label"
            value-key="label"
            class="w-40"
          />
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="flex items-center justify-center py-12">
        <div class="flex items-center gap-3">
          <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-500"></div>
          <span class="text-gray-600 dark:text-gray-400">Loading...</span>
        </div>
      </div>

      <!-- Empty -->
      <div v-else-if="filteredCollections.length === 0" class="text-center py-16 px-4">
        <UIcon name="i-ph-bookmark" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching lists' : 'No lists yet' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Create a list from any quote by tapping \'Add to collection\'.' }}
        </p>
        <UButton v-if="!searchQuery" btn="solid-black" @click="showCreateModal = true">
          <UIcon name="i-ph-plus" />
          Create List
        </UButton>
      </div>

      <!-- Results -->
      <div v-else class="px-0 pb-6">
        <div class="px-4 pb-2 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredCollections.length }} {{ filteredCollections.length === 1 ? 'list' : 'lists' }}
        </div>

        <div class="divide-y divide-dashed divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-900">
          <button
            v-for="collection in filteredCollections"
            :key="collection.id"
            class="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
            @click="navigateToCollection(collection)"
          >
            <div class="flex items-start justify-between">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <UIcon name="i-ph-bookmark-simple" class="w-5 h-5 text-blue-500" />
                  <h3 class="font-600 text-gray-900 dark:text-white truncate">{{ collection.name }}</h3>
                </div>
                <p v-if="collection.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-1">
                  {{ collection.description }}
                </p>
                <div class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  {{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? 'quote' : 'quotes' }} · Updated {{ formatDate(collection.updated_at) }}
                </div>
              </div>
              <div class="flex items-center gap-2 pl-3">
                <UBadge :color="collection.is_public ? 'green' : 'gray'" variant="subtle" size="xs">
                  {{ collection.is_public ? 'Public' : 'Private' }}
                </UBadge>
                <UIcon name="i-ph-caret-right" class="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </button>
        </div>

        <div v-if="hasMore" class="px-4 pt-6">
          <UButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </UButton>
        </div>
      </div>
    </div>

    <!-- Desktop: Dashboard Lists -->
    <div v-else>
      <!-- Search and Filters -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search your lists..."
            leading="i-ph-magnifying-glass"
            size="md"
          />
        </div>
        <div class="w-full sm:w-48">
          <USelect
            v-model="visibilityFilter"
            :items="visibilityOptions"
            placeholder="Filter by visibility"
            size="sm"
            item-key="label"
            value-key="label"
          />
        </div>

        <div class="flex items-center justify-end">
          <UButton
            size="sm"
            btn="solid-dark dark:solid-white"
            @click="showCreateModal = true"
          >
            <UIcon name="i-ph-plus" />
            Create List
          </UButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <UIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredCollections.length === 0 && !loading" class="text-center py-16">
        <UIcon name="i-ph-bookmark" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching lists' : 'No lists yet' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Create your first list to organize your favorite quotes.' }}
        </p>
        <UButton v-if="!searchQuery" btn="solid-black" @click="showCreateModal = true">
          <UIcon name="i-ph-plus" />
          <span>Create Your First List</span>
        </UButton>
      </div>

      <!-- Collections Grid -->
      <div v-else class="space-y-6">
        <!-- Results Count -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ filteredCollections.length }} {{ filteredCollections.length === 1 ? 'list' : 'lists' }}
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <UCard
            v-for="collection in filteredCollections"
            :key="collection.id"
            class="hover:shadow-lg transition-shadow cursor-pointer border-dashed"
            @click="navigateToCollection(collection)"
          >
            <template #header>
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-1">
                    {{ collection.name }}
                  </h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {{ collection.quotes_count }} {{ collection.quotes_count === 1 ? 'quote' : 'quotes' }}
                  </p>
                </div>
                <div class="flex items-center space-x-2">
                  <UBadge
                    :color="collection.is_public ? 'green' : 'gray'"
                    variant="subtle"
                    size="xs"
                  >
                    {{ collection.is_public ? 'Public' : 'Private' }}
                  </UBadge>
                  <UDropdownMenu :items="getCollectionActions(collection)">
                    <UButton
                      icon
                      btn="ghost"
                      size="xs"
                      label="i-ph-dots-three-vertical"
                      @click.stop
                    />
                  </UDropdownMenu>
                </div>
              </div>
            </template>

            <div class="space-y-3">
              <p v-if="collection.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                {{ collection.description }}
              </p>
              
              <!-- Preview quotes -->
              <div v-if="collection.preview_quotes?.length" class="space-y-2">
                <div
                  v-for="quote in collection.preview_quotes.slice(0, 2)"
                  :key="quote.id"
                  class="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 italic"
                >
                  "{{ quote.name }}"
                </div>
              </div>
              
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Updated {{ formatDate(collection.updated_at) }}</span>
                <span v-if="collection.is_public">
                  {{ collection.views_count || 0 }} views
                </span>
              </div>
            </div>
          </UCard>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="text-center pt-8">
          <UButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </UButton>
        </div>
      </div>
    </div>

    <!-- Create Collection Modal -->
    <CreateCollectionModal
      v-model="showCreateModal"
      @created="handleCollectionCreated"
    />

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      v-if="selectedCollection"
      v-model="showEditModal"
      :collection="selectedCollection"
      @updated="handleCollectionUpdated"
    />

    <!-- Delete Confirmation -->
    <UDialog v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete List</h3>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete "{{ selectedCollection?.name }}"? This action cannot be undone.
        </p>
        
        <template #footer>
          <div class="flex justify-end space-x-3">
            <UButton btn="outline" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="deleting"
              @click="deleteCollection"
            >
              Delete
            </UButton>
          </div>
        </template>
      </UCard>
    </UDialog>
  </div>
</template>

<script setup lang="ts">
import type { CollectionWithStats } from '~/types/user-interactions'
const { isMobile } = useMobileDetection()
const { currentLayout } = useLayoutSwitching()

// Extended interface for dashboard collections with additional fields
interface DashboardCollection extends CollectionWithStats {
  preview_quotes?: Array<{ id: number; name: string; author?: { name: string } }>
  views_count?: number
}

definePageMeta({
  layout: false,
  middleware: 'auth'
})

useHead({
  title: 'Lists - Dashboard - Verbatims'
})

const loading = ref(true)
const loadingMore = ref(false)
const deleting = ref(false)
const collections = ref<DashboardCollection[]>([])
const searchQuery = ref('')
const visibilityFilter = ref({ label: 'All Lists', value: 'all' })
const hasMore = ref(false)
const currentPage = ref(1)

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedCollection = ref<DashboardCollection | null>(null)

const visibilityOptions = [
  { label: 'All Lists', value: 'all' },
  { label: 'Public Only', value: 'public' },
  { label: 'Private Only', value: 'private' }
]

const filteredCollections = computed(() => {
  let filtered = [...collections.value]
  
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(collection => 
      collection.name.toLowerCase().includes(query) ||
      collection.description?.toLowerCase().includes(query)
    )
  }
  
  if (visibilityFilter.value.value !== 'all') {
    filtered = filtered.filter(collection => 
      visibilityFilter.value.value === 'public' ? collection.is_public : !collection.is_public
    )
  }
  
  return filtered
})

const loadCollections = async (page = 1) => {
  try {
    const response = await $fetch('/api/dashboard/collections', {
      query: { page, limit: 12 }
    })
    
    if (page === 1) {
      collections.value = (response.data?.results || []) as unknown as DashboardCollection[]
    } else {
      collections.value.push(...((response.data?.results || []) as unknown as DashboardCollection[]))
    }

    hasMore.value = response.pagination?.hasMore || false
    currentPage.value = page
  } catch (error) {
    console.error('Failed to load collections:', error)
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const loadMore = async () => {
  loadingMore.value = true
  await loadCollections(currentPage.value + 1)
}

const navigateToCollection = (collection: DashboardCollection) => {
  navigateTo(`/dashboard/lists/${collection.id}`)
}

const getCollectionActions = (collection: DashboardCollection) => [
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => editCollection(collection)
  },
  {
    label: 'Delete',
    leading: 'i-ph-trash',
    onclick: () => confirmDelete(collection)
  },
]

const editCollection = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  showEditModal.value = true
}

const confirmDelete = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  showDeleteModal.value = true
}

const deleteCollection = async () => {
  if (!selectedCollection.value) return

  deleting.value = true
  try {
    await $fetch(`/api/collections/${selectedCollection.value.id}`, {
      method: 'DELETE'
    } as any)

    collections.value = collections.value.filter(c => c.id !== selectedCollection.value?.id)
    showDeleteModal.value = false
    selectedCollection.value = null
  } catch (error) {
    console.error('Failed to delete collection:', error)
  } finally {
    deleting.value = false
  }
}

const handleCollectionCreated = (newCollection: DashboardCollection) => {
  collections.value.unshift(newCollection)
  showCreateModal.value = false
}

const handleCollectionUpdated = (updatedCollection: DashboardCollection) => {
  const index = collections.value.findIndex(c => c.id === updatedCollection.id)
  if (index !== -1) {
    collections.value[index] = updatedCollection
  }
  showEditModal.value = false
  selectedCollection.value = null
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadCollections()
})

watch(currentLayout, (newLayout) => setPageLayout(newLayout))
</script>

<style scoped>
.line-clamp-1 {
  display: -webkit-box;
  line-clamp: 1;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  line-clamp: 2;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.mobile-collections-page {
  min-height: calc(100vh - 80px);
}
</style>
