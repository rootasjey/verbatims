<template>
  <NDrawer v-model:open="isOpen" direction="bottom">
    <template #body>
      <div class="p-5">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-title uppercase text-size-4 font-600">{{ title }}</h3>
          <NButton icon btn="ghost-gray" label="i-ph-x-bold" size="sm" @click="close" />
        </div>

        <form class="space-y-4" @submit.prevent="onSubmit">
          <div>
            <label class="block text-sm font-medium mb-1">{{ $t('components.dialogs.report_category') }}</label>
            <NSelect
              v-model="form.category"
              :items="categories"
              item-key="label"
              value-key="label"
            />
          </div>

          <div v-if="!isAuthenticated">
            <label class="block text-sm font-medium mb-1">{{ $t('components.dialogs.report_name') }}</label>
            <NInput v-model="form.name" :placeholder="$t('components.dialogs.report_placeholder_name') as string" />
          </div>

          <div v-if="!isAuthenticated">
            <label class="block text-sm font-medium mb-1">{{ $t('components.dialogs.report_email') }}</label>
            <NInput v-model="form.email" type="email" :placeholder="$t('components.dialogs.report_placeholder_email') as string" />
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t('components.dialogs.report_message') }}</label>
            <NInput
              type="textarea"
              v-model="form.message"
              :rows="5"
              :placeholder="$t('components.dialogs.report_placeholder_message') as string"
              required
            />
            <div class="mt-1 text-right text-xs text-gray-500">{{ form.message.length }}/4000</div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-1">{{ $t('components.dialogs.report_tags') }}</label>
            <NInput v-model="tagsInput" :placeholder="$t('components.dialogs.report_tags_placeholder') as string" />
          </div>
        </form>

        <div class="mt-5 flex gap-2">
          <NButton btn="light:soft dark:soft-white" class="flex-1" @click="close" :disabled="pending">{{ $t('common.cancel') }}</NButton>
          <NButton btn="soft-blue" class="flex-1" :loading="pending" :disabled="!canSubmit" @click="onSubmit">{{ $t('components.dialogs.submit') }}</NButton>
        </div>
      </div>
    </template>
  </NDrawer>
</template>

<script setup lang="ts">
import { useReportForm } from '~/composables/useReportForm'

interface Emits {
  (e: 'update:open', v: boolean): void
  (e: 'submitted'): void
}

const props = withDefaults(defineProps<{
  open?: boolean
  targetType?: ReportTargetType
  targetId?: number
  category?: ReportCategory
}>(), {
  targetType: 'general',
  targetId: undefined,
  category: undefined
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => !!props.open,
  set: v => emit('update:open', v)
})

const { $t } = useI18n()
const { toast } = useToast()
const { showErrorToast } = useErrorToast()

const {
  categories,
  form,
  tagsInput,
  pending,
  isAuthenticated,
  canSubmit,
  reset,
  submit,
  titleFor
} = useReportForm({
  targetType: computed(() => props.targetType),
  targetId: computed(() => props.targetId)
})

// Watch for drawer open and set category if provided
watch(
  () => isOpen.value,
  (open) => {
    if (!open || !props.category) return
    const found = categories.find(c => c.value === props.category)
    if (found) form.value.category = found
  }
)

const title = computed(() => titleFor(props.targetType))

const close = () => { isOpen.value = false; reset() }

const onSubmit = async () => {
  if (!canSubmit.value || pending.value) return
  try {
    const res = await submit()
    if (res?.status === 'ratelimited') {
      showErrorToast(null, { title: 'Too many messages', fallback: 'Please slow down and try again later.' })
      return
    }
    
    toast({ title: String($t('components.dialogs.report_thanks')), toast: 'success' })
    emit('submitted')
    close()
  } catch (error) {
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Please try again.' })
  }
}
</script>
