/**
 * Search functionality type definitions
 * Represents search queries, results, and related data structures
 */

import type { Quote, Author, SortMode, QuoteReference } from '~/shared/types';

/**
 * Supported content types for search
 */
export type SearchContentType = 'quotes' | 'authors' | 'references' | 'all';

/**
 * Database result type for quote search queries
 * Extends Quote with additional fields from JOIN operations
 */
export interface QuoteSearchResult extends Quote {
  /** Author name from JOIN with authors table */
  author_name?: string;
  
  /** Author fictional status from JOIN with authors table */
  author_is_fictional?: boolean;
  
  /** Author image URL from JOIN with authors table */
  author_image_url?: string;
  
  /** Reference name from JOIN with quote_references table */
  reference_name?: string;
  
  /** Reference type from JOIN with quote_references table */
  reference_type?: string;
  
  /** User name from JOIN with users table */
  user_name?: string;
  
  /** Comma-separated tag names from GROUP_CONCAT */
  tag_names?: string;
  
  /** Comma-separated tag colors from GROUP_CONCAT */
  tag_colors?: string;
  
  /** Result type identifier for search results */
  result_type: 'quote';
}

/**
 * Database result type for author search queries
 * Includes all Author properties plus search-specific fields
 */
export interface AuthorSearchResult {
  /** Unique identifier for the author */
  id: number;
  
  /** Full name of the author */
  name: string;
  
  /** Whether this is a fictional character or real person */
  is_fictional: boolean;
  
  /** Birth date in YYYY-MM-DD format */
  birth_date?: string;
  
  /** Location where the author was born */
  birth_location?: string;
  
  /** Death date in YYYY-MM-DD format (null if still alive) */
  death_date?: string;
  
  /** Location where the author died */
  death_location?: string;
  
  /** Primary profession or job title */
  job?: string;
  
  /** Biographical description */
  description?: string;
  
  /** URL to author's profile image */
  image_url?: string;
  
  /** JSON string containing social media links */
  socials: string;
  
  /** Number of times author profile has been viewed */
  views_count: number;
  
  /** Number of likes received */
  likes_count: number;
  
  /** Number of times author has been shared */
  shares_count: number;
  
  /** Timestamp when record was created */
  created_at: string;
  
  /** Timestamp when record was last updated */
  updated_at: string;
  
  /** If fictional: origin reference id inferred from quotes */
  origin_reference_id?: number;

  /** If fictional: origin reference name inferred from quotes */
  origin_reference_name?: string;
  
  /** Result type identifier for search results */
  result_type: 'author';
  
  /** Number of approved quotes by this author */
  quotes_count: number;
}

/**
 * Database result type for reference search queries
 * Includes all QuoteReference properties plus search-specific fields
 */
export interface ReferenceSearchResult {
  /** Unique identifier for the reference */
  id: number;
  
  /** Name/title of the work */
  name: string;
  
  /** Original language of the work */
  original_language: string;
  
  /** Release/publication date in YYYY-MM-DD format */
  release_date: string | null;
  
  /** Description or synopsis of the work */
  description: string | null;
  
  /** Primary category of the work */
  primary_type: string;
  
  /** Secondary category/genre (e.g., 'horror', 'comedy', 'biography') */
  secondary_type: string | null;
  
  /** URL to cover image or poster */
  image_url?: string;
  
  /** JSON string containing related URLs */
  urls: string;
  
  /** Number of times reference has been viewed */
  views_count: number;
  
  /** Number of likes received */
  likes_count: number;
  
  /** Number of times reference has been shared */
  shares_count: number;
  
  /** Timestamp when record was created */
  created_at: string;
  
  /** Timestamp when record was last updated */
  updated_at: string;
  
  /** Result type identifier for search results */
  result_type: 'reference';
  
  /** Number of approved quotes from this reference */
  quotes_count: number;
}

/**
 * Processed quote result with parsed tags
 * Extends Quote with all its properties and adds additional search-specific fields
 */
export interface ProcessedQuoteResult {
  // All Quote base properties (explicitly listed for TypeScript to recognize them)
  /** Unique identifier for the quote */
  id: number;
  
  /** The actual quote text content */
  name: string;
  
  /** Language of the quote */
  language: string;
  
  /** ID of the author who said/wrote this quote */
  author_id?: number;
  
  /** ID of the reference/source where this quote comes from */
  reference_id?: number;
  
  /** ID of the user who submitted this quote */
  user_id: number;
  
  /** Current moderation status */
  status: string;
  
  /** ID of the moderator who reviewed this quote */
  moderator_id?: number;
  
  /** Timestamp when quote was moderated */
  moderated_at?: string;
  
  /** Reason for rejection if status is 'rejected' */
  rejection_reason?: string;
  
  /** Number of times quote has been viewed */
  views_count: number;
  
  /** Number of likes received */
  likes_count: number;
  
  /** Number of times quote has been shared */
  shares_count: number;
  
  /** Whether this quote is featured/highlighted */
  is_featured: boolean;
  
  /** Timestamp when record was created */
  created_at: string;
  
  /** Timestamp when record was last updated */
  updated_at: string;

  // Additional search result fields
  /** Author name from JOIN with authors table */
  author_name?: string;
  
  /** Author fictional status from JOIN with authors table */
  author_is_fictional?: boolean;
  
  /** Author image URL from JOIN with authors table */
  author_image_url?: string;
  
  /** Reference name from JOIN with quote_references table */
  reference_name?: string;
  
  /** Reference type from JOIN with quote_references table */
  reference_type?: string;
  
  /** User name from JOIN with users table */
  user_name?: string;

  /** Result type identifier for search results */
  result_type: 'quote';
  
  /** Parsed and structured tags array */
  tags: Array<{
    /** Tag name */
    name: string;
    /** Tag color (hex code or color name) */
    color: string;
  }>;

  /**
   * Normalized relations for UI convenience.
   * These override the base Quote's optional author/reference with a more specific structure.
   */
  author?: Pick<Author, 'id' | 'name'> & Partial<Pick<Author, 'is_fictional' | 'image_url'>>;
  reference?: Pick<QuoteReference, 'id' | 'name'> & { type?: string };
}

export type QuotesSearchPayload = {
  sort: SortMode
  page: number
  limit: number
  q?: string
  quotes: ProcessedQuoteResult[]
  total: number
  offset: number
  pageCount: number
  filters: Record<string, unknown>
  hasMore: boolean
}

/**
 * Complete search results structure
 * Contains all search result types and metadata
 */
export interface SearchResults {
  /** Array of processed quote results */
  quotes: ProcessedQuoteResult[];
  
  /** Array of author search results */
  authors: AuthorSearchResult[];
  
  /** Array of reference search results */
  references: ReferenceSearchResult[];
  
  /** Total number of results across all types */
  total: number;
}

/**
 * Search query parameters
 */
export interface SearchQuery {
  /** Search term/query string */
  q?: string;
  
  /** Language filter */
  language?: string;
  
  /** Author ID filter */
  author?: string;
  
  /** Reference ID filter */
  reference?: string;
  
  /** Maximum number of results to return */
  limit?: string;
  
  /** Content type to search */
  type?: SearchContentType;
}

export interface SearchParams {
  search?: string;
  filters?: Record<string, any>;
}

/**
 * Search API response type
 */
export interface SearchApiResponse {
  /** Whether the search was successful */
  success: boolean;
  
  /** Search results data */
  data: SearchResults;
  
  /** Optional message */
  message?: string;
  
  /** Optional error messages */
  errors?: string[];
}
