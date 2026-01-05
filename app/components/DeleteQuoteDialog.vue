<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-2">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">Delete Quote</h3>
      </div>

      <div class="px-1 space-y-4">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
          <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <div class="text-sm text-red-800 dark:text-red-300">
            <p class="font-medium">This action is permanent.</p>
            <p class="mt-1">You're about to delete this quote.</p>
          </div>
        </div>

        <div class="text-sm text-gray-700 dark:text-gray-300 space-y-2">
          <p class="italic font-serif">"{{ props.quote?.name }}"</p>
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

      <div class="mt-6 flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">Cancel</NButton>
        <NButton btn="soft-red" :loading="submitting" :disabled="!canDelete || submitting" @click="confirmDeletion">
          Delete Quote
        </NButton>
      </div>
    </div>
  </NDialog>
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

const closeDialog = () => {
  isOpen.value = false
}

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
