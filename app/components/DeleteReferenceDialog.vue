<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-2">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">Delete Reference</h3>
      </div>

      <div class="px-1 space-y-4">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
          <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <div class="text-sm text-red-800 dark:text-red-300">
            <p class="font-medium">This action is permanent.</p>
            <p class="mt-1">You're about to delete the reference <span class="font-semibold">{{ props.reference?.name }}</span>.</p>
          </div>
        </div>

        <div v-if="quotesCount > 0" class="space-y-3">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            This reference is linked to <span class="font-semibold">{{ quotesCount }}</span> quote(s).
            Choose how to handle them:
          </p>

          <NRadioGroup v-model="strategy" class="space-y-2">
            <NRadioGroupItem value="delete" class="flex items-start gap-3">
              <div class="w-4 h-4 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Delete related quotes</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Remove all {{ quotesCount }} quote(s) referencing {{ props.reference?.name }}.</div>
              </div>
            </NRadioGroupItem>
            <NRadioGroupItem value="anonymize" class="flex items-start gap-3">
              <div class="w-4 h-4 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Anonymize related quotes</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Keep the quotes but remove the reference (set source to unknown).</div>
              </div>
            </NRadioGroupItem>
          </NRadioGroup>
        </div>

        <div v-else class="text-sm text-gray-700 dark:text-gray-300">
          No related quotes were found. You can safely delete this reference.
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">Cancel</NButton>
        <NButton btn="soft-red" :loading="submitting" @click="confirmDeletion">
          Delete Reference
        </NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
import type { QuoteReferenceWithMetadata } from '~/types/quote-reference'

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
const strategy = ref<'delete' | 'anonymize'>(quotesCount.value > 0 ? 'anonymize' : 'delete')

watch(() => props.reference?.id, async (newId) => {
  if (!newId) return
  try {
    const res: any = await $fetch(`/api/admin/references/${newId}`)
    quotesCount.value = Number(res?.data?.quotes_count || 0)
    if (quotesCount.value === 0) strategy.value = 'delete'
  } catch (e) {
    console.error('Failed to fetch reference details', e)
  }
}, { immediate: true })

const closeDialog = () => {
  isOpen.value = false
}

const confirmDeletion = async () => {
  if (!props.reference) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/references/${props.reference.id}`, {
      method: 'DELETE',
      body: quotesCount.value > 0 ? { strategy: strategy.value } : undefined
    })

    useToast().toast({
      toast: 'success',
      title: 'Reference deleted',
      description: quotesCount.value > 0
        ? (strategy.value === 'delete' ? `Reference and ${quotesCount.value} related quote(s) deleted.` : `Reference deleted. ${quotesCount.value} quote(s) anonymized.`)
        : 'Reference deleted successfully.'
    })

    emit('reference-deleted')
    isOpen.value = false
  } catch (error: any) {
    console.error('Delete reference failed:', error)
    const message = error?.data?.statusMessage || 'Failed to delete reference'
    useToast().toast({ toast: 'error', title: 'Error', description: message })
  } finally {
    submitting.value = false
  }
}
</script>
