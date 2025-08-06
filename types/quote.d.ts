/**
 * Quote entity type definitions
 * Represents the main content quotes in the verbatims application
 */

import type { Author } from './author';
import type { QuoteReference, QuoteReferencePrimaryType } from './quote-reference';

/**
 * Supported languages for quotes
 */
export type QuoteLanguage = 'en' | 'fr' | 'es' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh';

/**
 * Quote moderation status
 */
export type QuoteStatus = 'draft' | 'pending' | 'approved' | 'rejected';

/**
 * Quote entity from the database
 */
export interface Quote {
  /** Unique identifier for the quote */
  id: number;
  
  /** The actual quote text content */
  name: string;
  
  /** Language of the quote */
  language: QuoteLanguage;
  
  /** ID of the author who said/wrote this quote */
  author_id?: number;
  
  /** ID of the reference/source where this quote comes from */
  reference_id?: number;
  
  /** ID of the user who submitted this quote */
  user_id: number;
  
  /** Current moderation status */
  status: QuoteStatus;
  
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
}

/**
 * Quote with populated author and reference data
 */
export interface QuoteWithRelations extends Quote {
  author?: Author;
  reference?: QuoteReference;
  user?: {
    id: number;
    name: string;
    email?: string;
    avatar_url?: string;
  };
}

/**
 * Extended interface for admin quotes with additional fields
 */
export interface AdminQuote extends QuoteWithRelations {
  author?: Partial<Author>;
  reference?: Partial<QuoteReference>;
  moderator: {
    id?: number;
    name: string;
  } | undefined;
  tags?: Array<{ id: number; name: string; color: string }>;
}

/**
 * Data required to create a new quote
 */
export interface CreateQuoteData {
  name: string;
  language?: QuoteLanguage;
  author_id?: number;
  reference_id?: number;
  user_id: number;
  status?: QuoteStatus;
}

/**
 * Data for updating an existing quote
 */
export interface UpdateQuoteData extends Partial<Omit<CreateQuoteData, 'user_id'>> {
  id: number;
}

/**
 * Data for moderating a quote
 */
export interface ModerateQuoteData {
  id: number;
  status: 'approved' | 'rejected';
  moderator_id: number;
  rejection_reason?: string | null;
}

/**
 * Quote statistics and metrics
 */
export interface QuoteStats {
  id: number;
  name: string;
  language: QuoteLanguage;
  status: QuoteStatus;
  views_count: number;
  likes_count: number;
  shares_count: number;
  is_featured: boolean;
}

/**
 * Quote with additional computed fields
 */
export interface QuoteWithMetadata extends QuoteWithRelations {
  author?: Partial<Author>;
  reference?: Partial<QuoteReference>;
  is_liked?: boolean;
  is_in_collection?: boolean;
  tags?: Array<{ id: number; name: string; color: string }>;
}

/**
 * Database quote result with joined data from related tables
 */
export interface DatabaseQuoteWithRelations extends Quote {
  // Joined author fields
  author_name?: string;
  author_is_fictional?: boolean;
  author_image_url?: string;
  
  // Joined reference fields
  reference_name?: string;
  reference_type?: QuoteReferencePrimaryType;

  // Joined user fields
  user_name?: string;
  user_email?: string;
  user_avatar?: string;
  user_avatar_url?: string;
  
  // Joined tag fields (comma-separated)
  tag_names?: string;
  tag_colors?: string;
}

/**
 * Admin database quote result with additional moderation fields
 */
export interface DatabaseAdminQuote extends DatabaseQuoteWithRelations {
  moderator_name?: string | null;
}

/**
 * Quote search filters
 */
export interface QuoteFilters {
  language?: QuoteLanguage;
  status?: QuoteStatus;
  author_id?: number;
  reference_id?: number;
  user_id?: number;
  is_featured?: boolean;
  search?: string;
  tags?: number[];
}

/**
 * Quote pagination and sorting
 */
export interface QuotePagination {
  page?: number;
  limit?: number;
  sort_by?: 'created_at' | 'updated_at' | 'views_count' | 'likes_count' | 'name';
  sort_order?: 'asc' | 'desc';
}
