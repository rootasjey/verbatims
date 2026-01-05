/**
 * Analytics and tracking type definitions
 * Represents view tracking and engagement metrics
 */

/**
 * Quote View entity from the database
 */
export interface QuoteView {
  /** Unique identifier for the view */
  id: number;
  
  /** ID of the quote that was viewed */
  quote_id: number;
  
  /** ID of the user who viewed (null for anonymous) */
  user_id: number | null;
  
  /** IP address for anonymous tracking */
  ip_address: string | null;
  
  /** User agent string from the browser */
  user_agent: string | null;
  
  /** Timestamp when view occurred */
  viewed_at: string;
}

/**
 * Data for tracking a new view
 */
export interface CreateViewData {
  quote_id: number;
  user_id?: number | null;
  ip_address?: string | null;
  user_agent?: string | null;
}

/**
 * Analytics time period options
 */
export type AnalyticsPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'all';

/**
 * View analytics aggregated data
 */
export interface ViewAnalytics {
  period: AnalyticsPeriod;
  total_views: number;
  unique_views: number;
  authenticated_views: number;
  anonymous_views: number;
  views_by_date: Array<{
    date: string;
    views: number;
    unique_views: number;
  }>;
}

/**
 * Quote performance metrics
 */
export interface QuoteMetrics {
  quote_id: number;
  quote_name: string;
  total_views: number;
  unique_views: number;
  likes_count: number;
  shares_count: number;
  engagement_rate: number;
  views_by_period: Record<AnalyticsPeriod, number>;
  author?: {
    id: number;
    name: string;
  } | null;
}

/**
 * Author performance metrics
 */
export interface AuthorMetrics {
  author_id: number;
  author_name: string;
  total_quotes: number;
  total_views: number;
  total_likes: number;
  average_engagement: number;
  top_quotes: Array<{
    id: number;
    name: string;
    views: number;
    likes: number;
  }>;
}

/**
 * Reference performance metrics
 */
export interface ReferenceMetrics {
  reference_id: number;
  reference_name: string;
  primary_type: string;
  total_quotes: number;
  total_views: number;
  total_likes: number;
  average_engagement: number;
  top_quotes: Array<{
    id: number;
    name: string;
    views: number;
    likes: number;
  }>;
}

/**
 * User engagement metrics
 */
export interface UserEngagementMetrics {
  user_id: number;
  user_name: string;
  quotes_submitted: number;
  quotes_approved: number;
  total_likes_given: number;
  total_likes_received: number;
  collections_created: number;
  quotes_in_collections: number;
  last_activity: string;
}

/**
 * Platform-wide analytics dashboard
 */
export interface PlatformAnalytics {
  overview: {
    total_quotes: number;
    total_authors: number;
    total_references: number;
    total_users: number;
    total_views: number;
    total_likes: number;
  };
  growth: {
    new_quotes_this_period: number;
    new_users_this_period: number;
    growth_rate: number;
  };
  engagement: {
    average_views_per_quote: number;
    average_likes_per_quote: number;
    most_active_users: UserEngagementMetrics[];
  };
  content: {
    top_quotes: QuoteMetrics[];
    top_authors: AuthorMetrics[];
    top_references: ReferenceMetrics[];
  };
  trends: {
    popular_languages: Array<{
      language: string;
      count: number;
      percentage: number;
    }>;
    popular_categories: Array<{
      category: string;
      count: number;
      percentage: number;
    }>;
  };
}

/**
 * Analytics filters
 */
export interface AnalyticsFilters {
  period?: AnalyticsPeriod;
  start_date?: string;
  end_date?: string;
  user_id?: number;
  author_id?: number;
  reference_id?: number;
  language?: string;
  category?: string;
}
