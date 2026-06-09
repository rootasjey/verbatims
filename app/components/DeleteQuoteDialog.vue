<template>
  <AppDialog
    v-model="isOpen"
    title="Delete Quote"
    submit-text="Delete Quote"
    :submitting="submitting"
    :can-submit="canDelete"
    @submit="confirmDeletion"
  >
    <div class="space-y-4">
      <div class="bg-pink-50 dark:bg-blue-800/20 border border-pink-200 dark:border-blue-800 rounded-md p-3 flex items-start">
        <NIcon name="i-ph-warning" class="w-5 h-5 text-pink-600 dark:text-blue-600 mt-0.5 mr-2" />
        <div class="text-sm text-pink-800 dark:text-blue-300">
          <p class="font-medium">This action is permanent.</p>
          <p class="mt-1">You're about to delete this quote.</p>
        </div>
      </div>

      <div class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
        <p class="italic font-body font-600">"{{ props.quote?.name }}"</p>
        <p v-if="props.quote?.author || props.quote?.reference" class="text-gray-500 dark:text-gray-400">
          <span v-if="props.quote?.author">— {{ props.quote?.author?.name }}</span>
          <span v-if="props.quote?.author && props.quote?.reference" class="mx-1">•</span>
          <span v-if="props.quote?.reference">{{ props.quote?.reference?.name }}</span>
        </p>
        <p v-if="!canDelete" class="text-xs text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded p-2">
          You can only delete your own draft quotes. Ask a moderator if you need help.
        </p>
      </div>
    </div>

    <template #submit>
      <PrimaryButton :disabled="!canDelete" :loading="submitting" @click="confirmDeletion" class="rounded-0 px-3">
        <span class="flex items-center gap-2">
          Delete Quote
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

const { user } = useUserSession()

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
    await $fetch(`/api/quotes/${props.quote.id}`, { method: 'DELETE' })
    useToast().toast({ toast: 'success', title: 'Quote deleted' })
    emit('quote-deleted')
    isOpen.value = false
  } catch (error: any) {
    console.error('Delete quote failed:', error)
    const message = error?.data?.statusMessage || 'Failed to delete quote'
    useToast().toast({ toast: 'error', title: 'Error', description: message })
  } finally {
    submitting.value = false
  }
}
</script>
