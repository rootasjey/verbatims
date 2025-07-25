<template>
  <UDialog v-model:open="isOpen">
    <UCard>
      <template #header>
        <h3 class="text-lg font-semibold">Create New Collection</h3>
      </template>

      <UForm
        :schema="schema"
        :state="state"
        @submit="createCollection"
        class="space-y-4"
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

        <template #footer>
          <div class="flex justify-end gap-3">
            <UButton
              variant="ghost"
              @click="closeModal"
              :disabled="loading"
            >
              Cancel
            </UButton>
            <UButton
              type="submit"
              :loading="loading"
            >
              Create Collection
            </UButton>
          </div>
        </template>
      </UForm>
    </UCard>
  </UDialog>
</template>

<script setup>
import { z } from 'zod'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

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

// Create collection
const createCollection = async () => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/collections', {
      method: 'POST',
      body: state.value
    })
    
    emit('created', response.data)
    closeModal()
    
    // TODO: Show success toast
  } catch (error) {
    console.error('Failed to create collection:', error)
    // TODO: Show error toast
  } finally {
    loading.value = false
  }
}

// Close modal and reset form
const closeModal = () => {
  isOpen.value = false
  state.value = {
    name: '',
    description: '',
    is_public: false
  }
}

// Reset form when modal closes
watch(isOpen, (newValue) => {
  if (!newValue) {
    nextTick(() => {
      state.value = {
        name: '',
        description: '',
        is_public: false
      }
    })
  }
})
</script>
