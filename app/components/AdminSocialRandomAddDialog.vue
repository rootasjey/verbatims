<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('admin_social.add_random') as string"
    :submit-text="$t('admin_social.add_random_button') as string"
    :submitting="loading"
    @submit="emit('confirm')"
  >
    <p class="text-sm text-gray-600 dark:text-gray-400 mb-6">{{ $t('admin_social.add_random_desc') }}</p>

    <NInput
      v-model="countModel"
      type="number"
      min="1"
      class="w-28 bg-white dark:bg-gray-900 b-none shadow-none"
      :una="{ inputTrailingWrapper: 'pr-1.5' }"
    >
      <template #trailing>
        <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('admin_social.count_badge') }}</NBadge>
      </template>
    </NInput>

  </AppDialog>
</template>

<script setup lang="ts">
const { $t } = useI18n()

interface Props {
  open: boolean
  count: string
  loading: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'update:count', value: string): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})

const countModel = computed({
  get: () => props.count,
  set: (value: string) => emit('update:count', value)
})
</script>
