<template>
  <NDialog v-model:open="isOpen">
    <NCard class="border-none shadow-none">
      <template #header>
        <h3 class="text-lg font-semibold">Add {{ quoteIds.length }} {{ quoteIds.length === 1 ? 'Quote' : 'Quotes' }} to Collection</h3>
      </template>

      <div class="space-y-4">
        <!-- Create New Collection -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <UCollapsible>
            <UCollapsibleTrigger as-child class="flex items-center justify-between w-full">
              <UButton btn="ghost">
                <span class="font-medium text-gray-900 dark:text-white">Create New Collection</span>
                <UIcon name="i-ph-caret-down" class="w-4 h-4" />
              </UButton>
            </UCollapsibleTrigger>
            <UCollapsibleContent>
              <div class="m-2 mt-3 space-y-3">
                <UInput
                  v-model="newCollectionName"
                  placeholder="Collection name"
                  :disabled="creating || processing"
                />
                <UInput
                  type="textarea"
                  v-model="newCollectionDescription"
                  placeholder="Optional description"
                  :rows="2"
                  :disabled="creating || processing"
                />
                <div class="flex items-center justify-between">
                  <UCheckbox
                    v-model="newCollectionPublic"
                    label="Make public"
                    :disabled="creating || processing"
                  />
                  <UButton
                    size="xs"
                    :loading="creating || processing"
                    :disabled="!newCollectionName.trim() || creating || processing"
                    @click="createAndAddToCollection"
                  >
                    Create & Add All
                  </UButton>
                </div>
              </div>

            </UCollapsibleContent>
          </UCollapsible>
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
              :class="{ 'opacity-50': processing || addingToCollections.has(collection.id) }"
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
                :disabled="processing"
                @click="addAllToCollection(collection)"
              >
                Add All
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
              btn="soft"
              :disabled="processing"
              @click="showCreateForm = true"
            >
              Create Your First Collection
            </UButton>
          </div>
        </div>
      </div>

      <template #footer>
        <div class="flex items-center justify-end w-full">
          <div class="text-xs text-gray-500 dark:text-gray-400" v-if="processing">
            Processing {{ processedCount }} / {{ quoteIds.length }}
          </div>
          <div class="flex justify-end">
            <NButton
              btn="ghost"
              :disabled="processing"
              @click="closeModal"
            >
              Close
            </NButton>
          </div>
        </div>
      </template>
    </UCard>
  </UDialog>
  
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  quoteIds: { type: Array, required: true }
})

const emit = defineEmits(['update:modelValue', 'added'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const collections = ref([])
const loading = ref(false)
const creating = ref(false)
const processing = ref(false)
const processedCount = ref(0)
const addingToCollections = ref(new Set())

const showCreateForm = ref(false)
const newCollectionName = ref('')
const newCollectionDescription = ref('')
const newCollectionPublic = ref(false)

const loadCollections = async () => {
  try {
    loading.value = true
    const response = await $fetch('/api/dashboard/collections', { query: { limit: 100 } })
    collections.value = (response?.data?.results ?? response?.data ?? [])
  } catch (error) {
    console.error('Failed to load collections:', error)
  } finally {
    loading.value = false
  }
}

const addAllToCollection = async (collection) => {
  if (processing.value || !props.quoteIds?.length) return
  const { toast } = useToast()
  try {
    processing.value = true
    addingToCollections.value.add(collection.id)
    processedCount.value = 0

    const ids = [...props.quoteIds]
    const batchSize = 5
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (id) => {
          try {
            await $fetch(`/api/collections/${collection.id}/quotes`, {
              method: 'POST',
              body: { quote_id: id }
            })
          } catch (err) {
            // Ignore 409 conflicts, surface other errors in console
            if (!(err && err.statusCode === 409)) console.error('Add to collection failed:', err)
          } finally {
            processedCount.value += 1
          }
        })
      )
    }

    emit('added', collection)
    closeModal()
    toast({ title: 'Added to collection', description: `Added ${ids.length} quote(s) to "${collection.name}".` })
  } catch (error) {
    console.error('Failed bulk add to collection:', error)
    const { toast } = useToast()
    toast({ title: 'Bulk add failed', description: 'Please try again.' })
  } finally {
    processing.value = false
    addingToCollections.value.delete(collection.id)
  }
}

const createAndAddToCollection = async () => {
  if (!newCollectionName.value.trim() || processing.value) return
  const { toast } = useToast()
  try {
    processing.value = true
    creating.value = true
    processedCount.value = 0

    // Create collection
    const createResponse = await $fetch('/api/collections', {
      method: 'POST',
      body: {
        name: newCollectionName.value.trim(),
        description: newCollectionDescription.value.trim() || null,
        is_public: newCollectionPublic.value
      }
    })

    const collection = createResponse.data

    // Add in batches
    const ids = [...props.quoteIds]
    const batchSize = 5
    for (let i = 0; i < ids.length; i += batchSize) {
      const batch = ids.slice(i, i + batchSize)
      await Promise.all(
        batch.map(async (id) => {
          try {
            await $fetch(`/api/collections/${collection.id}/quotes`, {
              method: 'POST',
              body: { quote_id: id }
            })
          } catch (err) {
            if (!(err && err.statusCode === 409)) console.error('Add to collection failed:', err)
          } finally {
            processedCount.value += 1
          }
        })
      )
    }

    emit('added', collection)
    closeModal()
    toast({ title: 'Collection created', description: `"${collection.name}" created and ${ids.length} quote(s) added.` })
  } catch (error) {
    console.error('Failed to create collection and bulk add:', error)
    const { toast } = useToast()
    toast({ title: 'Failed to create collection', description: 'Please try again.' })
  } finally {
    creating.value = false
    processing.value = false
  }
}

const closeModal = () => {
  isOpen.value = false
  showCreateForm.value = false
  newCollectionName.value = ''
  newCollectionDescription.value = ''
  newCollectionPublic.value = false
  addingToCollections.value.clear()
  processedCount.value = 0
}

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
      processedCount.value = 0
    })
  }
})
</script>
