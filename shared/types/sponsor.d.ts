export interface SponsorMessage {
  id: number
  message: string
  leading_icon?: string | null
  trailing_icon?: string | null
  url?: string | null
  type: 'internal' | 'sponsored'
  status: 'pending' | 'approved' | 'rejected'
  rejection_reason?: string | null
  priority: number
  starts_at?: string | null
  ends_at?: string | null
  max_views?: number | null
  views_count: number
  clicks_count: number
  user_id?: number | null
  paid: boolean
  payment_ref?: string | null
  created_at: string | number
  updated_at: string | number
}

export interface SponsorMessageFormData {
  message: string
  leading_icon?: string | null
  trailing_icon?: string | null
  url?: string | null
  type: 'internal' | 'sponsored'
  status: 'pending' | 'approved' | 'rejected'
  priority: number
  starts_at?: string | null
  ends_at?: string | null
  max_views?: number | null
}
