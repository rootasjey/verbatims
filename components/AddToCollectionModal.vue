<template>
  <NDialog v-model:open="isOpen">
    <NCard class="border-none shadow-none">
      <template #header>
        <h3 class="text-lg font-semibold">Add to Collection</h3>
      </template>

      <div class="space-y-4">
        <!-- Create New Collection -->
        <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <NCollapsible v-model:open="createOpen">
            <NCollapsibleTrigger as-child class="flex items-center justify-between w-full">
              <NButton btn="ghost" size="xs">
                <span class="font-medium text-sm text-gray-900 dark:text-white">Create New Collection</span>
                <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': createOpen }" />
              </NButton>
            </NCollapsibleTrigger>
            <NCollapsibleContent>
              <div class="m-2 mt-3 space-y-3">
                <NInput
                  v-model="newCollectionName"
                  placeholder="Collection name"
                  :disabled="creating"
                />
                <NInput
                  type="textarea"
                  v-model="newCollectionDescription"
                  placeholder="Optional description"
                  :rows="2"
                  :disabled="creating"
                />
                <div class="flex items-center justify-between">
                  <NCheckbox
                    v-model="newCollectionPublic"
                    label="Make public"
                    :disabled="creating"
                  />
                  <NButton
                    size="xs"
                    :loading="creating"
                    :disabled="!newCollectionName.trim() || creating"
                    @click="createAndAddToCollection"
                  >
                    Create & Add
                  </NButton>
                </div>
              </div>
            </NCollapsibleContent>
          </NCollapsible>
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
            <button
              v-for="collection in collections"
              :key="collection.id"
              type="button"
              class="w-full flex justify-between items-center p-3 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
              :class="{ 'opacity-50 pointer-events-none': addingToCollections.has(collection.id) }"
              @click="addToCollection(collection)"
            >
              <div class="flex-1">
                <div class="flex items-center gap-2">
                  <h5 class="font-medium text-gray-900 dark:text-white">{{ collection.name }}</h5>
                  <NBadge
                    v-if="collection.is_public"
                    color="green"
                    variant="subtle"
                    size="xs"
                  >
                    Public
                  </NBadge>
                </div>
                <p class="text-sm text-gray-500 dark:text-gray-400">
                  {{ collection.quotes_count }} quotes
                </p>
              </div>
              <div class="mr-2">
                <NIcon
                  v-if="!addingToCollections.has(collection.id)"
                  name="i-ph-plus-bold"
                  class="w-4 h-4 text-gray-400"
                />
                <NIcon
                  v-else
                  name="i-ph-spinner"
                  class="w-4 h-4 animate-spin text-primary-500"
                />
              </div>
            </button>
          </div>

          <!-- Empty State -->
          <div v-else class="text-center py-8">
            <NIcon name="i-ph-bookmark" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p class="text-gray-500 dark:text-gray-400 mb-4">
              You don't have any collections yet
            </p>
            <NButton
              size="sm"
              btn="soft"
              @click="createOpen = true"
            >
              Create Your First Collection
            </NButton>
          </div>
        </div>
      </div>
    </NCard>

    <template #footer>
      <div class="flex justify-end">
        <NButton
          btn="ghost"
          @click="closeModal"
        >
          Close
        </NButton>
      </div>
    </template>
  </NDialog>
</template><script lang="ts" setup>
import type { CollectionWithStats } from '~/types'
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

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const collections = ref<CollectionWithStats[]>([])
const loading = ref(false)
const creating = ref(false)
const addingToCollections = ref<Set<number>>(new Set())
const createOpen = ref(false)
const newCollectionName = ref('')
const newCollectionDescription = ref('')
const newCollectionPublic = ref(false)

const loadCollections = async () => {
  try {
    loading.value = true
  // The API returns { data: { results: [...] }, pagination: {...} }
  const response: any = await $fetch('/api/dashboard/collections', {
      query: { limit: 50 }
    })
  collections.value = (response?.data?.results ?? response?.data ?? []) as CollectionWithStats[]
  } catch (error) {
    console.error('Failed to load collections:', error)
  } finally {
    loading.value = false
  }
}

const createAndAddToCollection = async () => {
  if (!newCollectionName.value.trim()) return

  const { toast } = useToast()

  try {
    creating.value = true

    const createResponse = await $fetch<{ success: boolean; data: CollectionWithStats }>(
      '/api/collections',
      {
      method: 'POST',
      body: {
        name: newCollectionName.value.trim(),
        description: newCollectionDescription.value.trim() || null,
        is_public: newCollectionPublic.value
      }
    })

    await $fetch(`/api/collections/${createResponse.data.id}/quotes`, {
      method: 'POST',
      body: { quote_id: props.quote.id }
    })

    emit('added', createResponse.data)
    closeModal()

    toast({ title: 'Collection created!', description: `"${createResponse.data.name}" created and quote added.`, toast: 'success' })
  } catch (error) {
    console.error('Failed to create collection and add quote:', error)
    toast({ title: 'Failed to create collection', description: 'Please try again.', toast: 'error' })
  } finally {
    creating.value = false
  }
}

const addToCollection = async (collection: CollectionWithStats) => {
  if (addingToCollections.value.has(collection.id)) return
  const { toast } = useToast()

  try {
    addingToCollections.value.add(collection.id)

    await $fetch(`/api/collections/${collection.id}/quotes`, {
      method: 'POST',
      body: { quote_id: props.quote.id }
    })

    emit('added', collection)
    closeModal()

  } catch (error) {
    console.error('Failed to add quote to collection:', error)

    const err = error as any
    if (err && err.statusCode === 409) {
      toast({ title: 'Quote already in collection', description: `Quote is already in "${collection.name}" collection.`, })
    } else {
      toast({ title: 'Failed to add quote', description: 'Please try again.', toast: 'error' })
    }
  } finally {
    addingToCollections.value.delete(collection.id)
  }
}

const closeModal = () => {
  isOpen.value = false
  createOpen.value = false
  newCollectionName.value = ''
  newCollectionDescription.value = ''
  newCollectionPublic.value = false
  addingToCollections.value.clear()
}

watch(isOpen, (newValue) => {
  if (newValue) {
    loadCollections()
  } else {
    nextTick(() => {
  createOpen.value = false
      newCollectionName.value = ''
      newCollectionDescription.value = ''
      newCollectionPublic.value = false
      addingToCollections.value.clear()
    })
  }
})
</script>
