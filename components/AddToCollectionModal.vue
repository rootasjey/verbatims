<template>
  <UDialog v-model:open="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Add to Collection</h3>
      </template>

      <div class="space-y-4">
        <!-- Create New Collection -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <div class="flex items-center justify-between mb-3">
            <h4 class="font-medium text-gray-900 dark:text-white">Create New Collection</h4>
            <UButton
              size="xs"
              variant="ghost"
              icon
              label="i-ph-plus"
              @click="showCreateForm = !showCreateForm"
            >
              {{ showCreateForm ? 'Cancel' : 'New' }}
            </UButton>
          </div>
          
          <div v-if="showCreateForm" class="space-y-3">
            <UInput
              v-model="newCollectionName"
              placeholder="Collection name"
              :disabled="creating"
            />
            <UInput
              type="textarea"
              v-model="newCollectionDescription"
              placeholder="Optional description"
              :rows="2"
              :disabled="creating"
            />
            <div class="flex items-center justify-between">
              <UCheckbox
                v-model="newCollectionPublic"
                label="Make public"
                :disabled="creating"
              />
              <UButton
                size="xs"
                :loading="creating"
                @click="createAndAddToCollection"
              >
                Create & Add
              </UButton>
            </div>
          </div>
        </div>

        <!-- Existing Collections -->
        <div>
          <h4 class="font-medium text-gray-900 dark:text-white mb-3">Your Collections</h4>
          
          <!-- Loading State -->
          <div v-if="loading" class="space-y-2">
            <div v-for="i in 3" :key="i" class="animate-pulse">
              <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </div>
          </div>

          <!-- Collections List -->
          <div v-else-if="collections.length > 0" class="space-y-2 max-h-64 overflow-y-auto">
            <div
              v-for="collection in collections"
              :key="collection.id"
              class="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
              :class="{ 'opacity-50': addingToCollections.has(collection.id) }"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h5 class="font-medium text-gray-900 dark:text-white">{{ collection.name }}</h5>
                  <UBadge
                    v-if="collection.is_public"
                    color="green"
                    variant="subtle"
                    size="xs"
                  >
                    Public
                  </UBadge>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ collection.quotes_count }} quotes
                </p>
              </div>
              
              <UButton
                v-if="!addingToCollections.has(collection.id)"
                size="xs"
                @click="addToCollection(collection)"
              >
                Add
              </UButton>
              <UIcon
                v-else
                name="i-ph-spinner"
                class="w-4 h-4 animate-spin text-primary-500"
              />
            </div>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <UIcon name="i-ph-bookmark" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              You don't have any collections yet
            </p>
            <UButton
              size="sm"
              @click="showCreateForm = true"
            >
              Create Your First Collection
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex justify-end">
          <UButton
            variant="ghost"
            @click="closeModal"
          >
            Close
          </UButton>
        </div>
      </template>
    </UCard>
  </UDialog>
</template>

<script setup>
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  quote: {
    type: Object,
    required: true
  }
})

const emit = defineEmits(['update:modelValue', 'added'])

// Modal state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Data
const collections = ref([])
const loading = ref(false)
const creating = ref(false)
const addingToCollections = ref(new Set())

// New collection form
const showCreateForm = ref(false)
const newCollectionName = ref('')
const newCollectionDescription = ref('')
const newCollectionPublic = ref(false)

// Load user collections
const loadCollections = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/dashboard/collections', {
      query: { limit: 50 }
    })
    collections.value = response.data
  } catch (error) {
    console.error('Failed to load collections:', error)
  } finally {
    loading.value = false
  }
}

// Create new collection and add quote
const createAndAddToCollection = async () => {
  if (!newCollectionName.value.trim()) return

  try {
    creating.value = true
    
    // Create collection
    const createResponse = await $fetch('/api/collections', {
      method: 'POST',
      body: {
        name: newCollectionName.value.trim(),
        description: newCollectionDescription.value.trim() || null,
        is_public: newCollectionPublic.value
      }
    })
    
    // Add quote to collection
    await $fetch(`/api/collections/${createResponse.data.id}/quotes`, {
      method: 'POST',
      body: { quote_id: props.quote.id }
    })
    
    emit('added', createResponse.data)
    closeModal()
    
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to create collection and add quote:', error)
    // TODO: Show error toast
  } finally {
    creating.value = false
  }
}

// Add quote to existing collection
const addToCollection = async (collection) => {
  if (addingToCollections.value.has(collection.id)) return

  try {
    addingToCollections.value.add(collection.id)
    
    await $fetch(`/api/collections/${collection.id}/quotes`, {
      method: 'POST',
      body: { quote_id: props.quote.id }
    })
    
    emit('added', collection)
    closeModal()
    
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to add quote to collection:', error)
    
    if (error.statusCode === 409) {
      // Quote already in collection - show info toast
    }
    
    // TODO: Show error toast
  } finally {
    addingToCollections.value.delete(collection.id)
  }
}

// Close modal and reset
const closeModal = () => {
  isOpen.value = false
  showCreateForm.value = false
  newCollectionName.value = ''
  newCollectionDescription.value = ''
  newCollectionPublic.value = false
  addingToCollections.value.clear()
}

// Load collections when modal opens
watch(isOpen, (newValue) => {
  if (newValue) {
    loadCollections()
  } else {
    nextTick(() => {
      showCreateForm.value = false
      newCollectionName.value = ''
      newCollectionDescription.value = ''
      newCollectionPublic.value = false
      addingToCollections.value.clear()
    })
  }
})
</script>
