<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-md lg:max-w-lg' }">
    <div>
      <div class="mb-2">
        <h3 class="font-title uppercase text-size-4 font-600 ml-4">Delete Author</h3>
      </div>

      <div class="px-1 space-y-4">
        <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md p-3 flex items-start">
          <NIcon name="i-ph-warning" class="w-5 h-5 text-red-600 mt-0.5 mr-2" />
          <div class="text-sm text-red-800 dark:text-red-300">
            <p class="font-medium">This action is permanent.</p>
            <p class="mt-1">You're about to delete the author <span class="font-semibold">{{ props.author?.name }}</span>.</p>
          </div>
        </div>

        <div v-if="quotesCount > 0" class="space-y-3">
          <p class="text-sm text-gray-700 dark:text-gray-300">
            This author has <span class="font-semibold">{{ quotesCount }}</span> related quote(s).
            Choose how to handle them:
          </p>

          <NRadioGroup v-model="strategy" class="space-y-2">
            <NRadioGroupItem value="delete" class="flex items-start gap-3">
              <div class="w-4 h-4 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Delete related quotes</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Remove all {{ quotesCount }} quote(s) authored by {{ props.author?.name }}.</div>
              </div>
            </NRadioGroupItem>
            <NRadioGroupItem value="anonymize" class="flex items-start gap-3">
              <div class="w-4 h-4 mt-1" />
              <div>
                <div class="text-sm font-medium text-gray-900 dark:text-white">Anonymize related quotes</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">Keep the quotes but remove the author attribution (set author to unknown).</div>
              </div>
            </NRadioGroupItem>
          </NRadioGroup>
        </div>

        <div v-else class="text-sm text-gray-700 dark:text-gray-300">
          No related quotes were found. You can safely delete this author.
        </div>
      </div>

      <div class="mt-6 flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" @click="closeDialog" :disabled="submitting">Cancel</NButton>
        <NButton btn="soft-red" :loading="submitting" @click="confirmDeletion">
          Delete Author
        </NButton>
      </div>
    </div>
  </NDialog>
  
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
// Default to anonymize for safety when quotes exist
const strategy = ref<'delete' | 'anonymize'>(quotesCount.value > 0 ? 'anonymize' : 'delete')

watch(() => props.author?.id, async (newId) => {
  if (!newId) return
  // Refresh quotes count from API for accuracy
  try {
    const res: any = await $fetch(`/api/admin/authors/${newId}`)
    quotesCount.value = Number(res?.data?.quotes_count || 0)
    if (quotesCount.value === 0) strategy.value = 'delete'
  } catch (e) {
    // keep existing count on failure
    console.error('Failed to fetch author details', e)
  }
}, { immediate: true })

const closeDialog = () => {
  isOpen.value = false
}

const confirmDeletion = async () => {
  if (!props.author) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/authors/${props.author.id}`, {
      method: 'DELETE',
      body: quotesCount.value > 0 ? { strategy: strategy.value } : undefined
    })

    useToast().toast({
      toast: 'success',
      title: 'Author deleted',
      description: quotesCount.value > 0
        ? (strategy.value === 'delete' ? `Author and ${quotesCount.value} related quote(s) deleted.` : `Author deleted. ${quotesCount.value} quote(s) anonymized.`)
        : 'Author deleted successfully.'
    })

    emit('author-deleted')
    isOpen.value = false
  } catch (error: any) {
    console.error('Delete author failed:', error)
    const message = error?.data?.statusMessage || 'Failed to delete author'
    useToast().toast({ toast: 'error', title: 'Error', description: message })
  } finally {
    submitting.value = false
  }
}
</script>
