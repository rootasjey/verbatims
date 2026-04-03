import { computed, unref, type MaybeRef } from 'vue'

const ONE_WEEK_MS = 7 * 24 * 60 * 60 * 1000

type QuotePostingUser = {
  role?: 'admin' | 'moderator' | 'user'
  email_verified?: boolean
  created_at?: string
}

export function useQuoteSubmissionEligibility(user: MaybeRef<QuotePostingUser | null | undefined>) {
  const canSubmitForReview = computed(() => {
    const currentUser = unref(user)
    if (!currentUser || currentUser.role !== 'user') return true
    if (!currentUser.email_verified) return false

    const createdAtMs = new Date(currentUser.created_at || '').getTime()
    if (!Number.isFinite(createdAtMs)) return false

    return Date.now() - createdAtMs >= ONE_WEEK_MS
  })

  const restrictionMessage = computed(() => {
    if (canSubmitForReview.value) return ''

    const currentUser = unref(user)
    if (!currentUser || currentUser.role !== 'user') return ''
    if (!currentUser.email_verified) return 'Verify your email before submitting drafts for review.'
    return 'Your account must be at least 7 days old before submitting drafts for review.'
  })

  return {
    canSubmitForReview,
    restrictionMessage,
  }
}