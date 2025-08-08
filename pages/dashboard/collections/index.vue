<template>
  <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    <!-- Header -->
    <div class="flex items-center justify-between mb-8">
      <div>
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
          My Collections
        </h1>
        <p class="mt-2 text-gray-600 dark:text-gray-400">
          Organize your favorite quotes into collections
        </p>
      </div>
      <UButton @click="showCreateModal = true">
        <UIcon name="i-ph-plus" />
        <span>Create Collection</span>
      </UButton>
    </div>

    <!-- Search and Filters -->
    <div class="mb-6">
      <div class="flex flex-col sm:flex-row gap-4">
        <div class="flex-1">
          <UInput
            v-model="searchQuery"
            placeholder="Search collections..."
            leading="i-ph-magnifying-glass"
            @input="debouncedSearch"
          />
        </div>
        <USelect
          v-model="visibilityFilter"
          :items="visibilityOptions"
          @change="loadCollections"
        />
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="loading" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div v-for="i in 6" :key="i" class="animate-pulse">
        <UCard>
          <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-4"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mb-2"></div>
          <div class="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div>
        </UCard>
      </div>
    </div>

    <!-- Collections Grid -->
    <div v-else-if="collections.length > 0" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <UCard
        v-for="collection in collections"
        :key="collection.id"
        class="hover:shadow-lg transition-shadow cursor-pointer"
        @click="navigateTo(`/dashboard/collections/${collection.id}`)"
      >
        <template #header>
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <h3 class="font-semibold text-gray-900 dark:text-white line-clamp-1">
                {{ collection.name }}
              </h3>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {{ collection.quotes_count }} quotes
              </p>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                v-if="collection.is_public"
                color="green"
                variant="subtle"
                size="xs"
              >
                Public
              </UBadge>
              <UDropdown :items="getCollectionActions(collection)">
                <UButton
                  variant="ghost"
                  size="sm"
                  icon
                  label="i-ph-dots-three-vertical"
                  @click.stop
                />
              </UDropdown>
            </div>
          </div>
        </template>

        <div v-if="collection.description" class="mb-4">
          <p class="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
            {{ collection.description }}
          </p>
        </div>

        <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
          <span>Updated {{ formatDate(collection.updated_at) }}</span>
          <span>Created {{ formatDate(collection.created_at) }}</span>
        </div>
      </UCard>
    </div>

    <!-- Empty State -->
    <div v-else class="text-center py-12">
      <UIcon name="i-ph-bookmark" class="h-16 w-16 text-gray-400 mx-auto mb-4" />
      <h3 class="text-lg font-medium text-gray-900 dark:text-white mb-2">
        No collections yet
      </h3>
      <p class="text-gray-500 dark:text-gray-400 mb-6">
        Create your first collection to organize your favorite quotes
      </p>
      <UButton @click="showCreateModal = true">
        <UIcon name="i-ph-plus" />
        <span>Create Your First Collection</span>
      </UButton>
    </div>

    <!-- Load More -->
    <div v-if="hasMore && !loading" class="text-center mt-8">
      <UButton
        variant="outline"
        :loading="loadingMore"
        @click="loadMore"
      >
        Load More Collections
      </UButton>
    </div>

    <!-- Create Collection Modal -->
    <CreateCollectionModal
      v-model="showCreateModal"
      @created="onCollectionCreated"
    />

    <!-- Edit Collection Modal -->
    <EditCollectionModal
      v-model="showEditModal"
      :collection="selectedCollection"
      @updated="onCollectionUpdated"
    />

    <!-- Delete Confirmation Modal -->
    <UModal v-model="showDeleteModal">
      <UCard>
        <template #header>
          <h3 class="text-lg font-semibold">Delete Collection</h3>
        </template>

        <p class="mb-4">
          Are you sure you want to delete "{{ selectedCollection?.name }}"? 
          This action cannot be undone.
        </p>

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton btn="ghost" @click="showDeleteModal = false">
              Cancel
            </UButton>
            <UButton
              color="red"
              :loading="deleting"
              @click="deleteCollection"
            >
              Delete Collection
            </UButton>
          </div>
        </template>
      </UCard>
    </UModal>
  </div>
</template>

<script setup>
definePageMeta({
  middleware: 'auth'
})

useHead({
  title: 'My Collections - Verbatims'
})

const collections = ref([])
const loading = ref(true)
const loadingMore = ref(false)
const deleting = ref(false)
const hasMore = ref(false)
const currentPage = ref(1)
const searchQuery = ref('')
const visibilityFilter = ref('all')

const showCreateModal = ref(false)
const showEditModal = ref(false)
const showDeleteModal = ref(false)
const selectedCollection = ref(null)

const visibilityOptions = [
  { label: 'All Collections', value: 'all' },
  { label: 'Public Only', value: 'public' },
  { label: 'Private Only', value: 'private' }
]

const loadCollections = async (reset = true) => {
  try {
    if (reset) {
      loading.value = true
      currentPage.value = 1
    } else {
      loadingMore.value = true
    }

    const params = {
      page: currentPage.value,
      limit: 12
    }

    if (searchQuery.value) {
      params.search = searchQuery.value
    }

    if (visibilityFilter.value === 'public') {
      params.public = 'true'
    } else if (visibilityFilter.value === 'private') {
      params.public = 'false'
    }

    const response = await $fetch('/api/dashboard/collections', { query: params })
    
    if (reset) {
      collections.value = response.data
    } else {
      collections.value.push(...response.data)
    }
    
    hasMore.value = response.pagination.hasMore
  } catch (error) {
    console.error('Failed to load collections:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to load collections',
      status: 'error'
    })
  } finally {
    loading.value = false
    loadingMore.value = false
  }
}

const debouncedSearch = useDebounceFn(() => {
  loadCollections()
}, 300)

const loadMore = () => {
  currentPage.value++
  loadCollections(false)
}

const getCollectionActions = (collection) => [
  [{
    label: 'Edit',
    icon: 'i-ph-pencil',
    onclick: () => editCollection(collection)
  }, {
    label: 'View Public',
    icon: 'i-ph-eye',
    onclick: () => navigateTo(`/collections/${collection.id}`),
    disabled: !collection.is_public
  }],
  [{
    label: 'Delete',
    icon: 'i-ph-trash',
    onclick: () => confirmDelete(collection)
  }]
]

const editCollection = (collection) => {
  selectedCollection.value = collection
  showEditModal.value = true
}

const confirmDelete = (collection) => {
  selectedCollection.value = collection
  showDeleteModal.value = true
}

const deleteCollection = async () => {
  if (!selectedCollection.value) return

  try {
    deleting.value = true
    await $fetch(`/api/collections/${selectedCollection.value.id}`, {
      method: 'DELETE'
    })

    collections.value = collections.value.filter(
      c => c.id !== selectedCollection.value.id
    )
    
    showDeleteModal.value = false
    selectedCollection.value = null
  } catch (error) {
    console.error('Failed to delete collection:', error)
    useToast().toast({
      title: 'Error',
      description: 'Failed to delete collection',
      status: 'error'
    })
  } finally {
    deleting.value = false
  }
}

const onCollectionCreated = (newCollection) => {
  collections.value.unshift(newCollection)
}

const onCollectionUpdated = (updatedCollection) => {
  const index = collections.value.findIndex(c => c.id === updatedCollection.id)
  if (index !== -1) {
    collections.value[index] = updatedCollection
  }
}

const formatDate = (dateString) => {
  return new Date(dateString).toLocaleDateString()
}

onMounted(() => {
  loadCollections()
})

watch(visibilityFilter, () => {
  loadCollections()
})
</script>
