<template>
  <AppDialog
    v-model="isOpen"
    :title="title"
    title-class="sr-only"
    :submit-text="submitText"
    :cancel-text="$t('components.app_dialog.cancel') as string"
    :submitting="pending"
    :can-submit="canSubmit"
    max-width="lg"
    scrollable
    @submit="onSubmit"
  >
    <template #header-title>
      <NSelect
        v-model="form.category"
        :items="categories"
        item-key="label"
        value-key="label"
        :aria-label="$t('components.dialogs.report_category') as string"
        :disabled="pending"
        class="w-full max-w-64"
      />
    </template>

    <form ref="reportFormRef" class="mx-auto max-w-xl space-y-5 px-2 font-sans" @submit.prevent="onSubmit" @keydown.ctrl.enter.prevent="onSubmit" @keydown.meta.enter.prevent="onSubmit">
      <div class="space-y-2">
        <div class="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
          <label for="report-message" class="sr-only">{{ $t('components.dialogs.report_message') }}</label>
          <p class="text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ messageHint }}</p>
        </div>
        <div class="relative">
          <NInput
            id="report-message"
            v-model="form.message"
            autofocus
            type="textarea"
            :rows="5"
            maxlength="4000"
            :placeholder="messagePlaceholder"
            required
            :disabled="pending"
            class="w-full bg-gray-50 text-base shadow-none dark:bg-neutral-900"
            :una="{ input: 'pb-10 pr-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/70 dark:focus-visible:ring-gray-500' }"
          />
          <span class="pointer-events-none absolute bottom-3 right-3 font-sans text-xs tabular-nums text-gray-500 dark:text-gray-400" aria-live="polite" :aria-label="String($t('components.dialogs.character_count', { count: form.message.length }))">{{ form.message.length }}/4000</span>
        </div>
      </div>

      <div v-if="!isAuthenticated" class="grid gap-4 sm:grid-cols-2">
        <div class="space-y-2">
          <label for="report-name" class="block text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('components.dialogs.report_name') }}</label>
          <NInput
            id="report-name"
            v-model="form.name"
            :placeholder="$t('components.dialogs.report_placeholder_name') as string"
            :disabled="pending"
            class="w-full bg-gray-50 shadow-none dark:bg-neutral-900"
          />
        </div>
        <div class="space-y-2">
          <label for="report-email" class="block text-sm font-600 text-gray-900 dark:text-gray-100">{{ $t('components.dialogs.report_email') }}</label>
          <NInput
            id="report-email"
            v-model="form.email"
            type="email"
            :placeholder="$t('components.dialogs.report_placeholder_email') as string"
            :disabled="pending"
            class="w-full bg-gray-50 shadow-none dark:bg-neutral-900"
          />
        </div>
        <p class="col-span-full -mt-2 text-xs text-gray-500 dark:text-gray-400">{{ $t('components.dialogs.report_contact_hint') }}</p>
      </div>

      <p v-if="form.category?.value === 'feedback'" class="text-xs text-gray-500 dark:text-gray-400">
        {{ $t('components.dialogs.report_prefer_email') }}
        <a :href="`mailto:${supportEmail}`" class="underline decoration-dotted underline-offset-2 hover:text-gray-700 dark:hover:text-gray-300">{{ supportEmail }}</a>
      </p>
    </form>
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
const supportEmail = 'support@verbatims.cc'
const reportFormRef = ref<HTMLFormElement | null>(null)

const {
  categories,
  form,
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
    if (!open) return
    const category = props.category ?? 'bug'
    const found = categories.value.find(item => item.value === category)
    if (found) form.value.category = found
  }
)

const categoryValue = computed(() => form.value.category?.value ?? 'bug')
const title = computed(() => titleFor(props.targetType, categoryValue.value))
const submitText = computed(() => String($t(categoryValue.value === 'content' ? 'components.dialogs.report_suggest_submit' : 'components.dialogs.report_submit')))
const messagePlaceholder = computed(() => String($t(categoryValue.value === 'bug' ? 'components.dialogs.report_placeholder_bug' : categoryValue.value === 'content' ? 'components.dialogs.report_placeholder_content' : 'components.dialogs.report_placeholder_message')))
const messageHint = computed(() => String($t(categoryValue.value === 'bug' ? 'components.dialogs.report_bug_hint' : categoryValue.value === 'content' ? 'components.dialogs.report_content_hint' : 'components.dialogs.report_message_hint')))

const close = () => { isOpen.value = false; reset() }

const onSubmit = async () => {
  if (!canSubmit.value || pending.value) return
  if (!reportFormRef.value?.reportValidity()) return
  try {
    const res = await submit()
    if (res?.status === 'ratelimited') {
      showErrorToast(null, { title: String($t('components.dialogs.report_rate_limited_title')), fallback: String($t('components.dialogs.report_rate_limited')) })
      return
    }

    toast({
      title: String($t('components.dialogs.report_thanks')),
      toast: 'soft-gray',
      leading: 'i-ph-check-circle text-emerald-700 dark:text-emerald-400'
    })
    emit('submitted')
    close()
  } catch (error) {
    console.error('Report submit error:', error)
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: String($t('components.dialogs.report_submit_error')) })
  }
}
</script>
