<template>
  <AppDialog
    v-model="isOpen"
    title="Create New Collection"
    submit-text="Create Collection"
    :submitting="loading"
    :can-submit="!!state.name.trim()"
    @submit="createCollection"
  >
    <form @submit.prevent="createCollection" @keydown.ctrl.enter.prevent="createCollection" @keydown.meta.enter.prevent="createCollection" class="space-y-6">
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

<script lang="ts" setup>
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

const createCollection = async () => {
  try {
    loading.value = true

    const response = await $fetch('/api/collections', {
      method: 'POST',
      body: state.value
    })

    emit('created', response.data)
    isOpen.value = false
    state.value = { name: '', description: '', is_public: false }
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

watch(isOpen, (open) => {
  if (!open) {
    nextTick(() => {
      state.value = { name: '', description: '', is_public: false }
    })
  }
})
</script>
