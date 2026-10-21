export type ReportCategory = 'bug' | 'feature' | 'feedback' | 'content' | 'other'
export type ReportTargetType = 'general' | 'quote' | 'author' | 'reference'
export type AdminReportTargetType = ReportTargetType | 'theme'
export type ReportStatus = 'new' | 'triaged' | 'spam' | 'resolved'
export type ThemeImageReportSubject = 'image_rights' | 'image_credit' | 'image_removal' | 'image_other'
export type ThemeImageVariant = 'desktop' | 'mobile'

export interface UserMessage {
  id: number
  user_id: number | null
  name: string | null
  email: string | null
  category: ReportCategory
  subject: ThemeImageReportSubject | null
  tags: string[]
  message: string
  target_type: AdminReportTargetType
  target_id: number | null
  theme_id: number | null
  image_variant: ThemeImageVariant | null
  reported_image_url: string | null
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
  theme_image_report?: {
    subject: ThemeImageReportSubject
    theme_id: number
    image_variant: ThemeImageVariant
  }
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
  theme_name?: string | null
}

/**
 * API response shape for admin messages listing
 */
export interface AdminMessagesListResponse {
  success: boolean
  data: AdminUserMessage[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}
