import type { SortBy, SortOrder, SortQuery } from "~/types";

/**
 * Validate a provided column against allowed set. Falls back to default if invalid.
 */
function validateColumn(col: string | undefined, allowed: string[], fallback: SortBy): SortBy {
  if (!col) return fallback;
  const normalized = allowed.includes(col) ? col : fallback;
  return normalized as SortBy;
}

/**
 * Validate a provided order. Falls back to 'desc' if invalid.
 */
function validateOrder(order?: string): SortOrder {
  return order === 'asc' ? 'asc' : 'desc';
}

/**
 * Normalize sort_by and sort_order only.
 * Defaults to created_at DESC.
 */
export function getSortParams(
  input: Partial<SortQuery> = {},
  allowedColumns: SortBy[] = ['created_at', 'likes_count', 'views_count']
): SortQuery {
  const sort_by = validateColumn(input.sort_by, allowedColumns, 'created_at');
  const sort_order = validateOrder(input.sort_order);

  return { sort_by, sort_order };
}

export function parseSort(v: any): 'relevance' | 'recent' | 'popular' {
  const s = String(v || '').toLowerCase()
  return s === 'relevance' || s === 'recent' || s === 'popular' ? s : 'relevance'
}

export function parseSortOrder(v: any): 'asc' | 'desc' {
  const s = String(v || '').toLowerCase()
  return s === 'asc' ? 'asc' : 'desc'
}
