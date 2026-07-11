<template>
  <AppDialog
    v-model="isOpen"
    :title="$t('admin_social.clear_all') as string"
    :submitting="loading"
    @submit="emit('confirm')"
  >
    <p class="text-gray-600 dark:text-gray-400">
      {{ $t('admin_social.clear_all_confirm', { platform: platformLabels[selectedPlatform] || selectedPlatform }) }}
    </p>

    <template #submit>
      <NButton btn="soft-red" :loading="loading" @click="emit('confirm')">{{ $t('admin_social.clear_all_button') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import type { SocialPlatform } from '~~/shared/constants/social'

const { $t } = useI18n()

interface Props {
  open: boolean
  loading: boolean
  selectedPlatform: SocialPlatform
  platformLabels: Record<SocialPlatform, string>
}

const props = defineProps<Props>()
const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'confirm'): void
}>()

const isOpen = computed({
  get: () => props.open,
  set: (value: boolean) => emit('update:open', value)
})
</script>
