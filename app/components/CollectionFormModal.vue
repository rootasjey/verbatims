<template>
  <AppDialog
    v-model="isOpen"
    :title="dialogTitle as string"
    :submit-text="submitText as string"
    :submitting="loading"
    :can-submit="!!state.name.trim()"
    @submit="save"
  >
    <form @submit.prevent="save" @keydown.ctrl.enter.prevent="save" @keydown.meta.enter.prevent="save" class="space-y-6">
      <NInput
        v-model="state.name"
        :placeholder="$t('components.dialogs.placeholder_name') as string"
        :disabled="loading"
        required
        autofocus
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.collection_name') }}</NBadge>
        </template>
      </NInput>

      <NInput
        type="textarea"
        v-model="state.description"
        :placeholder="$t('components.dialogs.collection_desc') as string"
        :rows="3"
        :disabled="loading"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5 bottom-2 top-initial' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.description') }}</NBadge>
        </template>
      </NInput>

      <CheckboxBadge v-model="state.is_public" :label="$t('components.dialogs.make_public') as string" />
      <p class="text-xs text-gray-500 dark:text-gray-400 -mt-4">{{ $t('common.public') }} {{ $t('components.dialogs.collection_desc') }}</p>
    </form>
  </AppDialog>
</template>

<script lang="ts" setup>
interface CollectionData {
  id: number
  name: string
  description?: string | null
  is_public: boolean | number
}

interface Props {
  modelValue: boolean
  collection?: CollectionData | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'saved', collection: CollectionData): void
}

const props = withDefaults(defineProps<Props>(), {
  collection: null
})

const emit = defineEmits<Emits>()

const { $t } = useI18n()

const isEdit = computed(() => !!props.collection)
const dialogTitle = computed(() => isEdit.value ? `${$t('components.dialogs.edit_collection')}: "${props.collection!.name}"` : $t('components.dialogs.create_new'))
const submitText = computed(() => isEdit.value ? $t('components.dialogs.update') : $t('components.dialogs.create'))

const isOpen = computed({
  get: () => props.modelValue,
  set: (value) => emit('update:modelValue', value)
})

const loading = ref(false)
const state = ref({ name: '', description: '', is_public: false })
const { showErrorToast } = useErrorToast()

watch(() => props.collection, (col) => {
  if (col) {
    state.value = { name: col.name, description: col.description || '', is_public: !!col.is_public }
  } else {
    state.value = { name: '', description: '', is_public: false }
  }
}, { immediate: true })

watch(isOpen, (open) => {
  if (!open) {
    nextTick(() => { state.value = { name: '', description: '', is_public: false } })
  } else if (props.collection) {
    state.value = { name: props.collection.name, description: props.collection.description || '', is_public: !!props.collection.is_public }
  }
})

const save = async () => {
  if (!state.value.name.trim()) return
  loading.value = true
  try {
    const body = { name: state.value.name.trim(), description: state.value.description.trim() || null, is_public: state.value.is_public }
    const method = isEdit.value && props.collection ? 'PUT' : 'POST'
    const url = isEdit.value && props.collection ? `/api/collections/${props.collection.id}` : '/api/collections'
    const response = await $fetch<{ success: boolean; data: CollectionData }>(url, { method, body })
    emit('saved', response.data)
    isOpen.value = false
    state.value = { name: '', description: '', is_public: false }
  } catch (error: any) {
    console.error('Failed to save collection:', error)
    showErrorToast(error, { title: isEdit.value ? String($t('components.dialogs.toast_error')) : String($t('components.dialogs.toast_error')), fallback: String($t('common.confirm')) })
  } finally {
    loading.value = false
  }
}
</script>
