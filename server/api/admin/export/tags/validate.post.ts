import { db, schema } from 'hub:db'
import { inArray, sql } from 'drizzle-orm'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (!user || (user.role !== 'admin' && user.role !== 'moderator')) {
    throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
  }

  const body = await readBody(event) as ExportOptions
  const { format, filters = {}, limit = 0 } = body

  const validation: ExportValidation = { valid: true, errors: [], warnings: [] }

  if (!format || !['json', 'csv', 'xml'].includes(format)) {
    validation.errors.push('Unsupported export format. Supported formats: json, csv, xml')
    validation.valid = false
  }

  const tagFilters = (filters || {}) as TagExportFilters

  // Date range validation
  if (tagFilters.date_range?.start && tagFilters.date_range?.end) {
    const start = new Date(tagFilters.date_range.start)
    const end = new Date(tagFilters.date_range.end)
    if (isNaN(start.getTime()) || isNaN(end.getTime())) {
      validation.errors.push('Invalid date format. Use YYYY-MM-DD')
      validation.valid = false
    } else if (start > end) {
      validation.errors.push('Start date must be before end date')
      validation.valid = false
    }
  }

  if (tagFilters.min_usage !== undefined && (tagFilters.min_usage < 0 || !Number.isInteger(tagFilters.min_usage))) {
    validation.errors.push('min_usage must be a non-negative integer')
    validation.valid = false
  }

  if (limit !== undefined && limit !== null && (limit as number) < 0) {
    validation.errors.push('limit must be >= 0')
    validation.valid = false
  }

  // Quick estimate
  try {
    const { query } = buildTagsCountQuery(tagFilters);
    const countResult = await query;
    const estimated = Number(countResult[0]?.total || 0);
    validation.estimated_count = estimated;
  } catch (e) {
    // Non-fatal for validation
    validation.warnings.push('Failed to estimate record count')
  }

  return { success: true, data: validation }
})

function buildTagsCountQuery(filters: TagExportFilters) {
  let query = db
    .select({ total: sql<number>`COUNT(DISTINCT ${schema.tags.id})`.as('total') })
    .from(schema.tags)
    .$dynamic()

  if (filters.unused_only || (typeof filters.min_usage === 'number' && filters.min_usage > 0)) {
    query = query.leftJoin(schema.quoteTags, sql`${schema.tags.id} = ${schema.quoteTags.tagId}`);
  }

  if (filters.search && filters.search.trim()) {
    const searchTerm = `%${filters.search.trim()}%`;
    query = query.where(
      sql`${schema.tags.name} LIKE ${searchTerm} OR ${schema.tags.description} LIKE ${searchTerm}`
    );
  }

  if (filters.category) {
    const cats = Array.isArray(filters.category) ? filters.category : [filters.category];
    query = query.where(inArray(schema.tags.category, cats));
  }

  if (filters.color) {
    const cols = Array.isArray(filters.color) ? filters.color : [filters.color];
    query = query.where(inArray(schema.tags.color, cols));
  }

  if (filters.date_range?.start) {
    query = query.where(sql`${schema.tags.createdAt} >= ${filters.date_range.start}`);
  }
  if (filters.date_range?.end) {
    query = query.where(sql`${schema.tags.createdAt} <= ${filters.date_range.end + ' 23:59:59'}`);
  }

  return { query };
}

