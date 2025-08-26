/**
 * Admin API: Validate Reference Data
 * Validates reference data before import without actually importing it
 */

import { validateReferenceDataZod } from '~/server/utils/validation/reference'

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') {
      throw createError({
        statusCode: 403,
        statusMessage: 'Admin access required'
      })
    }

    const body = await readBody(event)
    const { data } = body

    if (!data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No data provided for validation'
      })
    }

    // Validate the data (Zod-based)
    const validationResult = validateReferenceDataZod(data)

    return {
      success: true,
      validation: validationResult,
      dataPreview: {
        totalRecords: Array.isArray(data) ? data.length : 1,
        sampleRecords: Array.isArray(data) ? data.slice(0, 5) : [data]
      }
    }

  } catch (error: any) {
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Validation failed'
    })
  }
})
