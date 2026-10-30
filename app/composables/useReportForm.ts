import type { Ref } from 'vue'
import { fetchApi } from '~/utils/fetchApi'

interface UseReportFormOptions {
  targetType?: ReportTargetType | Ref<ReportTargetType>
  targetId?: number | null | undefined | Ref<number | null | undefined>
  imageReport?: Ref<{ themeId: number; imageVariant: ThemeImageVariant } | null>
  entityImageReport?: Ref<{ targetType: EntityImageReportTargetType; targetId: number } | null>
}

export function useReportForm(options: UseReportFormOptions = {}) {
  const { $t } = useI18n()
  const { user } = useUserSession()
  const isAuthenticated = computed(() => !!user.value)

  const categories = computed<Array<{ label: string; value: ReportCategory }>>(() => [
    { label: String($t('components.dialogs.report_category_bug')), value: 'bug' },
    { label: String($t('components.dialogs.report_category_feature')), value: 'feature' },
    { label: String($t('components.dialogs.report_category_feedback')), value: 'feedback' },
    { label: String($t('components.dialogs.report_category_content')), value: 'content' },
    { label: String($t('components.dialogs.report_category_other')), value: 'other' }
  ])

  const imageReportSubjects = computed<Array<{ label: string; value: ThemeImageReportSubject }>>(() => [
    { label: String($t('components.dialogs.image_report_reason_rights')), value: 'image_rights' },
    { label: String($t('components.dialogs.image_report_reason_credit')), value: 'image_credit' },
    { label: String($t('components.dialogs.image_report_reason_removal')), value: 'image_removal' },
    { label: String($t('components.dialogs.image_report_reason_other')), value: 'image_other' }
  ])

  const form = ref({
    category: categories.value[0],
    imageReportSubject: imageReportSubjects.value[0]!,
    name: '',
    email: '',
    message: ''
  })

  const pending = ref(false)

  const canSubmit = computed(() => form.value.message.trim().length >= 10
    && (isAuthenticated.value || !!form.value.name.trim() || !!form.value.email.trim()))
  const hasImageReport = computed(() => !!options.imageReport?.value || !!options.entityImageReport?.value)

  const reset = () => {
    form.value = { category: categories.value[0], imageReportSubject: imageReportSubjects.value[0]!, name: '', email: '', message: '' }
  }

  const titleFor = (targetType: ReportTargetType, category: ReportCategory) => {
    if (category === 'content') {
      return String($t(targetType === 'quote' ? 'components.dialogs.report_title_suggest_edit' : 'components.dialogs.report_title_content'))
    }
    if (targetType === 'general') {
      if (category === 'bug') return String($t('components.dialogs.report_title_issue'))
      if (category === 'feature') return String($t('components.dialogs.report_title_feature'))
      return String($t('components.dialogs.report_title_feedback'))
    }

    switch (targetType) {
      case 'quote': return String($t('components.dialogs.report_title_quote'))
      case 'author': return String($t('components.dialogs.report_title_author'))
      case 'reference': return String($t('components.dialogs.report_title_reference'))
      default: return String($t('components.dialogs.report_title_feedback'))
    }
  }

  const buildPayload = () => {
    const targetType = (unref(options.targetType) || 'general') as ReportTargetType
    const targetId = (unref(options.targetId) ?? null) as number | null

    const payload: any = {
      category: (hasImageReport.value ? 'content' : form.value.category?.value ?? categories.value[0]!.value) as ReportCategory,
      message: form.value.message.trim(),
      target_type: targetType,
      target_id: targetId
    }

    if (options.imageReport?.value) {
      payload.theme_image_report = {
        subject: form.value.imageReportSubject.value,
        theme_id: options.imageReport.value.themeId,
        image_variant: options.imageReport.value.imageVariant
      }
    } else if (options.entityImageReport?.value) {
      payload.entity_image_report = {
        subject: form.value.imageReportSubject.value,
        target_type: options.entityImageReport.value.targetType,
        target_id: options.entityImageReport.value.targetId
      }
    }

    if (!isAuthenticated.value) {
      payload.name = form.value.name?.trim() || undefined
      payload.email = form.value.email?.trim() || undefined
    }

    return payload
  }

  const submit = async () => {
    if (!canSubmit.value || pending.value) return null
    pending.value = true
    try {
      const payload = buildPayload()
      const res = await fetchApi<{ success: boolean; data: { status: 'accepted' | 'ratelimited'; id?: number } }>('/api/reports', { method: 'POST', body: payload })
      return res.data as { status: 'accepted' | 'ratelimited'; id?: number }
    } catch (err) {
      console.error('Report submit error:', err)
      throw err
    } finally {
      pending.value = false
    }
  }

  return {
    // state
    categories,
    imageReportSubjects,
    form,
    pending,
    isAuthenticated,
    canSubmit,
    // helpers
    reset,
    submit,
    titleFor
  }
}
