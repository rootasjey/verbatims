<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('components.dialogs.delete_tag') as string"
    :submitting="submitting"
    cancel-button-class="min-h-10"
    :can-submit="!deleteDisabled"
    @submit="confirmDelete"
  >
    <div class="space-y-5">
      <p class="font-semibold text-gray-900 dark:text-gray-100">#{{ tag?.name }}</p>

      <DeleteWarningPanel>
        <p>
          <template v-if="usageLoading">{{ $t('common.loading') }}</template>
          <template v-else-if="usageError">{{ $t('components.dialogs.delete_tag_usage_error') }}</template>
          <template v-else-if="usageCount > 0">
            {{ $t(usageCount === 1 ? 'components.dialogs.delete_tag_one_related_quote' : 'components.dialogs.delete_tag_many_related_quotes', { count: usageCount }) }}
          </template>
          <template v-else>{{ $t('components.dialogs.delete_tag_no_related_quotes') }}</template>
        </p>
      </DeleteWarningPanel>

      <NCheckbox
        v-if="usageCount >= highUsageThreshold && !usageError"
        v-model="confirmHighUsage"
        checkbox="gray"
        :label="$t('components.dialogs.delete_tag_high_usage_confirmation', { count: usageCount }) as string"
      />
    </div>

    <template #submit>
      <NButton :btn="deleteDisabled ? 'soft-gray' : 'solid-red'" :loading="submitting" :disabled="deleteDisabled" class="min-h-10 px-4" @click="confirmDelete">
        {{ $t('common.delete') }}
      </NButton>
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
const usageError = ref(false)
const { $t } = useI18n()
const highUsageThreshold = 20
const { showErrorToast } = useErrorToast()
const deleteDisabled = computed(() => submitting.value || usageLoading.value || usageError.value || (usageCount.value >= highUsageThreshold && !confirmHighUsage.value))

const confirmDelete = async () => {
  if (!props.tag || deleteDisabled.value) return
  submitting.value = true
  try {
    const deleteTagPath = `/api/admin/tags/${props.tag.id}` as '/api/admin/tags/:id'
    await $fetch<{ success: boolean }, '/api/admin/tags/:id'>(deleteTagPath, { method: 'DELETE' })
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
    usageError.value = false
    usageLoading.value = true
    try {
      type TagUsageResponse = { data?: { quotes_count?: number } }
      const tagPath = `/api/admin/tags/${props.tag.id}` as '/api/admin/tags/:id'
      const res = await $fetch<TagUsageResponse, '/api/admin/tags/:id'>(tagPath)
      usageCount.value = Number(res.data?.quotes_count || 0)
    } catch (e) {
      usageError.value = true
      usageCount.value = 0
      console.error('Failed to fetch tag usage', e)
    } finally {
      usageLoading.value = false
    }
  }
})
</script>
