/**
 * Tag entity type definitions
 * Represents tags for categorizing quotes
 */

/**
 * Tag entity from the database
 */
export interface Tag {
  /** Unique identifier for the tag */
  id: number;
  
  /** Tag name (unique) */
  name: string;
  
  /** Description of what this tag represents */
  description: string | null;
  
  /** Category grouping for the tag */
  category: string | null;
  
  /** Hex color code for visual representation */
  color: string;
  
  /** Timestamp when record was created */
  created_at: string;
  
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Quote-Tag relationship entity
 */
export interface QuoteTag {
  /** ID of the quote */
  quote_id: number;
  
  /** ID of the tag */
  tag_id: number;
}

/**
 * Data required to create a new tag
 */
export interface CreateTagData {
  name: string;
  description?: string | null;
  category?: string | null;
  color?: string;
}

/**
 * Data for updating an existing tag
 */
export interface UpdateTagData extends Partial<CreateTagData> {
  id: number;
}

/**
 * Tag with usage statistics
 */
export interface TagWithStats extends Tag {
  /** Number of quotes using this tag */
  usage_count?: number;
}

/**
 * Tag with additional metadata
 */
export interface TagWithMetadata extends Tag {
  usage_count?: number;
  is_selected?: boolean;
}

/**
 * Tag category grouping
 */
export interface TagCategory {
  category: string;
  tags: Tag[];
  count: number;
}

/**
 * Tag search and filter options
 */
export interface TagFilters {
  category?: string;
  search?: string;
  color?: string;
}

/**
 * Popular tags response
 */
export interface PopularTag extends Tag {
  usage_count: number;
}
