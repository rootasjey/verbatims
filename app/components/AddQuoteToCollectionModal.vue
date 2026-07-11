<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.add_collection') as string"
    hide-footer
    @close="closeModal"
  >
    <div class="space-y-4">
      <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
        <NCollapsible v-model:open="createOpen">
          <NCollapsibleTrigger as-child class="flex items-center justify-between w-full">
            <NButton btn="ghost-gray" size="xs">
              <span class="font-medium text-sm text-gray-900 dark:text-white">{{ $t('components.dialogs.create_new') }}</span>
              <NIcon name="i-ph-caret-down-bold" :class="{ 'rotate-180': createOpen }" />
            </NButton>
          </NCollapsibleTrigger>
          <NCollapsibleContent>
            <div class="m-2 mt-3 space-y-3">
              <NInput
                v-model="newCollectionName"
                :placeholder="$t('components.dialogs.collection_name') as string"
                :disabled="creating"
              />
              <NInput
                type="textarea"
                v-model="newCollectionDescription"
                :placeholder="$t('components.dialogs.collection_desc') as string"
                :rows="2"
                :disabled="creating"
              />
              <div class="flex items-center justify-between">
                <NCheckbox
                  v-model="newCollectionPublic"
                  :label="$t('components.dialogs.make_public') as string"
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

      <div>
        <h4 class="font-medium text-gray-900 dark:text-white mb-3">{{ $t('components.dialogs.your_collections') }}</h4>

        <div v-if="loading" class="space-y-2">
          <div v-for="i in 3" :key="i" class="animate-pulse">
            <div class="h-12 bg-gray-200 dark:bg-gray-700 rounded" />
          </div>
        </div>

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
                <NBadge v-if="collection.is_public" color="green" badge="soft" size="xs">{{ $t('common.public') }}</NBadge>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">{{ collection.quotes_count }} {{ $t('common.quote_plural') }}</p>
            </div>
            <div class="mr-2">
              <NIcon v-if="!addingToCollections.has(collection.id)" name="i-ph-plus-bold" class="w-4 h-4 text-gray-400" />
              <NIcon v-else name="i-ph-spinner" class="w-4 h-4 animate-spin text-primary-500" />
            </div>
          </button>
        </div>

        <div v-else class="text-center py-8">
          <NIcon name="i-ph-bookmark" class="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p class="text-gray-500 dark:text-gray-400 mb-4">{{ $t('components.dialogs.no_collections') }}</p>
          <NButton size="sm" btn="soft" @click="createOpen = true">{{ $t('components.dialogs.create_first') }}</NButton>
        </div>
      </div>
    </div>

    <template #footer>
      <div class="flex justify-end">
        <NButton btn="link-gray" @click="closeModal">{{ $t('common.close') }}</NButton>
      </div>
    </template>
  </AppDialog>
</template>

<script lang="ts" setup>
interface Props {
  modelValue: boolean
  quote: { id: number }
}

const props = defineProps<Props>()
const emit = defineEmits(['update:modelValue', 'added'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const { $t } = useI18n()
const { showErrorToast } = useErrorToast()

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

    toast({ title: String($t('components.dialogs.toast_created')), description: `"${createResponse.data.name}" created and quote added.`, toast: 'soft-success' })
  } catch (error) {
    console.error('Failed to create collection and add quote:', error)
      showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Please try again.' })
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
      toast({ title: 'Quote already in collection', description: `Quote is already in "${collection.name}" collection.`, toast: 'outline-warning' })
    } else {
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Please try again.' })
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

watch(isOpen, (open) => {
  if (open) {
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
