import type { Ref } from 'vue'
import type { ReportCategory, ReportTargetType } from '~/types/report'

interface UseReportFormOptions {
  targetType?: ReportTargetType | Ref<ReportTargetType>
  targetId?: number | null | undefined | Ref<number | null | undefined>
}

export function useReportForm(options: UseReportFormOptions = {}) {
  const { user } = useUserSession()
  const isAuthenticated = computed(() => !!user.value)

  const categories = [
    { label: 'Bug', value: 'bug' as ReportCategory },
    { label: 'Feature', value: 'feature' as ReportCategory },
    { label: 'Feedback', value: 'feedback' as ReportCategory },
    { label: 'Content', value: 'content' as ReportCategory },
    { label: 'Other', value: 'other' as ReportCategory }
  ]

  const form = ref({
    category: categories[0],
    name: '',
    email: '',
    message: ''
  })

  const tagsInput = ref('')
  const pending = ref(false)

  const canSubmit = computed(() => form.value.message.trim().length >= 10)

  const reset = () => {
    form.value = { category: categories[0], name: '', email: '', message: '' }
    tagsInput.value = ''
  }

  const titleFor = (targetType: ReportTargetType) => {
    switch (targetType) {
      case 'quote': return 'Report Quote'
      case 'author': return 'Report Author'
      case 'reference': return 'Report Reference'
      default: return 'Send Feedback'
    }
  }

  const buildPayload = () => {
    const targetType = (unref(options.targetType) || 'general') as ReportTargetType
    const targetId = (unref(options.targetId) ?? null) as number | null

    const payload: any = {
      category: form.value.category.value as ReportCategory,
      message: form.value.message.trim(),
      tags: tagsInput.value
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
      target_type: targetType,
      target_id: targetId
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
      const res = await $fetch('/api/reports', { method: 'POST', body: payload })
      return res as { status: 'accepted' | 'ratelimited'; id?: number }
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
    form,
    tagsInput,
    pending,
    isAuthenticated,
    canSubmit,
    // helpers
    reset,
    submit,
    titleFor
  }
}
