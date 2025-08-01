/**
 * Export functionality type definitions
 * Defines types for data export features in the admin panel
 */

import type { QuoteStatus, QuoteLanguage } from './quote'

/**
 * Supported export formats
 */
export type ExportFormat = 'json' | 'csv' | 'xml'

/**
 * Export data types
 */
export type ExportDataType = 'quotes' | 'authors' | 'references' | 'users' | 'all'

/**
 * Date range filter for exports
 */
export interface ExportDateRange {
  /** Start date in YYYY-MM-DD format */
  start: string
  /** End date in YYYY-MM-DD format */
  end: string
}

/**
 * Export filter options for quotes
 */
export interface QuoteExportFilters {
  /** Filter by quote status */
  status?: QuoteStatus | QuoteStatus[]
  /** Filter by specific author ID */
  author_id?: number
  /** Filter by specific author name (search) */
  author_name?: string
  /** Filter by quote language */
  language?: QuoteLanguage | QuoteLanguage[]
  /** Filter by date range */
  date_range: ExportDateRange
  /** Filter by specific user ID who created the quote */
  user_id?: number
  /** Filter by moderator ID */
  moderator_id?: number
  /** Include only featured quotes */
  featured_only?: boolean
  /** Search term for quote content */
  search?: string
  /** Filter by specific tag IDs */
  tag_ids?: number[]
  /** Minimum views count */
  min_views?: number
  /** Minimum likes count */
  min_likes?: number
}

/**
 * Raw filter data as stored in database (JSON string format)
 * This represents the structure after JSON.parse() from database
 */
export interface RawExportFilters {
  /** Filter by quote status - can be string or array */
  status?: string | string[]
  /** Filter by specific author ID - stored as string in JSON */
  author_id?: string | number
  /** Filter by specific author name (search) */
  author_name?: string
  /** Filter by quote language - can be string or array */
  language?: string | string[]
  /** Filter by date range */
  date_range?: {
    start?: string
    end?: string
  }
  /** Filter by specific user ID - stored as string in JSON */
  user_id?: string | number
  /** Filter by moderator ID - stored as string in JSON */
  moderator_id?: string | number
  /** Include only featured quotes - can be string or boolean */
  featured_only?: boolean | string
  /** Search term for quote content */
  search?: string
  /** Filter by specific tag IDs - stored as strings in JSON */
  tag_ids?: (string | number)[]
  /** Minimum views count - stored as string in JSON */
  min_views?: string | number
  /** Minimum likes count - stored as string in JSON */
  min_likes?: string | number
  /** Any additional unknown properties */
  [key: string]: unknown
}

/**
 * Type guard to check if a value is a valid QuoteStatus
 */
export function isQuoteStatus(value: unknown): value is QuoteStatus {
  return typeof value === 'string' && ['draft', 'pending', 'approved', 'rejected'].includes(value)
}

/**
 * Type guard to check if a value is a valid QuoteLanguage
 */
export function isQuoteLanguage(value: unknown): value is QuoteLanguage {
  return typeof value === 'string' && ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh'].includes(value)
}

/**
 * Type guard to check if a value is a valid ExportFormat
 */
export function isExportFormat(value: unknown): value is ExportFormat {
  return typeof value === 'string' && ['json', 'csv', 'xml'].includes(value)
}

/**
 * Utility type for filter validation results
 */
export interface FilterValidationResult {
  /** Whether the filters are valid */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Validation warnings */
  warnings: string[]
  /** Sanitized filters ready for use */
  sanitized?: QuoteExportFilters
}

/**
 * Export options and settings (API format)
 */
export interface ExportOptions {
  /** Export format */
  format: ExportFormat
  /** Data type to export */
  data_type: ExportDataType
  /** Filters to apply */
  filters?: QuoteExportFilters | ReferenceExportFilters
  /** Include metadata in export */
  include_metadata?: boolean
  /** Include related data (author, reference, tags) */
  include_relations?: boolean
  /** Include user information */
  include_user_data?: boolean
  /** Include moderation history */
  include_moderation_data?: boolean
  /** Include analytics data (views, likes, shares) */
  include_analytics?: boolean
  /** Compress output (for large exports) */
  compress_output?: boolean
  /** Maximum number of records to export (0 = no limit) */
  limit?: number
  /** Batch size for chunked exports */
  batch_size?: number
}

/**
 * Export options for UI (with label/value structure for selects)
 */
export interface UIExportOptions {
  format: { label: string; value: ExportFormat }
  data_type: { label: string; value: ExportDataType }
  include_relations: boolean
  include_user_data: boolean
  include_moderation_data: boolean
  include_analytics: boolean
  include_metadata: boolean
  limit: number
}

/**
 * Export state for UI management
 */
export interface ExportState {
  isExporting: boolean
  showProgressDialog: boolean
  successMessage: string
  errorMessage: string
  previewData: ExportValidation | null
  exportHistory: ExportHistoryEntry[]
  isLoadingHistory: boolean
  historyPagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasMore: boolean
  }
}

/**
 * Export progress information
 */
export interface ExportProgress {
  /** Unique export ID */
  export_id: string
  /** Current status */
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  /** Progress percentage (0-100) */
  progress: number
  /** Current step description */
  current_step?: string
  /** Total records to process */
  total_records?: number
  /** Records processed so far */
  processed_records?: number
  /** Estimated time remaining in seconds */
  estimated_remaining?: number
  /** Error message if failed */
  error_message?: string
  /** Started at timestamp */
  started_at: string
  /** Completed at timestamp */
  completed_at?: string
}

/**
 * Export result information
 */
