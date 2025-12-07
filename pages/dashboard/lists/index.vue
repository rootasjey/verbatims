<template>
  <div class="min-h-screen">
    <!-- Mobile: Collections List -->
    <div v-if="isMobile" class="mobile-collections-page bg-gray-50 dark:bg-[#0A0805] min-h-screen pb-24">
      <!-- Header with collapse on scroll -->
      <div 
        class="sticky top-10 z-10 bg-white dark:bg-[#0F0D0B] border-b rounded-6 border-gray-100 dark:border-gray-800 transition-all duration-300 ease-in-out"
        :class="{ 'shadow-sm': !showHeaderElements }"
      >
        <div class="px-4 transition-all duration-300 ease-in-out" :class="showHeaderElements ? 'py-5' : 'py-3'">
          <div class="mt-4 transition-all duration-300 ease-in-out" :class="{ 'mb-2': showHeaderElements }">
            <h1 
              class="overflow-hidden font-sans text-gray-900 dark:text-white transition-all duration-300 ease-in-out"
              :class="showHeaderElements ? 'text-4xl font-600' : 'text-2xl font-600'"
            >
              Collections
            </h1>
          </div>

          <!-- Search Bar with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'mb-3 max-h-20 opacity-100' : 'max-h-0 opacity-0 mb-0'"
          >
            <NInput
              v-model="searchQuery"
              :placeholder="`Search among ${filteredCollections.length} ${filteredCollections.length === 1 ? 'list' : 'lists'}...`"
              leading="i-ph-magnifying-glass"
              size="lg"
              class="w-full"
              rounded="4"
              :trailing="searchQuery ? 'i-ph-x' : undefined"
              :una="{ inputTrailing: 'pointer-events-auto cursor-pointer' }"
              @trailing="searchQuery = ''"
            />
          </div>

          <!-- Filter Chips with collapse animation -->
          <div 
            class="transition-all duration-300 ease-in-out overflow-hidden"
            :class="showHeaderElements ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'"
          >
            <div class="flex items-center gap-2 overflow-x-auto py-2 px-1 scrollbar-hide">
              <NBadge
                :badge="visibilityFilter.value === 'all' ? 'solid-blue' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="visibilityFilter = { label: 'All Lists', value: 'all' }"
              >
                <NIcon name="i-ph-list" class="w-3 h-3 mr-1.5" />
                All
              </NBadge>
              <NBadge
                :badge="visibilityFilter.value === 'public' ? 'soft-green' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="visibilityFilter = { label: 'Public Only', value: 'public' }"
              >
                <NIcon name="i-ph-globe" class="w-3 h-3 mr-1.5" />
                Public
              </NBadge>
              <NBadge
                :badge="visibilityFilter.value === 'private' ? 'soft-pink' : 'outline-gray'"
                class="cursor-pointer whitespace-nowrap px-3 py-1.5 text-xs font-500 rounded-full transition-all hover:shadow-sm active:scale-95"
                @click="visibilityFilter = { label: 'Private Only', value: 'private' }"
              >
                <NIcon name="i-ph-lock" class="w-3 h-3 mr-1.5" />
                Private
              </NBadge>
            </div>
          </div>
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
        <NIcon name="i-ph-bookmark" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-600 text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching lists' : 'No lists yet' }}
        </h3>
        <p class="text-gray-600 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Create a list from any quote by tapping \'Add to collection\'.' }}
        </p>
        <NButton v-if="!searchQuery" btn="solid-black" @click="showCreateModal = true">
          <NIcon name="i-ph-plus" />
          Create List
        </NButton>
      </div>

      <!-- Results -->
      <div v-else class="px-3 pt-3 pb-6 space-y-3">
        <div class="px-1 pb-2 text-sm text-gray-500 dark:text-gray-400">
          {{ filteredCollections.length }} {{ filteredCollections.length === 1 ? 'list' : 'lists' }}
        </div>

        <div class="space-y-3">
          <div
            v-for="collection in filteredCollections"
            :key="collection.id"
            class="group dark:bg-[#0F0D0B] rounded-2
              border border-gray-200 b-dashed dark:border-gray-800 p-4 transition-all duration-200 hover:shadow-md select-none cursor-pointer"
            @click="navigateToCollection(collection)"
            @contextmenu.prevent="handleCollectionLongPress(collection)"
          >
            <div class="flex items-start gap-3">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2 mb-1">
                  <h3 class="font-sans text-size-5 font-400 text-gray-900 dark:text-white truncate line-height-tight">{{ collection.name }}</h3>
                </div>
                <p v-if="collection.description" class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 mb-2">
                  {{ collection.description }}
                </p>
                <div class="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                  <NBadge :badge="collection.is_public ? 'outline-green' : 'outline-red'" size="xs">
                    <NIcon :name="collection.is_public ? 'i-ph-eye-duotone' : 'i-ph-lock-duotone'" />
                  </NBadge>
                  <span>{{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
                  <span>·</span>
                  <span>Updated {{ formatDate(collection.updated_at) }}</span>
                </div>
              </div>
              
              <div class="flex items-center gap-2 flex-shrink-0 -mt-1">
                <NDropdownMenu :items="getMobileCollectionActions(collection)">
                  <NButton
                    icon
                    btn="ghost"
                    size="sm"
                    label="i-ph-dots-three-vertical"
                    class="opacity-0 group-hover:opacity-100 transition-opacity"
                    @click.stop
                  />
                </NDropdownMenu>
              </div>
            </div>
          </div>
        </div>

        <div v-if="hasMore" class="px-4 pt-6">
          <NButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </NButton>
        </div>
      </div>
    </div>

    <!-- Desktop: Dashboard Lists -->
    <div v-else>
      <!-- Search and Filters -->
      <div class="mb-6 flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <NInput
            v-model="searchQuery"
            placeholder="Search your lists..."
            leading="i-ph-magnifying-glass"
            size="md"
          />
        </div>
        <div class="w-full sm:w-48">
          <NSelect
            v-model="visibilityFilter"
            :items="visibilityOptions"
            placeholder="Filter by visibility"
            size="sm"
            item-key="label"
            value-key="label"
          />
        </div>

        <div class="flex items-center justify-end">
          <NButton
            size="sm"
            btn="solid-dark dark:solid-white"
            @click="showCreateModal = true"
          >
            <NIcon name="i-ph-plus" />
            Create List
          </NButton>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="loading" class="flex justify-center py-12">
        <NIcon name="i-ph-spinner" class="w-8 h-8 animate-spin text-gray-400" />
      </div>

      <!-- Empty State -->
      <div v-else-if="filteredCollections.length === 0 && !loading" class="text-center py-16">
        <NIcon name="i-ph-bookmark" class="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
          {{ searchQuery ? 'No matching lists' : 'No lists yet' }}
        </h3>
        <p class="text-gray-500 dark:text-gray-400 mb-6">
          {{ searchQuery ? 'Try adjusting your search terms.' : 'Create your first list to organize your favorite quotes.' }}
        </p>
        <NButton v-if="!searchQuery" btn="solid-black" @click="showCreateModal = true">
          <NIcon name="i-ph-plus" />
          <span>Create Your First List</span>
        </NButton>
      </div>

      <!-- Collections Grid -->
      <div v-else class="space-y-6">
        <!-- Results Count -->
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {{ filteredCollections.length }} {{ filteredCollections.length === 1 ? 'list' : 'lists' }}
        </div>

        <!-- Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <NCard
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
                  <NBadge
                    :badge="collection.is_public ? 'outline-green' : 'outline-red'"
                    size="xs"
                  >
                    {{ collection.is_public ? 'Public' : 'Private' }}
                  </NBadge>
                  <NDropdownMenu :items="getCollectionActions(collection)">
                    <NButton
                      icon
                      btn="ghost"
                      size="xs"
                      label="i-ph-dots-three-vertical"
                      @click.stop
                    />
                  </NDropdownMenu>
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
          </NCard>
        </div>

        <!-- Load More -->
        <div v-if="hasMore" class="text-center pt-8">
          <NButton
            :loading="loadingMore"
            btn="dark:solid-black"
            size="md"
            class="w-full hover:scale-101 active:scale-99 transition-transform duration-300 ease-in-out"
            @click="loadMore"
          >
            Load More
          </NButton>
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
    <NDialog v-model="showDeleteModal">
      <NCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete List</h3>
        </template>
        
        <p class="text-gray-600 dark:text-gray-400 mb-4">
          Are you sure you want to delete "{{ selectedCollection?.name }}"? This action cannot be undone.
        </p>
        
        <template #footer>
          <div class="flex justify-end space-x-3">
            <NButton btn="outline" @click="showDeleteModal = false">
              Cancel
            </NButton>
            <NButton
              color="red"
              :loading="deleting"
              @click="deleteCollection"
            >
              Delete
            </NButton>
          </div>
        </template>
      </NCard>
    </NDialog>

    <!-- Collection Actions Drawer (Mobile) -->
    <CollectionActionsDrawer
      v-model:open="showActionsDrawer"
      :collection="selectedCollection"
      @view="handleViewFromDrawer"
      @edit="handleEditFromDrawer"
      @delete="handleDeleteFromDrawer"
    />
  </div>
</template><script setup lang="ts">
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
const showActionsDrawer = ref(false)
const selectedCollection = ref<DashboardCollection | null>(null)

// Scroll header state (mobile)
const scrollY = ref(0)
const lastScrollY = ref(0)
const isScrollingDown = ref(false)
const showHeaderElements = ref(true)

const handleScroll = () => {
  if (!isMobile.value) return
  scrollY.value = window.scrollY
  const scrollThreshold = 50
  if (scrollY.value > lastScrollY.value && scrollY.value > scrollThreshold) {
    isScrollingDown.value = true
    showHeaderElements.value = false
  } else if (scrollY.value < lastScrollY.value || scrollY.value <= scrollThreshold) {
    isScrollingDown.value = false
    showHeaderElements.value = true
  }
  lastScrollY.value = scrollY.value
}

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

const getMobileCollectionActions = (collection: DashboardCollection) => [
  {
    label: 'View',
    leading: 'i-ph-eye',
    onclick: () => navigateToCollection(collection)
  },
  {
    label: 'Edit',
    leading: 'i-ph-pencil',
    onclick: () => editCollection(collection)
  },
  {}, // divider
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

// Context menu handler
const handleCollectionLongPress = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  showActionsDrawer.value = true
}

// Drawer action handlers
const handleViewFromDrawer = () => {
  if (selectedCollection.value) {
    navigateToCollection(selectedCollection.value)
  }
}

const handleEditFromDrawer = () => {
  showEditModal.value = true
}

const handleDeleteFromDrawer = () => {
  showDeleteModal.value = true
}

onMounted(() => {
  setPageLayout(currentLayout.value)
  loadCollections()
  if (isMobile.value) {
    window.addEventListener('scroll', handleScroll, { passive: true })
  }
})

watch(currentLayout, (newLayout) => setPageLayout(newLayout))

onBeforeUnmount(() => {
  if (isMobile.value) {
    window.removeEventListener('scroll', handleScroll)
  }
})
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
