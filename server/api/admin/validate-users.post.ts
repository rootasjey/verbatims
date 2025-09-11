import { validateUserDataZod } from '~/server/utils/validation/user'

/**
 * Admin API: Validate User Data
 * Validates user data before import without actually importing it
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin') { throw createError({ statusCode: 403, statusMessage: 'Admin access required' }) }

    const body = await readBody(event)
    const { data } = body || {}
    if (!data) { throw createError({ statusCode: 400, statusMessage: 'No data provided for validation' }) }
    
    const validationResult = validateUserDataZod(data)

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

