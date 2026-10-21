<template>
  <NDrawer v-model:open="isOpen" direction="bottom">
    <template #body>
      <div class="p-5">
        <div class="mb-4 flex items-center justify-between gap-3">
          <div v-if="imageReport" class="min-w-0">
            <h3 class="font-serif text-xl font-300 text-gray-900 dark:text-gray-100">{{ title }}</h3>
            <p class="mt-1 font-sans text-xs leading-relaxed text-gray-500 dark:text-gray-400">
              {{ $t('components.dialogs.image_report_context', { variant: String($t(`components.dialogs.image_report_variant_${imageReport.imageVariant}`)) }) }}
            </p>
          </div>
          <h3 v-else class="sr-only">{{ title }}</h3>
          <NSelect
            v-if="!imageReport"
            v-model="form.category"
            :items="categories"
            item-key="label"
            value-key="label"
            :aria-label="$t('components.dialogs.report_category') as string"
            class="min-w-0 flex-1"
          />
          <NButton icon btn="ghost-gray" label="i-ph-x-bold" size="sm" @click="close" />
        </div>

        <form class="space-y-4 px-2 font-sans" @submit.prevent="onSubmit">
          <div v-if="imageReport" class="space-y-2">
            <NSelect
              v-model="form.imageReportSubject"
              :items="imageReportSubjects"
              item-key="label"
              value-key="label"
              :aria-label="$t('components.dialogs.image_report_reason_label') as string"
              :disabled="pending"
              class="w-full"
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
            <label for="mobile-report-message" class="mb-2 block text-sm font-medium">{{ $t('components.dialogs.report_message') }}</label>
            <div class="relative">
              <NInput
                id="mobile-report-message"
                autofocus
                type="textarea"
                v-model="form.message"
                :rows="5"
                maxlength="4000"
                :placeholder="messagePlaceholder"
                required
                class="w-full bg-gray-50 text-base shadow-none dark:bg-neutral-900"
                :una="{ input: 'pb-10 pr-14 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gray-400/70 dark:focus-visible:ring-gray-500' }"
              />
              <span class="pointer-events-none absolute bottom-3 right-3 font-sans text-xs tabular-nums text-gray-500 dark:text-gray-400" aria-live="polite" :aria-label="String($t('components.dialogs.character_count', { count: form.message.length }))">{{ form.message.length }}/4000</span>
            </div>
            <p class="mt-2 text-xs leading-relaxed text-gray-500 dark:text-gray-400">{{ messageHint }}</p>
          </div>
        </form>

        <div class="mt-5 flex gap-2">
          <NButton btn="ghost-gray" class="flex-1" @click="close" :disabled="pending">{{ $t('common.cancel') }}</NButton>
          <NButton btn="solid-black" class="min-h-10 flex-1 rounded-1 px-4" :loading="pending" :disabled="!canSubmit" @click="onSubmit">
            {{ submitText }}
            <NIcon v-if="!pending" name="i-ph-arrow-right" class="ml-2 h-4 w-4" aria-hidden="true" />
          </NButton>
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
  imageReport?: { themeId: number; imageVariant: ThemeImageVariant }
}>(), {
  targetType: 'general',
  targetId: undefined,
  category: undefined,
  imageReport: undefined
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
  pending,
  isAuthenticated,
  canSubmit,
  reset,
  submit,
  titleFor,
  imageReportSubjects
} = useReportForm({
  targetType: computed(() => props.targetType),
  targetId: computed(() => props.targetId),
  imageReport: computed(() => props.imageReport ?? null)
})

// Watch for drawer open and set category if provided
watch(
  () => isOpen.value,
  (open) => {
  if (!open || (!props.category && !props.imageReport)) return
  const category = props.imageReport ? 'content' : props.category
  const found = categories.value.find(c => c.value === category)
    if (found) form.value.category = found
  }
)

const title = computed(() => props.imageReport ? String($t('components.dialogs.image_report_title')) : titleFor(props.targetType, form.value.category?.value ?? 'bug'))
const submitText = computed(() => String($t(props.imageReport ? 'components.dialogs.report_submit' : form.value.category?.value === 'content' ? 'components.dialogs.report_suggest_submit' : 'components.dialogs.report_submit')))
const messagePlaceholder = computed(() => String($t(props.imageReport ? 'components.dialogs.image_report_placeholder' : form.value.category?.value === 'bug' ? 'components.dialogs.report_placeholder_bug' : form.value.category?.value === 'content' ? 'components.dialogs.report_placeholder_content' : 'components.dialogs.report_placeholder_message')))
const messageHint = computed(() => String($t(props.imageReport ? 'components.dialogs.image_report_hint' : form.value.category?.value === 'bug' ? 'components.dialogs.report_bug_hint' : form.value.category?.value === 'content' ? 'components.dialogs.report_content_hint' : 'components.dialogs.report_message_hint')))

const close = () => { isOpen.value = false; reset() }

const onSubmit = async () => {
  if (!canSubmit.value || pending.value) return
  try {
    const res = await submit()
    if (res?.status === 'ratelimited') {
      showErrorToast(null, { title: 'Too many messages', fallback: 'Please slow down and try again later.' })
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
    showErrorToast(error, { title: String($t('components.dialogs.toast_error')), fallback: 'Please try again.' })
  }
}
</script>
