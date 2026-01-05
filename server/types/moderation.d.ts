/**
 * Moderation and reporting type definitions
 * Represents content moderation and user reporting system
 */

/**
 * Report reasons for content moderation
 */
export type ReportReason = 'spam' | 'inappropriate' | 'copyright' | 'misinformation' | 'other';

/**
 * Report status for moderation workflow
 */
export type ReportStatus = 'pending' | 'reviewed' | 'resolved';

/**
 * Quote Report entity from the database
 */
export interface QuoteReport {
  /** Unique identifier for the report */
  id: number;
  
  /** ID of the quote being reported */
  quote_id: number;
  
  /** ID of the user who made the report */
  reporter_id: number;
  
  /** Reason for the report */
  reason: ReportReason;
  
  /** Additional description from the reporter */
  description: string | null;
  
  /** Current status of the report */
  status: ReportStatus;
  
  /** ID of the moderator who reviewed this report */
  reviewed_by: number | null;
  
  /** Timestamp when report was reviewed */
  reviewed_at: string | null;
  
  /** Timestamp when report was created */
  created_at: string;
}

/**
 * Quote Report with populated user and quote data
 */
export interface QuoteReportWithRelations extends QuoteReport {
  quote?: {
    id: number;
    name: string;
    author?: { id: number; name: string } | null;
  };
  reporter?: {
    id: number;
    name: string;
    email: string;
  };
  reviewer?: {
    id: number;
    name: string;
  } | null;
}

/**
 * Data required to create a new report
 */
export interface CreateReportData {
  quote_id: number;
  reporter_id: number;
  reason: ReportReason;
  description?: string | null;
}

/**
 * Data for updating a report (moderation action)
 */
export interface UpdateReportData {
  id: number;
  status: ReportStatus;
  reviewed_by: number;
  reviewed_at?: string;
}

/**
 * Report filters for moderation dashboard
 */
export interface ReportFilters {
  status?: ReportStatus;
  reason?: ReportReason;
  reporter_id?: number;
  reviewed_by?: number;
  quote_id?: number;
  date_from?: string;
  date_to?: string;
}

/**
 * Moderation statistics
 */
export interface ModerationStats {
  total_reports: number;
  pending_reports: number;
  reviewed_reports: number;
  resolved_reports: number;
  reports_by_reason: Record<ReportReason, number>;
  reports_by_status: Record<ReportStatus, number>;
  top_reporters: Array<{
    user_id: number;
    user_name: string;
    report_count: number;
  }>;
  recent_activity: Array<{
    report_id: number;
    action: string;
    moderator_name: string;
    timestamp: string;
  }>;
}

/**
 * Bulk moderation action
 */
export interface BulkModerationAction {
  report_ids: number[];
  action: 'approve' | 'reject' | 'resolve';
  moderator_id: number;
  notes?: string;
}
