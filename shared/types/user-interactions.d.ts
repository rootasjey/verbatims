/**
 * User Interactions type definitions
 * Represents user likes, collections, and other interaction data
 */

/**
 * Types of entities that can be liked
 */
export type LikeableType = 'quote' | 'author' | 'reference';

/**
 * User Like entity from the database
 */
export interface UserLike {
  /** Unique identifier for the like */
  id: number;
  
  /** ID of the user who liked */
  user_id: number;
  
  /** Type of entity being liked */
  likeable_type: LikeableType;
  
  /** ID of the entity being liked */
  likeable_id: number;
  
  /** Timestamp when like was created */
  created_at: string;
}

/**
 * User Collection entity from the database
 */
export interface UserCollection {
  /** Unique identifier for the collection */
  id: number;
  
  /** ID of the user who owns this collection */
  user_id: number;
  
  /** Name of the collection */
  name: string;
  
  /** Description of the collection */
  description: string | null;
  
  /** Whether the collection is publicly visible */
  is_public: boolean;
  
  /** Timestamp when record was created */
  created_at: string;
  
  /** Timestamp when record was last updated */
  updated_at: string;
}

/**
 * Collection-Quote relationship entity
 */
export interface CollectionQuote {
  /** ID of the collection */
  collection_id: number;
  
  /** ID of the quote */
  quote_id: number;
  
  /** Timestamp when quote was added to collection */
  added_at: string;
}

/**
 * Data required to create a new collection
 */
export interface CreateCollectionData {
  user_id: number;
  name: string;
  description?: string | null;
  is_public?: boolean;
}

/**
 * Data for updating an existing collection
 */
export interface UpdateCollectionData extends Partial<Omit<CreateCollectionData, 'user_id'>> {
  id: number;
}

/**
 * Collection with quote count
 */
export interface CollectionWithStats extends UserCollection {
  /** Number of quotes in this collection */
  quotes_count?: number;
}

/**
 * Collection with populated quotes
 */
export interface CollectionWithQuotes extends UserCollection {
  quotes?: Array<{
    id: number;
    name: string;
    author?: { id: number; name: string } | null;
    added_at: string;
  }>;
  quotes_count?: number;
}

/**
 * Data for adding/removing quotes from collections
 */
export interface CollectionQuoteAction {
  collection_id: number;
  quote_id: number;
}

/**
 * Like action data
 */
export interface LikeAction {
  user_id: number;
  likeable_type: LikeableType;
  likeable_id: number;
}

/**
 * User's interaction summary
 */
export interface UserInteractionSummary {
  user_id: number;
  total_likes: number;
  total_collections: number;
  public_collections: number;
  private_collections: number;
  total_quotes_in_collections: number;
}

/**
 * Collection filters and search
 */
export interface CollectionFilters {
  user_id?: number;
  is_public?: boolean;
  search?: string;
}

/**
 * Popular collections response
 */
export interface PopularCollection extends CollectionWithStats {
  owner_name: string;
}
