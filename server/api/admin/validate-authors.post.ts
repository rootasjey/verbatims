import { validateAuthorDataZod } from '~/server/utils/validation/author'

/**
 * Admin API: Validate Author Data
 * Validates author data before import without actually importing it
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

    const body = await readBody(event)
    const { data } = body || {}
    if (!data) { throw createError({ statusCode: 400, statusMessage: 'No data provided for validation' }) }

    const validationResult = validateAuthorDataZod(data)

    return {
      success: true,
      validation: validationResult,
      dataPreview: {
        totalRecords: Array.isArray(data) ? data.length : 1,
        sampleRecords: Array.isArray(data) ? data.slice(0, 5) : [data]
      }
    }
  } catch (error: any) {
    throw createError({ statusCode: error.statusCode || 500, statusMessage: error.statusMessage || 'Validation failed' })
  }
})

