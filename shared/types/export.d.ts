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
export type ExportDataType = 'all' | 'authors' | 'quotes' | 'references' | 'tags' | 'users'

/**
 * Date range filter for exports
 */
export interface ExportDateRange {
  /** Start date in YYYY-MM-DD format */
  start?: string
  /** End date in YYYY-MM-DD format */
  end?: string
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
  date_range?: ExportDateRange
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
  return typeof value === 'string' && ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la'].includes(value)
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
  filters?: QuoteExportFilters | ReferenceExportFilters | AuthorExportFilters | UserExportFilters | TagExportFilters
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
  download_after_export: boolean
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
  exportHistory: ExportHistoryEntryWithBackup[]
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
 * Author export filters
 */
export interface AuthorExportFilters {
  /** Search in author name */
  search?: string
  /** Filter by fictional status */
  is_fictional?: boolean
  /** Filter by job/profession */
  job?: string
  /** Date range filter for creation date */
  date_range?: ExportDateRange
  /** Filter by birth date range */
  birth_date_range?: ExportDateRange
  /** Filter by death date range */
  death_date_range?: ExportDateRange
  /** Minimum views count */
  min_views?: number
  /** Minimum likes count */
  min_likes?: number
  /** Minimum quotes count */
  min_quotes?: number
  /** Filter by birth location */
  birth_location?: string
  /** Filter by death location */
  death_location?: string
}

/**
 * User export filters
 */
export interface UserExportFilters {
  /** Search in user name or email */
  search?: string
  /** Filter by user role */
  role?: string | string[]
  /** Filter by email verification status */
  email_verified?: boolean
  /** Filter by active status */
  is_active?: boolean
  /** Date range filter for creation date */
  date_range?: ExportDateRange
  /** Date range filter for last login */
  last_login_range?: ExportDateRange
  /** Filter by language preference */
  language?: string | string[]
  /** Filter by location */
  location?: string
  /** Filter by job/profession */
  job?: string
  /** Minimum quotes created */
  min_quotes?: number
  /** Minimum collections created */
  min_collections?: number
}

/**
 * Tag export filters
 */
export interface TagExportFilters {
  /** Search in tag name or description */
  search?: string
  /** Filter by category */
  category?: string | string[]
  /** Filter by color (hex or token) */
  color?: string | string[]
  /** Date range filter for creation date */
  date_range?: ExportDateRange
  /** Minimum usage count across quotes */
  min_usage?: number
  /** Only tags not used by any quote */
  unused_only?: boolean
}

/**
 * Exported tag data structure
 */
export interface ExportedTag {
  /** Tag data */
  id: number
  name: string
  description?: string
  category?: string
  color: string
  created_at: string
  updated_at: string

  /** Usage count (if included) */
  usage_count?: number

  /** Export metadata (if included) */
  _metadata?: {
    exported_at: string
    exported_by: number
    export_id: string
    export_filters?: TagExportFilters
  }
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
 * Exported author data structure
 */
export interface ExportedAuthor {
  /** Author data */
  id: number
  name: string
  is_fictional: boolean
  birth_date?: string
  birth_location?: string
  death_date?: string
  death_location?: string
  job?: string
  description?: string
  image_url?: string
  socials?: Array<{
    platform: string
    url: string
    username?: string
  }>
  views_count: number
  likes_count: number
  shares_count: number
  created_at: string
  updated_at: string

  /** Quote count (if included) */
  quotes_count?: number

  /** Export metadata (if included) */
  _metadata?: {
    exported_at: string
    exported_by: number
    export_id: string
    export_filters?: AuthorExportFilters
  }
}

/**
 * Exported user data structure
 */
export interface ExportedUser {
  /** User data */
  id: number
  email: string
  name: string
  avatar_url?: string
  role: string
  is_active: boolean
  email_verified: boolean
  biography?: string
  job?: string
  language: string
  location?: string
  socials?: Array<{
    platform: string
    url: string
    username?: string
  }>
  last_login_at?: string
  created_at: string
  updated_at: string

  /** Quote count (if included) */
  quotes_count?: number

  /** Collection count (if included) */
  collections_count?: number

