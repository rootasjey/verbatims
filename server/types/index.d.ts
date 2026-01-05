/**
 * Server-only type definitions index
 * Re-exports types used exclusively in server context (API routes, utils, database operations)
 */

// Database query result types
export type {
  CreatedQuoteResult,
  FeaturedQuoteResult,
  ProcessedTags,
  TagProcessor,
  DatabaseQuoteWithRelations,
  DatabaseAdminQuote,
} from './api-results';

// Data import types (server-side import processing)
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
} from './import-data';

// Session management types (server-side)
export type {
  UserSession,
  CreateSessionData,
  SessionValidation,
  SessionCleanupOptions,
} from './session';

// Quality analysis types (server-side data processing)
export type {
  QualityScore,
  QualityIssue,
  QualityAnalysisResult,
  DataQualityMetrics,
  QualityAnalysisOptions,
} from './quality-analysis';

// Search result types (database search processing)
export type {
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
} from './search';

// Moderation types (server-side moderation logic)
export type {
  QuoteReport,
  ReportReason,
  ReportStatus,
  QuoteReportWithRelations,
  CreateReportData,
  UpdateReportData,
  ReportFilters,
  ModerationStats,
  BulkModerationAction,
  ModerationAction,
  ModerationHistory,
} from './moderation';

// Re-export auth module augmentation
export type {} from './nuxt-auth-utils';
