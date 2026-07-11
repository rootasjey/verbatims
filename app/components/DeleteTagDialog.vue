<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_tag') as string"
    :submit-text="$t('common.delete') as string"
    :submitting="submitting"
    :can-submit="usageCount < highUsageThreshold || confirmHighUsage"
    @submit="confirmDelete"
  >
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">
      {{ $t('components.dialogs.confirm_delete') }} <span class="font-medium">#{{ tag?.name }}</span>? {{ $t('components.dialogs.confirm_delete_desc') }}
    </p>
    <p v-if="usageLoading" class="text-xs text-gray-500 dark:text-gray-400 mb-6">{{ $t('common.loading') }}</p>
    <p v-else class="text-xs text-gray-500 dark:text-gray-400 mb-6">
      {{ $t('common.quote_plural') }}: <span class="font-medium">{{ usageCount }}</span>
    </p>
    <div v-if="usageCount >= highUsageThreshold" class="mb-4">
      <NCheckbox v-model="confirmHighUsage" :label="$t('components.dialogs.confirm_delete') as string" />
    </div>

    <template #submit>
      <NButton btn="soft-red" :loading="submitting" :disabled="usageCount >= highUsageThreshold && !confirmHighUsage" @click="confirmDelete">{{ $t('common.delete') }}</NButton>
    </template>
  </AppDialog>
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
const { $t } = useI18n()
const highUsageThreshold = 20
const { showErrorToast } = useErrorToast()

const confirmDelete = async () => {
  if (!props.tag) return
  submitting.value = true
  try {
    await $fetch(`/api/admin/tags/${props.tag.id}`, { method: 'DELETE' })
    useToast().toast({ toast: 'soft-success', title: String($t('components.dialogs.delete_tag')) })
    emit('tag-deleted')
    isOpen.value = false
  } catch (error) {
    console.error('Failed to delete tag', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.delete_tag')) })
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
