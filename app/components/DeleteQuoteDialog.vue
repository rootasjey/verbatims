<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_quote') as string"
    :submit-text="$t('components.dialogs.delete') as string"
    :submitting="submitting"
    :can-submit="canDelete"
    @submit="confirmDeletion"
  >
    <div class="space-y-4">
      <DeleteWarningPanel>{{ $t('components.dialogs.confirm_delete_desc') }}</DeleteWarningPanel>

      <div class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <p class="italic font-body font-600">"{{ props.quote?.name }}"</p>
        <p v-if="props.quote?.author || props.quote?.reference" class="text-gray-500 dark:text-gray-400">
          <span v-if="props.quote?.author">— {{ props.quote?.author?.name }}</span>
          <span v-if="props.quote?.author && props.quote?.reference" class="mx-1">•</span>
          <span v-if="props.quote?.reference">{{ props.quote?.reference?.name }}</span>
        </p>
        <p v-if="!canDelete" class="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
          {{ $t('components.dialogs.confirm_delete') }}
        </p>
      </div>
    </div>

    <template #submit>
      <PrimaryButton :disabled="!canDelete" :loading="submitting" @click="confirmDeletion" class="rounded-0 px-3">
        <span class="flex items-center gap-2">
          {{ $t('common.delete') }}
          <NIcon v-if="!submitting" name="i-tabler-trash-filled" class="inline-block" />
        </span>
      </PrimaryButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
interface Props {
  modelValue: boolean
  quote?: QuoteWithMetadata | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'quote-deleted'): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const { $t } = useI18n()
const { user } = useUserSession()
const { showErrorToast } = useErrorToast()

const isOpen = computed({
  get: () => props.modelValue,
  set: (v: boolean) => emit('update:modelValue', v)
})

const submitting = ref(false)

const canDelete = computed(() => {
  const role = user.value?.role
  const isAdmin = role === 'admin' || role === 'moderator'
  if (isAdmin) return true
  const ownerId = props.quote?.user?.id
  const isOwner = ownerId && user.value?.id === ownerId
  const isDraft = props.quote?.status === 'draft'
  return Boolean(isOwner && isDraft)
})

const confirmDeletion = async () => {
  if (!props.quote?.id) return
  submitting.value = true
  try {
    const deleteQuotePath = `/api/quotes/${props.quote.id}` as '/api/quotes/:id'
    await $fetch<{ success: boolean }, '/api/quotes/:id'>(deleteQuotePath, { method: 'DELETE' })
    useToast().toast({ toast: 'soft-success', title: String($t('components.dialogs.delete_quote')) })
    emit('quote-deleted')
    isOpen.value = false
  } catch (error: any) {
    console.error('Delete quote failed:', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.delete_quote')) })
  } finally {
    submitting.value = false
  }
}
</script>
