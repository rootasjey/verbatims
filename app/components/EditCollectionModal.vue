<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle"
    submit-text="Update Collection"
    :submitting="loading"
    :can-submit="!!state.name.trim()"
    @submit="updateCollection"
  >
    <form @submit.prevent="updateCollection" @keydown.ctrl.enter.prevent="updateCollection" @keydown.meta.enter.prevent="updateCollection" class="space-y-6">
      <NInput
        v-model="state.name"
        placeholder="Enter collection name"
        :disabled="loading"
        required
        autofocus
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            Collection Name *
          </NBadge>
        </template>
      </NInput>

      <NInput
        type="textarea"
        v-model="state.description"
        placeholder="Optional description for your collection"
        :rows="3"
        :disabled="loading"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5 bottom-2 top-initial' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">
            Description
          </NBadge>
        </template>
      </NInput>

      <NCheckbox
        v-model="state.is_public"
        label="Make this collection public"
        help="Public collections can be viewed by anyone"
        :disabled="loading"
      />
    </form>
  </AppDialog>
</template>

<script setup>
const props = defineProps({
  modelValue: { type: Boolean, default: false },
  collection: { type: Object, default: null }
})

const emit = defineEmits(['update:modelValue', 'updated'])

const dialogTitle = computed(() => `Edit "${props.collection?.name || ''}" Collection`)

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const state = ref({ name: '', description: '', is_public: false })

const updateCollection = async () => {
  if (!props.collection) return

  try {
    loading.value = true

    const response = await $fetch(`/api/collections/${props.collection.id}`, {
      method: 'PUT',
      body: state.value
    })

    emit('updated', response.data)
    isOpen.value = false
  } catch (error) {
    console.error('Failed to update collection:', error)
  } finally {
    loading.value = false
  }
}

watch(() => props.collection, (newCollection) => {
  if (newCollection) {
    state.value = {
      name: newCollection.name || '',
      description: newCollection.description || '',
      is_public: !!newCollection.is_public
    }
  }
}, { immediate: true })

watch(isOpen, (open) => {
  if (open && props.collection) {
    state.value = {
      name: props.collection.name || '',
      description: props.collection.description || '',
      is_public: !!props.collection.is_public
    }
  }
})
</script>
