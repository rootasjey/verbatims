/**
 * Author entity type definitions
 * Represents authors of quotes in the verbatims application
 */

/**
 * Social media links for an author
 */
export interface AuthorSocials {
  twitter?: string;
  instagram?: string;
  facebook?: string;
  linkedin?: string;
  website?: string;
  wikipedia?: string;
  [key: string]: string | undefined;
}

/**
 * Author entity from the database
 */
export interface Author {
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
  
  /** (Calculated) Number of quotes attributed to this author */
  quotes_count?: number;

  /** If fictional: origin reference id inferred from quotes */
  origin_reference_id?: number;

  /** If fictional: origin reference name inferred from quotes */
  origin_reference_name?: string;
}

/**
 * Author with parsed social media links
 */
export interface AuthorWithSocials extends Omit<Author, 'socials'> {
  socials: AuthorSocials;
}

/**
 * Data required to create a new author
 */
export interface CreateAuthorData {
  name: string;
  is_fictional?: boolean;
  birth_date?: string | null;
  birth_location?: string | null;
  death_date?: string | null;
  death_location?: string | null;
  job?: string | null;
  description?: string | null;
  image_url?: string | null;
  socials?: AuthorSocials;
}

/**
 * Data for updating an existing author
 */
export interface UpdateAuthorData extends Partial<CreateAuthorData> {
  id: number;
}

/**
 * Author statistics and metrics
 */
export interface AuthorStats {
  id: number;
  name: string;
  views_count: number;
  likes_count: number;
  shares_count: number;
  quotes_count?: number;
}
