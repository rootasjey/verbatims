<template>
  <AppDialog
    v-model="isOpen"
    :title="title"
    :submit-text="$t('components.dialogs.submit') as string"
    :submitting="pending"
    :can-submit="canSubmit"
    @submit="onSubmit"
  >
    <form class="space-y-6" @submit.prevent="onSubmit" @keydown.ctrl.enter.prevent="onSubmit" @keydown.meta.enter.prevent="onSubmit">
      <div>
        <label class="block text-xs font-600 text-gray-900 dark:text-white mb-2">{{ $t('components.dialogs.report_category') }}</label>
        <NSelect v-model="form.category" :items="categories" item-key="label" value-key="label" />
      </div>

      <template v-if="!isAuthenticated">
        <NInput
          v-model="form.name"
          :placeholder="$t('components.dialogs.report_placeholder_name') as string"
          :disabled="pending"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.report_name') }}</NBadge>
          </template>
        </NInput>

        <NInput
          v-model="form.email"
          type="email"
          :placeholder="$t('components.dialogs.report_placeholder_email') as string"
          :disabled="pending"
          class="bg-white dark:bg-gray-900 b-none shadow-none"
          :una="{ inputTrailingWrapper: 'pr-1.5' }"
        >
          <template #trailing>
            <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.report_email') }}</NBadge>
          </template>
        </NInput>
      </template>

      <NInput
        autofocus
        type="textarea"
        v-model="form.message"
        :rows="5"
        :placeholder="$t('components.dialogs.report_placeholder_message') as string"
        required
        :disabled="pending"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5 bottom-2 top-initial' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.report_message') }}</NBadge>
        </template>
      </NInput>
      <div class="-mt-4 text-right text-xs text-gray-500">{{ form.message.length }}/4000</div>

      <NInput
        v-model="tagsInput"
        :placeholder="$t('components.dialogs.report_tags_placeholder') as string"
        :disabled="pending"
        class="bg-white dark:bg-gray-900 b-none shadow-none"
        :una="{ inputTrailingWrapper: 'pr-1.5' }"
      >
        <template #trailing>
          <NBadge size="xs" badge="soft-gray" rounded="1" class="py-0.5 text-sm">{{ $t('components.dialogs.report_tags') }}</NBadge>
        </template>
      </NInput>
    </form>

    <template #submit>
      <NButton btn="soft-blue" :loading="pending" :disabled="!canSubmit" @click="onSubmit">{{ $t('components.dialogs.submit') }}</NButton>
    </template>
  </AppDialog>
</template>

<script setup lang="ts">
import { useReportForm } from '~/composables/useReportForm'

interface Props {
  modelValue: boolean
  targetType?: ReportTargetType
  targetId?: number
  category?: ReportCategory
}

interface Emits {
  (e: 'update:modelValue', v: boolean): void
  (e: 'submitted'): void
}

const props = withDefaults(defineProps<Props>(), {
  targetType: 'general',
  targetId: undefined,
  category: undefined
})

const emit = defineEmits<Emits>()

const isOpen = computed({
  get: () => props.modelValue,
  set: v => emit('update:modelValue', v)
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
    console.error('Report submit error:', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Please try again.' })
  }
}
</script>
