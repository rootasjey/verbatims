<template>
  <NDialog v-model:open="isOpen">
    <template #header>
      <div class="flex items-center gap-3">
        <h3 class="text-size-4">Edit <u class="decoration-dashed">{{ collection.name }}</u> Collection</h3>
      </div>
    </template>

    <UForm
      :schema="schema"
      :state="state"
      @submit="updateCollection"
      class="space-y-4 mb-8"
    >
      <UFormGroup label="Collection Name" name="name" required>
        <UInput
          v-model="state.name"
          placeholder="Enter collection name"
          :disabled="loading"
        />
      </UFormGroup>

      <UFormGroup label="Description" name="description">
        <UInput
          type="textarea"
          v-model="state.description"
          placeholder="Optional description for your collection"
          :rows="3"
          :disabled="loading"
        />
      </UFormGroup>

      <UFormGroup name="is_public">
        <UCheckbox
          v-model="state.is_public"
          label="Make this collection public"
          help="Public collections can be viewed by anyone"
          :disabled="loading"
        />
      </UFormGroup>
    </UForm>

    <template #footer>
      <div class="flex justify-end gap-3">
        <NButton
          btn="text-gray"
          @click="closeModal"
          :disabled="loading"
        >
          Cancel
        </NButton>
        <NButton
          btn="solid-black"
          type="submit"
          :loading="loading"
        >
          Update Collection
        </NButton>
      </div>
    </template>
  </UDialog>
</template>

<script setup>
import { z } from 'zod'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  },
  collection: {
    type: Object,
    default: null
  }
})

const emit = defineEmits(['update:modelValue', 'updated'])

// Modal state
const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

// Form state
const loading = ref(false)
const state = ref({
  name: '',
  description: '',
  is_public: false
})

// Validation schema
const schema = z.object({
  name: z.string()
    .min(2, 'Collection name must be at least 2 characters')
    .max(100, 'Collection name must be less than 100 characters'),
  description: z.string()
    .max(500, 'Description must be less than 500 characters')
    .optional(),
  is_public: z.boolean().optional()
})

// Update collection
const updateCollection = async () => {
  if (!props.collection) return
  
  try {
    loading.value = true
    
    const response = await $fetch(`/api/collections/${props.collection.id}`, {
      method: 'PUT',
      body: state.value
    })
    
    emit('updated', response.data)
    closeModal()
    
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to update collection:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

// Close modal
const closeModal = () => {
  isOpen.value = false
}

// Initialize form when collection changes
watch(() => props.collection, (newCollection) => {
  if (newCollection) {
    state.value = {
      name: newCollection.name || '',
      description: newCollection.description || '',
      is_public: !!newCollection.is_public
    }
  }
}, { immediate: true })

// Reset form when modal opens
watch(isOpen, (newValue) => {
  if (newValue && props.collection) {
    state.value = {
      name: props.collection.name || '',
      description: props.collection.description || '',
      is_public: !!props.collection.is_public
    }
  }
})
</script>
