/**
 * Search functionality type definitions
 * Represents search queries, results, and related data structures
 */

import type { Quote, Author, QuoteReference } from './index';

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
  author_name?: string | null;
  
  /** Author fictional status from JOIN with authors table */
  author_is_fictional?: boolean | null;
  
  /** Author image URL from JOIN with authors table */
  author_image_url?: string | null;
  
  /** Reference name from JOIN with quote_references table */
  reference_name?: string | null;
  
  /** Reference type from JOIN with quote_references table */
  reference_type?: string | null;
  
  /** User name from JOIN with users table */
  user_name?: string | null;
  
  /** Comma-separated tag names from GROUP_CONCAT */
  tag_names?: string | null;
  
  /** Comma-separated tag colors from GROUP_CONCAT */
  tag_colors?: string | null;
  
  /** Result type identifier for search results */
  result_type: 'quote';
}

/**
 * Database result type for author search queries
 * Extends Author with additional computed fields
 */
export interface AuthorSearchResult extends Author {
  /** Result type identifier for search results */
  result_type: 'author';
  
  /** Number of approved quotes by this author */
  quotes_count: number;
}

/**
 * Database result type for reference search queries
 * Extends QuoteReference with additional computed fields
 */
export interface ReferenceSearchResult extends QuoteReference {
  /** Result type identifier for search results */
  result_type: 'reference';
  
  /** Number of approved quotes from this reference */
  quotes_count: number;
}

/**
 * Processed quote result with parsed tags
 * Removes raw tag string fields and adds structured tag array
 */
export interface ProcessedQuoteResult extends Omit<QuoteSearchResult, 'tag_names' | 'tag_colors'> {
  /** Parsed and structured tags array */
  tags: Array<{
    /** Tag name */
    name: string;
    /** Tag color (hex code or color name) */
    color: string;
  }>;
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
export interface SearchParams {
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
