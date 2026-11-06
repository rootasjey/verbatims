export type DashboardQuoteMutationStatus = 'draft' | 'pending' | 'approved' | 'rejected'

export interface DashboardQuoteMutation {
  revision: number
  type: 'created' | 'updated' | 'deleted' | 'status-changed'
  quoteIds: number[]
  fromStatus?: DashboardQuoteMutationStatus
  toStatus?: DashboardQuoteMutationStatus
}

export function useDashboardQuoteEvents() {
  const latestMutation = useState<DashboardQuoteMutation | null>('dashboard-quote-mutation', () => null)

  const publishMutation = (mutation: Omit<DashboardQuoteMutation, 'revision'>) => {
    latestMutation.value = {
      ...mutation,
      revision: (latestMutation.value?.revision ?? 0) + 1
    }
  }

  return { latestMutation, publishMutation }
}