  /** Export metadata (if included) */
  _metadata?: {
    exported_at: string
    exported_by: number
    export_id: string
    export_filters?: UserExportFilters
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
 * Database export log entry structure (unified for all data types)
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
  /** Data type exported */
  data_type: ExportDataType
  /** Filters applied as JSON string */
  filters_applied: string | null
  /** Number of records exported */
  record_count: number
  /** File size in bytes */
  file_size: number | null
  /** User who initiated export */
  user_id: number
  /** Include related data flag */
  include_relations: boolean
  /** Include metadata flag */
  include_metadata: boolean
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

/**
 * Backup file storage status
 */
export type BackupStorageStatus = 'uploading' | 'stored' | 'failed' | 'expired'

/**
 * Backup file compression type
 */
export type BackupCompressionType = 'none' | 'gzip'

/**
 * Backup file entity from the database
 */
export interface BackupFile {
  /** Unique identifier */
  id: number
  /** R2 object key (unique identifier) */
  file_key: string
  /** Link to export_logs (optional for standalone backups) */
  export_log_id: number | null
  /** Link to import_logs (optional for import backups) */
  import_log_id: number | null
  /** Original filename */
  filename: string
  /** Full R2 path (archives/YYYY-MM-DD/filename) */
  file_path: string
  /** File size in bytes */
  file_size: number | null
  /** Compressed size if gzipped */
  compressed_size: number | null
  /** SHA-256 hash for integrity verification */
  content_hash: string | null
  /** Compression type */
  compression_type: BackupCompressionType
  /** Storage status */
  storage_status: BackupStorageStatus
  /** Retention period in days */
  retention_days: number
  /** Created timestamp */
  created_at: string
  /** Upload completion timestamp */
  uploaded_at: string | null
  /** Calculated expiration date */
  expires_at: string | null
  /** Last access timestamp */
  last_accessed_at: string | null
  /** Download count */
  access_count: number
  /** JSON metadata (export config, etc.) */
  metadata: string | null
}

/**
 * Backup file with parsed metadata
 */
export interface BackupFileWithMetadata extends Omit<BackupFile, 'metadata'> {
  /** Parsed metadata */
  metadata: {
    /** Export configuration used */
    export_config?: ExportOptions
    /** Original export filters */
    filters?: QuoteExportFilters | ReferenceExportFilters | AuthorExportFilters | UserExportFilters
    /** User who created the backup */
    created_by?: number
    /** Additional backup metadata */
    backup_type?: 'export' | 'manual' | 'scheduled'
    /** Data integrity verification */
    integrity_verified?: boolean
    /** Backup description */
    description?: string
  } | null
}

/**
 * Backup file creation data
 */
export interface CreateBackupFileData {
  /** R2 object key */
  file_key: string
  /** Link to export log (optional) */
  export_log_id?: number
  import_log_id?: number
  /** Original filename */
  filename: string
  /** Full R2 path */
  file_path: string
  /** File size in bytes */
  file_size: number
  /** Compressed size if applicable */
  compressed_size?: number
  /** Content hash for integrity */
  content_hash?: string
  /** Compression type */
  compression_type?: BackupCompressionType
  /** Retention period in days */
  retention_days?: number
  /** Metadata as JSON string */
  metadata?: string
}

/**
 * Backup file upload progress
 */
export interface BackupUploadProgress {
  /** Backup file ID */
  backup_id: number
  /** Upload progress percentage (0-100) */
  progress: number
  /** Current status */
  status: BackupStorageStatus
  /** Bytes uploaded */
  bytes_uploaded: number
  /** Total bytes to upload */
  total_bytes: number
  /** Upload speed in bytes/second */
  upload_speed?: number
  /** Estimated time remaining in seconds */
  eta_seconds?: number
  /** Error message if failed */
  error?: string
}

/**
 * Enhanced export result with backup file information
 */
export interface ExportResultWithBackup extends ExportResult {
  /** Backup file information */
  backup?: {
    /** Backup file ID */
    backup_id: number
    /** R2 file key */
    file_key: string
    /** R2 file path */
    file_path: string
    /** Storage status */
    storage_status: BackupStorageStatus
    /** Upload progress (if uploading) */
    upload_progress?: BackupUploadProgress
    /** Backup download URL */
    backup_download_url?: string
    /** Retention information */
    retention_days: number
    /** Expiration date */
    expires_at?: string
  }
}

/**
 * Enhanced export history entry with backup information
 */
export interface ExportHistoryEntryWithBackup extends ExportHistoryEntry {
  /** Associated backup file */
  backup_file?: {
    /** Backup file ID */
    id: number
    /** Storage status */
    storage_status: BackupStorageStatus
    /** R2 file path */
    file_path: string
    /** File size */
    file_size: number | null
    /** Compressed size */
    compressed_size: number | null
    /** Upload completion date */
    uploaded_at: string | null
    /** Expiration date */
    expires_at: string | null
    /** Access count */
    access_count: number
  }
}
