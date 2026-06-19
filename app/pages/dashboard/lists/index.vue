<template>
  <div>
    <!-- Header -->
    <div class="pb-6 mb-6 border-b border-gray-300 dark:border-gray-700">
      <div class="flex items-start justify-between gap-4">
        <div>
          <h1 class="font-serif text-3xl md:text-4xl font-200 text-gray-900 dark:text-gray-100">
            Lists
          </h1>
          <p class="font-sans text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ filteredCollections.length }} {{ filteredCollections.length === 1 ? 'list' : 'lists' }}
          </p>
        </div>
        <div class="hidden md:flex items-center gap-4">
          <input
            v-model="searchQuery"
            type="text"
            placeholder="Search lists..."
            class="font-sans text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1.6 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none w-48"
          />
          <select
            v-model="visibilityValue"
            class="font-sans text-sm bg-gray-100 dark:bg-gray-800 px-2 py-1.6 text-gray-700 dark:text-gray-300 cursor-pointer"
          >
            <option v-for="opt in visibilityOptions" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
          </select>
          <button
            @click="openCreateModal"
            class="font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm whitespace-nowrap"
          >
            + Create List
          </button>
        </div>
      </div>
      <div class="md:hidden mt-4 space-y-3">
        <input
          v-model="searchQuery"
          type="text"
          placeholder="Search lists..."
          class="w-full font-sans text-sm bg-transparent border-b border-dashed border-gray-300 dark:border-gray-600 px-2 py-1.5 text-gray-700 dark:text-gray-300 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-500 dark:focus:border-gray-400"
        />
        <div class="flex items-center gap-4">
          <button
            v-for="opt in visibilityOptions"
            :key="opt.value"
            @click="visibilityValue = opt.value"
            class="font-sans text-xs uppercase tracking-wider transition-colors"
            :class="visibilityValue === opt.value ? 'text-gray-900 dark:text-gray-100 font-600' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-400'"
          >
            {{ opt.label }}
          </button>
        </div>
      </div>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="divide-y divide-gray-100 dark:divide-gray-800">
      <div v-for="i in 5" :key="i" class="animate-pulse py-5">
        <div class="h-5 bg-gray-100 dark:bg-gray-800 rounded w-1/3 mb-3" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-2/3 mb-2" />
        <div class="h-3 bg-gray-100 dark:bg-gray-800 rounded w-1/4" />
      </div>
    </div>

    <!-- Empty -->
    <div v-else-if="filteredCollections.length === 0" class="py-16 text-center">
      <p class="font-serif text-2xl font-200 text-gray-400 dark:text-gray-500 mb-2">
        {{ searchQuery ? 'No matching lists' : 'No lists yet' }}
      </p>
      <p class="font-sans text-sm text-gray-500 dark:text-gray-400 mb-6">
        {{ searchQuery ? 'Try adjusting your search terms.' : 'Create a list from any quote by tapping "Add to collection".' }}
      </p>
      <button
        v-if="!searchQuery"
        @click="openCreateModal"
        class="inline-flex items-center gap-1.5 font-sans text-xs text-gray-700 dark:text-gray-300 border border-dashed border-gray-300 dark:border-gray-600 px-3 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors rounded-sm"
      >
        + Create List
      </button>
    </div>

    <!-- Feed -->
    <div v-else class="divide-y divide-gray-100 dark:divide-gray-800">
      <div
        v-for="(collection, idx) in filteredCollections"
        :key="collection.id"
        class="group py-5 first:pt-0 last:pb-0 cursor-pointer hover:bg-gray-50 dark:hover:bg-white/[0.02] -mx-2 px-2 rounded-sm transition-colors animate-fade-in-up"
        :style="{ animationDelay: `${idx * 0.05}s` }"
        @click="navigateToCollection(collection)"
        @contextmenu.prevent="handleCollectionLongPress(collection)"
      >
        <div class="flex items-start justify-between gap-4">
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-3 mb-1.5">
              <h3 class="font-serif text-lg font-600 text-gray-900 dark:text-gray-100 truncate group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors">
                {{ collection.name }}
              </h3>
              <span
                v-if="collection.isPublic"
                class="font-sans text-xs text-green-600 dark:text-green-400 flex-shrink-0"
              >
                Public
              </span>
              <span
                v-else
                class="font-sans text-xs text-gray-400 dark:text-gray-500 flex-shrink-0"
              >
                Private
              </span>
            </div>

            <p v-if="collection.description" class="font-sans text-sm text-gray-500 dark:text-gray-400 line-clamp-1 mb-2 leading-relaxed">
              {{ collection.description }}
            </p>

            <div v-if="collection.preview_quotes?.length" class="space-y-0.5 mb-2">
              <div
                v-for="quote in collection.preview_quotes.slice(0, 2)"
                :key="quote.id"
                class="font-body text-xs text-gray-400 dark:text-gray-500 italic line-clamp-1"
              >
                &ldquo;{{ quote.name }}&rdquo;
              </div>
            </div>

            <div class="flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
              <span>{{ collection.quotes_count || 0 }} {{ (collection.quotes_count || 0) === 1 ? 'quote' : 'quotes' }}</span>
              <span class="text-gray-200 dark:text-gray-700">·</span>
              <span>Created {{ formatDate(collection.createdAt) }}</span>
              <span class="text-gray-200 dark:text-gray-700">·</span>
              <span v-if="collection.updatedAt">Updated {{ formatDate(collection.updatedAt) }}</span>
            </div>
          </div>

          <div class="hidden md:flex items-center gap-2 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
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
      </div>
    </div>

    <!-- Load More -->
    <div v-if="hasMore" class="text-center pt-6">
      <button
        :disabled="loadingMore"
        class="font-sans text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors border-b border-dashed border-gray-300 dark:border-gray-600 pb-0.5 disabled:opacity-50"
        @click="loadMore"
      >
        {{ loadingMore ? 'Loading...' : 'Load More' }}
      </button>
    </div>

    <!-- Create / Edit Collection Modal -->
    <CollectionFormModal
      :key="formModalKey"
      v-model="showFormModal"
      :collection="selectedCollection"
      @saved="handleCollectionSaved"
    />

    <!-- Client-only modals (SSR incompatible due to reka-ui) -->
    <ClientOnly>
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
              <NButton btn="outline" @click="showDeleteModal = false">Cancel</NButton>
              <NButton color="red" :loading="deleting" @click="deleteCollection">Delete</NButton>
            </div>
          </template>
        </NCard>
      </NDialog>

      <CollectionActionsDrawer
        v-model:open="showActionsDrawer"
        :collection="selectedCollection"
        @view="handleViewFromDrawer"
        @edit="handleEditFromDrawer"
        @delete="handleDeleteFromDrawer"
      />
    </ClientOnly>
  </div>
