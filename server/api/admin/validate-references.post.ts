/**
 * Admin API: Validate Reference Data
 * Validates reference data before import without actually importing it
 */

import type { validateReferenceDataZod } from '~/types''~/server/utils/validation/reference'

export default defineEventHandler(async (event) => {
  try {
    // Check admin permissions
    const { user } = await requireUserSession(event)
    if (!user || user.role !== 'admin') throwServer(403, 'Admin access required')

    const body = await readBody(event)
    const { data } = body; if (!data) throwServer(400, 'No data provided for validation')

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
    if (error.statusCode) throw error
    throwServer(500, 'Validation failed')
  }
})
