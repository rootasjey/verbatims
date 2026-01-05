/**
 * App-level type definitions index
 * Re-exports types from shared and server for use in app code (components, pages, composables)
 */

// Re-export all shared types (common between client and server)
export type {
  // Analytics
  AnalyticsEvent,
  AnalyticsEventType,
  AnalyticsTimeframe,
  AnalyticsData,
  AnalyticsSnapshot,
} from '~/shared/types/analytics'

// API
export type {
  ApiResponse,
  ApiError,
  ApiErrorCode,
  ApiSuccessResponse,
  ApiErrorResponse,
  PaginatedResponse,
  BulkOperationResponse,
} from '~/shared/types/api'

// Auth
export type {
  AuthProvider,
  UserRole,
  AuthResponse,
  LoginRequest,
  SignupRequest,
  TokenPayload,
  PasswordResetRequest,
  VerifyEmailRequest,
} from '~/shared/types/auth'

// Author
export type {
  Author,
  AuthorWithQuoteCount,
  CreateAuthorData,
  UpdateAuthorData,
  AdminAuthor,
  AuthorListOptions,
  AuthorSearchFilters,
  AuthorSortOptions,
} from '~/shared/types/author'

// Export
export type {
  ExportFormat,
  ExportDataType,
  ExportDateRange,
  QuoteExportFilters,
  RawExportFilters,
  FilterValidationResult,
  FilterTransformOptions,
  ExportLogEntry,
  ParsedExportLog,
  ExportConfig,
  ExportOptions,
  ExportJobData,
  ExportJob,
  ExportJobStatus,
  ExportJobWithDetails,
  ExportJobFilters,
  ExportProgress,
  ExportResult,
  ExportStats,
  ExportError,
  ExportValidation,
  BulkExportOptions,
  IncrementalExportOptions,
  ScheduledExportConfig,
} from '~/shared/types/export'

// Export type guards
export { isQuoteStatus, isQuoteLanguage } from '~/shared/types/export'

// Quote
export type {
  QuoteLanguage,
  QuoteStatus,
  Quote,
  QuoteWithRelations,
  AdminQuote,
  CreateQuoteData,
  UpdateQuoteData,
  QuoteListOptions,
  QuoteFilters,
  QuoteSortOptions,
  QuoteValidationError,
  BulkQuoteAction,
  QuoteActionResult,
} from '~/shared/types/quote'

// Quote Reference
export type {
  QuoteReferencePrimaryType,
  QuoteReferenceUrls,
  QuoteReference,
  QuoteReferenceWithUrls,
  CreateQuoteReferenceData,
  UpdateQuoteReferenceData,
  QuoteReferenceListOptions,
  QuoteReferenceFilters,
  QuoteReferenceSortOptions,
  QuoteReferenceWithMetadata,
  QuoteReferenceSearchResult as SharedQuoteReferenceSearchResult,
} from '~/shared/types/quote-reference'

// Report
export type {
  ReportTarget,
  ReportStatus as SharedReportStatus,
  ReportReason as SharedReportReason,
  Report,
  CreateReportData,
  UpdateReportData,
  ReportWithRelations,
  ReportListOptions,
  ReportFilters as SharedReportFilters,
  ReportSortOptions,
} from '~/shared/types/report'

// Sort
export type {
  SortOrder,
  SortMode,
  SortOption,
  SortConfig,
} from '~/shared/types/sort'

// Tag
export type {
  Tag,
  TagWithQuoteCount,
  CreateTagData,
  UpdateTagData,
  TagListOptions,
  TagFilters,
  TagSortOptions,
} from '~/shared/types/tag'

// User
export type {
  User,
  UserWithStats,
  CreateUserData,
  UpdateUserData,
  UserProfile,
  UserPreferences,
  UserStats,
  UserListOptions,
  UserFilters,
  UserSortOptions,
  AdminUser,
} from '~/shared/types/user'

// User Interactions
export type {
  UserInteractionType,
  UserInteraction,
  UserLike,
  UserView,
  UserShare,
  CreateInteractionData,
  InteractionStats,
  UserInteractionHistory,
} from '~/shared/types/user-interactions'

// Re-export server types needed in the app
export type {
  // Search results (used in components and pages)
  SearchContentType,
  QuoteSearchResult,
  AuthorSearchResult,
  ReferenceSearchResult,
  ProcessedQuoteResult,
  SearchResults,
  SearchParams,
  SearchQuery,
  SearchApiResponse,
  QuotesSearchPayload,
} from '~~/server/types/search'

// Import data types (used in admin pages)
export type {
  ConflictPolicy,
  ConflictMode,
  ImportProgress,
  ImportOptions,
  ImportConflictOptions,
  ImportSummary,
  ImportPagination,
  UpdateStrategy,
  ImportResult,
  ImportValidation,
  ImportError,
  ImportStats,
  ImportLog,
  ImportLogWithDetails,
} from '~~/server/types/import-data'