export interface ExportResult {
  /** Success status */
  success: boolean
  /** Export metadata */
  data: {
    /** Unique export ID */
    export_id: string
    /** Generated filename */
    filename: string
    /** Export format used */
    format: ExportFormat
    /** Number of records exported */
    record_count: number
    /** File size in bytes */
    file_size?: number
    /** Download URL */
    download_url?: string
    /** Export options used */
    options: ExportOptions
    /** Export progress */
    progress?: ExportProgress
    /** Expiration time for download */
    expires_at?: string
    /** Direct content for small exports */
    content?: string
    /** MIME type for direct content */
    mimeType?: string
  }
  /** Error message if failed */
  error?: string
}

/**
 * Export history entry
 */
export interface ExportHistoryEntry {
  /** Unique export ID */
  id: string
  /** Generated filename */
  filename: string
  /** Export format */
  format: ExportFormat
  /** Data type exported */
  data_type: ExportDataType
  /** Filters applied (JSON string) */
  filters_applied?: string
  /** Number of records exported */
  record_count: number
  /** File size in bytes */
  file_size?: number
  /** Export status */
  status: ExportProgress['status']
  /** User who initiated the export */
  user_id: number
  /** User name */
  user_name?: string
  /** Download count */
  download_count: number
  /** Created at timestamp */
  created_at: string
  /** Completed at timestamp */
  completed_at?: string
  /** Expires at timestamp */
  expires_at?: string
}

/**
 * Exported quote data structure
 */
export interface ExportedQuote {
  /** Quote data */
  id: number
  name: string
  language: QuoteLanguage
  status: QuoteStatus
  views_count: number
  likes_count: number
  shares_count: number
  is_featured: boolean
  created_at: string
  updated_at: string
  moderated_at?: string
  rejection_reason?: string

  /** Author information (if included) */
  author?: {
    id: number
    name: string
    is_fictional: boolean
    job?: string
    birth_date?: string
    death_date?: string
    image_url?: string
  }

  /** Reference information (if included) */
  reference?: {
    id: number
    name: string
    primary_type: string
    secondary_type?: string
    release_date?: string
    description?: string
    image_url?: string
  }

  /** User information (if included) */
  user?: {
    id: number
    name: string
    email?: string
  }

  /** Moderator information (if included) */
  moderator?: {
    id: number
    name: string
  }

  /** Tags (if included) */
  tags?: Array<{
    id: number
    name: string
    color: string
  }>

  /** Export metadata (if included) */
  _metadata?: {
    exported_at: string
    exported_by: number
    export_id: string
    export_filters?: QuoteExportFilters
  }
}

/**
 * Reference export filters
 */
export interface ReferenceExportFilters {
  /** Filter by primary type */
  primary_type?: string | string[]
  /** Filter by secondary type */
  secondary_type?: string | string[]
  /** Search in reference name */
  search?: string
  /** Date range filter */
  date_range?: ExportDateRange
  /** Minimum views count */
  min_views?: number
  /** Minimum quotes count */
  min_quotes?: number
  /** Filter by release date range */
  release_date_range?: ExportDateRange
}

/**
 * Exported reference data structure
 */
export interface ExportedReference {
  /** Reference data */
  id: number
  name: string
  primary_type: string
  secondary_type?: string
  description?: string
  release_date?: string
  image_url?: string
  urls?: string[]
  views_count: number
  likes_count: number
  created_at: string
  updated_at: string

  /** Quote count (if included) */
  quotes_count?: number

  /** Export metadata (if included) */
  _metadata?: {
    exported_at: string
    exported_by: number
    export_id: string
    export_filters?: ReferenceExportFilters
  }
}

/**
 * Export validation result
 */
export interface ExportValidation {
  /** Whether the export options are valid */
  valid: boolean
  /** Validation errors */
  errors: string[]
  /** Warnings */
  warnings: string[]
  /** Estimated record count */
  estimated_count?: number
  /** Estimated file size in bytes */
  estimated_size?: number
}

/**
 * Utility functions for filter parsing and validation
 */
export interface ExportFilterUtils {
  /**
   * Parse and sanitize raw filters from database JSON
   */
  parseFilters(rawFilters: string | RawExportFilters | null | undefined): QuoteExportFilters

  /**
   * Validate export filters
   */
  validateFilters(filters: QuoteExportFilters | RawExportFilters): FilterValidationResult

  /**
   * Convert raw filters to typed filters with proper type conversion
   */
  sanitizeFilters(rawFilters: RawExportFilters): QuoteExportFilters

  /**
   * Serialize filters for database storage
   */
  serializeFilters(filters: QuoteExportFilters): string
}

/**
 * Filter transformation options
 */
export interface FilterTransformOptions {
  /** Whether to include empty values in output */
  includeEmpty?: boolean
  /** Whether to validate filter values */
  validate?: boolean
  /** Whether to throw on validation errors */
  throwOnError?: boolean
}

/**
 * Database export log entry structure
 */
export interface ExportLogEntry {
  /** Unique export ID */
  id: number
  /** Export identifier */
  export_id: string
  /** Generated filename */
  filename: string
  /** Export format */
  format: ExportFormat
  /** Filters applied as JSON string */
  filters_applied: string | null
  /** Number of records exported */
  record_count: number
  /** File size in bytes */
  file_size: number | null
  /** User who initiated export */
  user_id: number
  /** Download count */
  download_count: number
  /** Created timestamp */
  created_at: string
  /** Expiration timestamp */
  expires_at: string
}

/**
 * Parsed export log with typed filters
 */
export interface ParsedExportLog extends Omit<ExportLogEntry, 'filters_applied'> {
  /** Parsed and typed filters */
  filters: QuoteExportFilters
  /** Raw filters string for reference */
  filters_applied: string | null
}
