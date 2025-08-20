export type ReportCategory = 'bug' | 'feature' | 'feedback' | 'content' | 'other'
export type ReportTargetType = 'general' | 'quote' | 'author' | 'reference'
export type ReportStatus = 'new' | 'triaged' | 'spam' | 'resolved'

export interface UserMessage {
  id: number
  user_id: number | null
  name: string | null
  email: string | null
  category: ReportCategory
  tags: string[]
  message: string
  target_type: ReportTargetType
  target_id: number | null
  ip_address: string | null
  user_agent: string | null
  status: ReportStatus
  reviewed_by: number | null
  reviewed_at: string | null
  created_at: string
}

export interface CreateUserMessageInput {
  category: ReportCategory
  message: string
  tags?: string[]
  name?: string
  email?: string
  target_type?: ReportTargetType
  target_id?: number | null
}

export interface CreateUserMessageResult {
  id: number
  status: 'accepted' | 'ratelimited'
}

/**
 * Admin-facing user message type with related info and computed fields
 */
export interface AdminUserMessage extends UserMessage {
  /** Reporter user name (if authenticated) */
  user_name?: string | null
  /** Reporter user email (if authenticated) */
  user_email?: string | null
  /** Convenience label for the target derived from joins */
  target_label: string
  /** Raw joined fields (optional, may be omitted by clients) */
  quote_text?: string | null
  author_name?: string | null
  reference_name?: string | null
}

/**
 * API response shape for admin messages listing
 */
export interface AdminMessagesListResponse {
  data: AdminUserMessage[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}
