<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_reference') as string"
    :submit-text="$t('components.dialogs.delete') as string"
    :submitting="submitting"
    @submit="confirmDeletion"
  >
    <div class="space-y-5">
      <p class="font-semibold text-gray-900 dark:text-gray-100">
        {{ props.reference?.name }} <span class="font-normal text-gray-500 dark:text-gray-400">· #{{ props.reference?.id }}</span>
      </p>

      <DeleteWarningPanel>{{ $t('components.dialogs.confirm_delete_desc') }}</DeleteWarningPanel>

      <div v-if="quotesCount > 0" class="space-y-3">
        <p class="text-sm text-gray-700 dark:text-gray-300">
          {{ relatedQuotesMessage }}
        </p>

        <NRadioGroup v-model="strategy" class="space-y-2">
          <NRadioGroupItem value="delete" :una="radioUna" class="flex items-start gap-3">
            <div class="w-4 h-4 mt-1" />
            <div class="space-y-0.5">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('components.dialogs.delete_related_radiobox_delete') }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.delete_reference_delete_quotes_desc') }}</div>
            </div>
          </NRadioGroupItem>
          <NRadioGroupItem value="anonymize" :una="radioUna" class="flex items-start gap-3">
            <div class="w-4 h-4 mt-1" />
            <div class="space-y-0.5">
              <div class="text-sm font-medium text-gray-900 dark:text-white">{{ $t('components.dialogs.delete_related_radiobox_anonymize') }}</div>
              <div class="text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.delete_reference_anonymize_quotes_desc') }}</div>
            </div>
          </NRadioGroupItem>
        </NRadioGroup>
      </div>

      <div v-else class="text-sm text-gray-700 dark:text-gray-300">
        {{ $t('components.dialogs.delete_no_related') }}
      </div>
    </div>

    <template #submit>
      <NButton :btn="deleteButtonDisabled ? 'soft-gray' : 'solid-red'" :loading="submitting" :disabled="deleteButtonDisabled" @click="confirmDeletion">{{ $t('common.delete') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  modelValue: boolean
  reference?: QuoteReferenceWithMetadata
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'reference-deleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const submitting = ref(false)
const quotesCount = ref<number>(props.reference?.quotes_count ?? 0)
const strategy = ref<'delete' | 'anonymize' | null>(null)
const { $t } = useI18n()
const { showErrorToast } = useErrorToast()
const deleteButtonDisabled = computed(() => submitting.value || (quotesCount.value > 0 && !strategy.value))
const radioUna = {
  radioGroupItem: 'border-stone-400 text-stone-400 dark:border-stone-500 dark:text-stone-400 focus-visible:ring-stone-500 dark:focus-visible:ring-stone-400',
  radioGroupIndicatorIcon: 'fill-stone-700 dark:fill-stone-300'
}

const relatedQuotesMessage = computed(() => $t(
  quotesCount.value === 1
    ? 'components.dialogs.delete_reference_one_related_quote'
    : 'components.dialogs.delete_reference_many_related_quotes',
  { count: quotesCount.value }
))

watch(() => props.reference?.id, async (newId) => {
  quotesCount.value = Number(props.reference?.quotes_count || 0)
  strategy.value = null
  if (!newId) return
  try {
    const referencePath = `/api/admin/references/${newId}` as '/api/admin/references/:id'
    const res = await $fetch<
      { success: boolean; data: { quotes_count?: number } },
      '/api/admin/references/:id'
    >(referencePath)
    quotesCount.value = Number(res?.data?.quotes_count || 0)
  } catch (e) {
    console.error('Failed to fetch reference details', e)
  }
}, { immediate: true })

watch(() => props.modelValue, (isVisible) => {
  if (isVisible) strategy.value = null
})

const confirmDeletion = async () => {
  if (!props.reference || (quotesCount.value > 0 && !strategy.value)) return
  submitting.value = true
  try {
    const deleteReferencePath = `/api/admin/references/${props.reference.id}` as '/api/admin/references/:id'
    await $fetch<{ success: boolean }, '/api/admin/references/:id'>(deleteReferencePath, {
      method: 'DELETE',
      body: quotesCount.value > 0 && strategy.value ? { strategy: strategy.value } : undefined
    })

    useToast().toast({
      toast: 'soft-success',
      title: String($t('components.dialogs.delete_reference')),
    })

    emit('reference-deleted')
    isOpen.value = false
  } catch (error: any) {
    console.error('Delete reference failed:', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.delete_reference')) })
  } finally {
    submitting.value = false
  }
}
</script>
