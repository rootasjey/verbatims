/**
 * Quote Reference entity type definitions
 * Represents sources/works that quotes come from (books, films, etc.)
 */

/**
 * Primary types for quote references
 */
export type QuoteReferencePrimaryType = 
  | 'film'
  | 'book'
  | 'tv_series'
  | 'music'
  | 'speech'
  | 'podcast'
  | 'interview'
  | 'documentary'
  | 'media_stream'
  | 'writings'
  | 'video_game'
  | 'other';

/**
 * URLs associated with a quote reference
 */
export interface QuoteReferenceUrls {
  official?: string;
  imdb?: string;
  wikipedia?: string;
  amazon?: string;
  goodreads?: string;
  spotify?: string;
  youtube?: string;
  [key: string]: string | undefined;
}

/**
 * Quote Reference entity from the database
 */
export interface QuoteReference {
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
  primary_type: QuoteReferencePrimaryType;
  
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
}

/**
 * Quote Reference with parsed URLs
 */
export interface QuoteReferenceWithUrls extends Omit<QuoteReference, 'urls'> {
  urls: QuoteReferenceUrls;
}

/**
 * Data required to create a new quote reference
 */
export interface CreateQuoteReferenceData {
  name: string;
  original_language?: string;
  release_date?: string | null;
  description?: string | null;
  primary_type: QuoteReferencePrimaryType;
  secondary_type?: string | null;
  image_url?: string | null;
  urls?: QuoteReferenceUrls;
}

/**
 * Data for updating an existing quote reference
 */
export interface UpdateQuoteReferenceData extends Partial<CreateQuoteReferenceData> {
  id: number;
}

/**
 * Quote Reference statistics and metrics
 */
export interface QuoteReferenceStats {
  id: number;
  name: string;
  primary_type: QuoteReferencePrimaryType;
  views_count: number;
  likes_count: number;
  shares_count: number;
  quotes_count?: number;
}

/**
 * Quote Reference with additional computed fields
 */
export interface QuoteReferenceWithMetadata extends QuoteReferenceWithUrls {
  quotes_count?: number;
  is_liked?: boolean;
}
