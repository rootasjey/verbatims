/**
 * Centralized type definitions index
 * Re-exports all database entity types for easy importing
 */

// Author types
export type {
  Author,
  AuthorSocials,
  AuthorWithSocials,
  CreateAuthorData,
  UpdateAuthorData,
  AuthorStats
} from './author';

// Quote Reference types
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

// Quote types
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
} from './quote';

// Tag types
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

// User Interaction types
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

// Session types
export type {
  UserSession,
  CreateSessionData,
  SessionValidation,
  SessionCleanupOptions
} from './session';

// Moderation types
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

// Analytics types
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

// Search types
export type {
  SearchContentType,
  QuoteSearchResult,
  AuthorSearchResult,
  ReferenceSearchResult,
  ProcessedQuoteResult,
  SearchResults,
  SearchParams,
  SearchApiResponse
} from './search';

// API Result types
export type {
  CreatedQuoteResult,
  FeaturedQuoteResult,
  ProcessedTags,
  TagProcessor
} from './api-results';

// Import Progress types
export type {
  ImportProgress,
  ImportOptions,
} from './import-data';

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

export interface SortParams {
  sort_by?: string;
  sort_order?: 'asc' | 'desc';
}

export interface SearchParams {
  search?: string;
  filters?: Record<string, any>;
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
