<template>
  <NDialog v-model:open="isOpen" :una="{ dialogContent: 'md:max-w-sm' }">
    <div>
      <h3 class="font-title uppercase text-size-4 font-600 mb-3 ml-4">Delete Tag</h3>
      <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
        Are you sure you want to delete <span class="font-medium">#{{ tag?.name }}</span>? This will remove it from all quotes.
      </p>
      <p v-if="usageLoading" class="text-xs text-gray-500 dark:text-gray-400 mb-6">Loading usage…</p>
      <p v-else class="text-xs text-gray-500 dark:text-gray-400 mb-6">
        Usage: <span class="font-medium">{{ usageCount }}</span> quote<span v-if="usageCount !== 1">s</span>.
      </p>
      <div v-if="usageCount >= highUsageThreshold" class="mb-4">
        <NCheckbox v-model="confirmHighUsage" label="I understand this will remove the tag from many quotes" />
      </div>
      <div class="flex justify-end gap-3">
        <NButton btn="light:soft dark:soft-white" :disabled="submitting" @click="close">Cancel</NButton>
        <NButton btn="soft-red" :loading="submitting" :disabled="usageCount >= highUsageThreshold && !confirmHighUsage" @click="confirmDelete">Delete</NButton>
      </div>
    </div>
  </NDialog>
</template>

<script setup lang="ts">
interface Props { modelValue: boolean; tag: Pick<Tag,'id'|'name'> | null }
interface Emits { (e:'update:modelValue', v:boolean):void; (e:'tag-deleted'):void }

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const isOpen = computed({ get:() => props.modelValue, set:v => emit('update:modelValue', v) })
const submitting = ref(false)
const usageCount = ref(0)
const usageLoading = ref(false)
const confirmHighUsage = ref(false)
const highUsageThreshold = 20

const close = () => { isOpen.value = false }
const confirmDelete = async () => {
  if (!props.tag) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/tags/${props.tag.id}`, { method: 'DELETE' })
    useToast().toast({ toast: 'success', title: 'Tag Deleted' })
    emit('tag-deleted')
    close()
  } catch (error) {
    console.error('Failed to delete tag', error)
    useToast().toast({ toast: 'error', title: 'Error', description: 'Failed to delete tag' })
  } finally {
    submitting.value = false
  }
}

watch(isOpen, async (open) => {
  if (open && props.tag) {
    confirmHighUsage.value = false
    usageLoading.value = true
    try {
      type TagUsageResponse = { data?: { quotes_count?: number } }
      const res = await $fetch<TagUsageResponse>(`/api/admin/tags/${props.tag.id}`)
      usageCount.value = Number(res.data?.quotes_count || 0)
    } catch (e) {
      usageCount.value = 0
    } finally {
      usageLoading.value = false
    }
  }
})
</script>
