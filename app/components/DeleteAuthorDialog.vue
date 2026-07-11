<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_author') as string"
    :submit-text="$t('components.dialogs.delete') as string"
    :submitting="submitting"
    @submit="confirmDeletion"
  >
    <div class="space-y-4">
      <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
        <div class="text-sm text-red-800 dark:text-red-300">
          <p class="font-medium">{{ $t('components.dialogs.delete_permanent') }}</p>
          <p class="mt-1">{{ $t('components.dialogs.confirm_delete_desc') }} <span class="font-semibold">{{ props.author?.name }}</span>.</p>
        </div>
      </div>

      <div v-if="quotesCount > 0" class="space-y-3">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ $t('components.dialogs.confirm_delete_desc') }} <span class="font-semibold">{{ quotesCount }}</span> {{ $t('components.dialogs.delete_related_quotes', { count: quotesCount }) }}.
        </p>

        <NRadioGroup v-model="strategy" class="space-y-2">
          <NRadioGroupItem value="delete" class="flex items-start gap-3">
            <div class="w-4 h-4 mt-1" />
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('components.dialogs.delete_related_radiobox_delete') }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.delete_related_quotes', { count: quotesCount }) }}</div>
            </div>
          </NRadioGroupItem>
          <NRadioGroupItem value="anonymize" class="flex items-start gap-3">
            <div class="w-4 h-4 mt-1" />
            <div>
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('components.dialogs.delete_related_radiobox_anonymize') }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.delete_related_radiobox_anonymize') }}</div>
            </div>
          </NRadioGroupItem>
        </NRadioGroup>
      </div>

      <div v-else class="text-sm text-gray-700 dark:text-gray-300">
        {{ $t('components.dialogs.delete_no_related') }}
      </div>
    </div>

    <template #submit>
      <NButton btn="soft-red" :loading="submitting" @click="confirmDeletion">{{ $t('common.delete') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  author?: Author | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'author-deleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const submitting = ref(false)
const quotesCount = ref<number>(props.author?.quotes_count ?? 0)
const strategy = ref<'delete' | 'anonymize'>(quotesCount.value > 0 ? 'anonymize' : 'delete')
const { $t } = useI18n()
const { showErrorToast } = useErrorToast()

watch(() => props.author?.id, async (newId) => {
  if (!newId) return
  try {
    const res: any = await $fetch(`/api/admin/authors/${newId}`)
    quotesCount.value = Number(res?.data?.quotes_count || 0)
    if (quotesCount.value === 0) strategy.value = 'delete'
  } catch (e) {
    console.error('Failed to fetch author details', e)
  }
}, { immediate: true })

const confirmDeletion = async () => {
  if (!props.author) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/authors/${props.author.id}`, {
      method: 'DELETE',
      body: quotesCount.value > 0 ? { strategy: strategy.value } : undefined
    })

    useToast().toast({
      toast: 'soft-success',
      title: String($t('components.dialogs.delete_author')),
    })

    emit('author-deleted')
    isOpen.value = false
  } catch (error: any) {
    console.error('Delete author failed:', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.delete_author')) })
  } finally {
    submitting.value = false
  }
}
</script>
