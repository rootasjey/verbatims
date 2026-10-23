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
} from './types/api-results';
export type { DatabaseQuoteWithRelations, DatabaseAdminQuote } from '../shared/types/quote';

// Data import types (server-side import processing)
export type {
  ConflictPolicy,
  ConflictMode,
  ImportProgress,
  ImportOptions,
  ImportConflictOptions,
  ImportPagination,
  UpdateStrategy,
} from './types/import-data';

// Session management types (server-side)
export type {
  UserSession,
  CreateSessionData,
  SessionValidation,
  SessionCleanupOptions,
} from './types/session';

// Quality analysis types (server-side data processing)
export type {
  QualityIssue,
  QualityAnalysisResult,
} from './types/quality-analysis';

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
} from './types/search';

// Moderation types (server-side moderation logic)
export type {
  QuoteReport,
  ReportReason,
  QuoteReportWithRelations,
  CreateReportData,
  UpdateReportData,
  ReportFilters,
  ModerationStats,
  BulkModerationAction,
} from './types/moderation';

// Re-export auth module augmentation
export type {} from './types/nuxt-auth-utils';
