/**
 * Centralized type definitions index
 * Re-exports all database entity types for easy importing
 */

export type {
  Author,
  AuthorSocials,
  AuthorWithSocials,
  CreateAuthorData,
  UpdateAuthorData,
  AuthorStats
} from './author';

export type {
  QuoteReference,
  QuoteReferencePrimaryType,
  QuoteReferenceUrls,
  QuoteReferenceWithUrls,
  CreateQuoteReferenceData,
  UpdateQuoteReferenceData,
  QuoteReferenceStats,
  QuoteReferenceWithMetadata
} from './quote-reference';

export type {
  Quote,
  QuoteLanguage,
  QuoteStatus,
  QuoteWithRelations,
  CreateQuoteData,
  UpdateQuoteData,
  ModerateQuoteData,
  QuoteStats,
  QuoteWithMetadata,
  QuoteFilters,
  QuotePagination,
  AdminQuote,
  DatabaseQuoteWithRelations,
  DatabaseAdminQuote,
} from './quote';

export type {
  Tag,
  QuoteTag,
  CreateTagData,
  UpdateTagData,
  TagWithStats,
  TagWithMetadata,
  TagCategory,
  TagFilters,
  PopularTag
} from './tag';

export type {
  UserLike,
  LikeableType,
  UserCollection,
  CollectionQuote,
  CreateCollectionData,
  UpdateCollectionData,
  CollectionWithStats,
  CollectionWithQuotes,
  CollectionQuoteAction,
  LikeAction,
  UserInteractionSummary,
  CollectionFilters,
  PopularCollection
} from './user-interactions';

export type {
  UserSession,
  CreateSessionData,
  SessionValidation,
  SessionCleanupOptions
} from './session';

export type {
  QuoteReport,
  ReportReason,
  ReportStatus,
  QuoteReportWithRelations,
  CreateReportData,
  UpdateReportData,
  ReportFilters,
  ModerationStats,
  BulkModerationAction
} from './moderation';

export type {
  QuoteView,
  CreateViewData,
  AnalyticsPeriod,
  ViewAnalytics,
  QuoteMetrics,
  AuthorMetrics,
  ReferenceMetrics,
  UserEngagementMetrics,
  PlatformAnalytics,
  AnalyticsFilters
} from './analytics';

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

export type {
  CreatedQuoteResult,
  FeaturedQuoteResult,
  ProcessedTags,
  TagProcessor
} from './api-results';

export type {
  ImportProgress,
  ImportOptions,
} from './import-data';

export {
  SortMode,
  SortBy,
  SortOrder,
  SortQuery
} from './sort';

export {
  AdminUserMessage,
  AdminMessagesListResponse,
  CreateUserMessageInput,
  CreateUserMessageResult,
  UserMessage,
} from './report';

export {
  BackupFile,
  BackupCompressionType,
  BackupFileWithMetadata,
  BackupStorageStatus,
  BackupUploadProgress,
  CreateBackupFileData,
  ExportDataType,
  ExportedReference,
  ExportOptions,
  ExportResultWithBackup,
  ExportHistoryEntryWithBackup,
  ExportedQuote,
  QuoteExportFilters,
  ReferenceExportFilters,
} from './export';

// Common utility types
export interface DatabaseEntity {
  id: number;
  created_at: string;
  updated_at: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  offset?: number;
}

export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
  errors?: string[];
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    has_next: boolean;
    has_prev: boolean;
  };
}