</template>

<script setup lang="ts">
import { formatDate } from '~/utils/time-formatter'

// Extended interface for dashboard collections with additional fields
interface DashboardCollection extends CollectionWithStats {
  preview_quotes?: Array<{ id: number; name: string; author?: { name: string } }>
  views_count?: number
  // Drizzle returns camelCase for JS property names even when SQL columns are snake_case
  isPublic?: boolean
  createdAt?: string
  updatedAt?: string | null
  userId?: number
}

definePageMeta({
  layout: 'dashboard',
  middleware: 'auth'
})

useHead({
  title: 'Lists - Dashboard - Verbatims'
})

const pageHeader = usePageHeader()

onMounted(() => {
  pageHeader.setHeaderFromRoute()
})

const loading = ref(true)
const loadingMore = ref(false)
const deleting = ref(false)
const collections = ref<DashboardCollection[]>([])
const searchQuery = ref('')
const visibilityOptions = [
  { label: 'All Lists', value: 'all' },
  { label: 'Public Only', value: 'public' },
  { label: 'Private Only', value: 'private' }
]

const visibilityFilter = ref({ label: 'All Lists', value: 'all' })
const visibilityValue = ref('all')
const hasMore = ref(false)
const currentPage = ref(1)

watch(visibilityValue, (val) => {
  const option = visibilityOptions.find(o => o.value === val)
  if (option) visibilityFilter.value = option
})

const showFormModal = ref(false)
const formModalKey = ref(0)
const showDeleteModal = ref(false)
const showActionsDrawer = ref(false)
const selectedCollection = ref<DashboardCollection | null>(null)

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
      visibilityFilter.value.value === 'public' ? collection.isPublic : !collection.isPublic
    )
  }

  return filtered
})

const loadCollections = async (page = 1) => {
  try {
    const response = await $fetch<{
      success: boolean
      data: { results: DashboardCollection[] }
      pagination: { page: number; limit: number; total: number; hasMore: boolean; totalPages: number }
    }>('/api/dashboard/collections', {
      query: { page, limit: 12 }
    })

    if (page === 1) {
      collections.value = response.data?.results || []
    } else {
      collections.value.push(...(response.data?.results || []))
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

const openCreateModal = () => {
  selectedCollection.value = null
  showFormModal.value = true
}

const editCollection = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  formModalKey.value++
  showFormModal.value = true
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

const handleCollectionSaved = (collection: DashboardCollection) => {
  const index = collections.value.findIndex(c => c.id === collection.id)
  if (index !== -1) {
    collections.value[index] = collection
  } else {
    collections.value.unshift(collection)
  }
  showFormModal.value = false
  selectedCollection.value = null
}

const handleCollectionLongPress = (collection: DashboardCollection) => {
  selectedCollection.value = collection
  showActionsDrawer.value = true
}

const handleViewFromDrawer = () => {
  if (selectedCollection.value) {
    navigateToCollection(selectedCollection.value)
  }
}

const handleEditFromDrawer = () => {
  formModalKey.value++
  showFormModal.value = true
}

const handleDeleteFromDrawer = () => {
  showDeleteModal.value = true
}

onMounted(() => {
  loadCollections()
})
</script>

<style scoped>
@keyframes fade-in-up {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in-up {
  animation: fade-in-up 0.5s ease-out both;
}

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
</style>
