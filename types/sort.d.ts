/**
* Global sort-related type declarations.
*
* Note: Keep these in sync with server-side allowed sort fields and corresponding
* client options to avoid invalid sort parameters across the app.
*/

export type SortMode = 'relevance' | 'recent' | 'popular'

/**
* Which database column or computed field to sort by.
*
* Supported values must align with:
* - server/utils/sort.ts
* - server-side API validation for sort fields
* - client-side select options
*/
export type SortBy =
 | 'created_at'
 | 'updated_at'
 | 'likes_count'
 | 'views_count'
 | 'shares_count';

/**
* Sort direction.
*
* - "asc": ascending order (smallest to largest, oldest to newest)
* - "desc": descending order (largest to smallest, newest to oldest)
*/
export type SortOrder = 'asc' | 'desc';

/**
* Generic sort query shape used across server endpoints.
*
* Example:
* {
*   sort_by: 'created_at',
*   sort_order: 'desc'
* }
*/
export interface SortQuery {
 /**
  * The field to sort by. If omitted, the endpoint's default is used.
  */
 sort_by?: SortBy;

 /**
  * The sort direction. Defaults to the endpoint's configured order if omitted.
  */
 sort_order?: SortOrder;
}
