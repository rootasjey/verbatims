/**
 * API-specific database result type definitions
 * Represents database query results with JOIN operations and computed fields
 */

import type { Quote, QuoteLanguage } from './index';

/**
 * Database result type for quote creation queries
 * Includes all quote fields plus related data from JOINs
 */
export interface CreatedQuoteResult {
  /** Quote ID */
  id: number;
  
  /** Quote text content */
  name: string;
  
  /** Quote language */
  language: QuoteLanguage;
  
  /** Author ID (nullable) */
  author_id: number | null;
  
  /** Reference ID (nullable) */
  reference_id: number | null;
  
  /** User ID who created the quote */
  user_id: number;
  
  /** Quote moderation status */
  status: string;
  
  /** Number of views */
  views_count: number;
  
  /** Number of likes */
  likes_count: number;
  
  /** Number of shares */
  shares_count: number;
  
  /** Whether quote is featured */
  is_featured: boolean;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
  
  /** Author name from JOIN with authors table */
  author_name?: string | null;
  
  /** Author fictional status from JOIN with authors table */
  author_is_fictional?: boolean | null;
  
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
}

/**
 * Database result type for featured quote queries
 * Similar to CreatedQuoteResult but for featured quote endpoints
 */
export interface FeaturedQuoteResult {
  /** Quote ID */
  id: number;
  
  /** Quote text content */
  name: string;
  
  /** Quote language */
  language: string;
  
  /** Author ID (nullable) */
  author_id: number | null;
  
  /** Reference ID (nullable) */
  reference_id: number | null;
  
  /** User ID who created the quote */
  user_id: number;
  
  /** Quote moderation status */
  status: string;
  
  /** Number of views */
  views_count: number;
  
  /** Number of likes */
  likes_count: number;
  
  /** Number of shares */
  shares_count: number;
  
  /** Whether quote is featured */
  is_featured: boolean;
  
  /** Creation timestamp */
  created_at: string;
  
  /** Last update timestamp */
  updated_at: string;
  
  /** Author name from JOIN with authors table */
  author_name?: string | null;
  
  /** Author fictional status from JOIN with authors table */
  author_is_fictional?: boolean | null;
  
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
}

/**
 * Utility type for processing comma-separated tag data
 */
export interface ProcessedTags {
  /** Array of processed tag objects */
  tags: Array<{
    /** Tag ID (may be temporary for display purposes) */
    id: number;
    /** Tag name */
    name: string;
    /** Tag color */
    color: string;
  }>;
}

/**
 * Helper function type for processing tag strings into structured data
 */
export type TagProcessor = (tagNames: string | null, tagColors: string | null) => ProcessedTags['tags'];
