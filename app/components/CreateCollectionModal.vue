<template>
  <NDialog v-model:open="isOpen">
    <div>
      <div class="mb-6">
        <h3 class="text-lg font-semibold">Create New Collection</h3>
      </div>

      <NForm
        :schema="schema"
        :state="state"
        @submit="createCollection"
        class="space-y-4"
      >
        <NFormGroup label="Collection Name" name="name" required>
          <NInput
            class="mt-2"
            v-model="state.name"
            placeholder="Enter collection name"
            :disabled="loading"
          />
        </NFormGroup>

        <NFormGroup label="Description" name="description">
          <NInput
            class="mt-2"
            type="textarea"
            v-model="state.description"
            placeholder="Optional description for your collection"
            :rows="3"
            :disabled="loading"
          />
        </NFormGroup>

        <NFormGroup name="is_public">
          <NCheckbox
            v-model="state.is_public"
            label="Make this collection public"
            help="Public collections can be viewed by anyone"
            :disabled="loading"
          />
        </NFormGroup>

        <div>
          <div class="flex justify-end gap-3">
            <NButton
              btn="ghost"
              @click="closeModal"
              :disabled="loading"
            >
              Cancel
            </NButton>
            <NButton
              btn="soft-blue"
              type="submit"
              :loading="loading"
            >
              Create Collection
            </NButton>
          </div>
        </div>
      </NForm>
    </div>
  </NDialog>
</template>

<script lang="ts" setup>
import { z } from 'zod'

const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false
  }
})

const emit = defineEmits(['update:modelValue', 'created'])

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

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

const createCollection = async () => {
  try {
    loading.value = true
    
    const response = await $fetch('/api/collections', {
      method: 'POST',
      body: state.value
    })
    
    emit('created', response.data)
    closeModal()
  } catch (error: any) {
    console.error('Failed to create collection:', error)
    useToast().toast({
      title: 'List Creation Error',
      description: `Failed to create collection: ${error.message}`,
      toast: 'error',
    })
  } finally {
    loading.value = false
  }
}

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
