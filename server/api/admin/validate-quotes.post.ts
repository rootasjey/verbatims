import type { validateQuoteDataZod } from '~/types''~/server/utils/validation/quote'

/**
 * Admin API: Validate Quote Data
 * Validates quote data before import without actually importing it
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') throwServer(403, 'Admin access required')

    const body = await readBody(event)
    const { data } = body || {}
    if (!data) throwServer(400, 'No data provided for validation')
    const validationResult = validateQuoteDataZod(data)

    return {
      success: true,
      validation: validationResult,
      dataPreview: {
        totalRecords: Array.isArray(data) ? data.length : 1,
        sampleRecords: Array.isArray(data) ? data.slice(0, 5) : [data]
      }
    }
  } catch (error: any) {
    if (error.statusCode) throw error
    throwServer(500, 'Validation failed')
  }
})

