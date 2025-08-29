import type {
  ExportOptions,
  UserExportFilters,
  ExportResultWithBackup,
  ExportedUser,
} from '~/types/export'

/**
 * Admin API: Export Users Data
 * Comprehensive users export with filtering, multiple formats, and progress tracking
 */
export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireUserSession(event)
    if (user.role !== 'admin' && user.role !== 'moderator') {
      throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
    }

    const body = await readBody(event) as ExportOptions
    const {
      format,
      filters = {},
      include_relations = true,
      include_metadata = false,
      limit = 0,
    } = body

    const usersFilters = filters as UserExportFilters
    const filterValidation = validateFiltersForUsersExport(usersFilters)
    
    if (!filterValidation.valid) {
      throw createError({ statusCode: 400, statusMessage: `Invalid filters: ${filterValidation.errors.join(', ')}` })
    }

    if (!format) { throw createError({ statusCode: 400, statusMessage: 'Export format is required' }) }
    if (!['json', 'csv', 'xml'].includes(format)) {
      throw createError({ statusCode: 400, statusMessage: 'Unsupported export format. Supported formats: json, csv, xml' })
    }

    const db = hubDatabase()
    const uniqueExportId = `users_export_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`
    const { query, bindings } = buildUsersQuery(usersFilters, include_relations, limit)

    const usersResult = await db.prepare(query).bind(...bindings).all()
    const users = (usersResult?.results || []) as any[]

    const processedUsers: ExportedUser[] = users.map((userRecord: any) => {
      const processed: ExportedUser = {
        id: userRecord.id,
        email: userRecord.email,
        name: userRecord.name,
        avatar_url: userRecord.avatar_url,
        role: userRecord.role,
        is_active: Boolean(userRecord.is_active),
        email_verified: Boolean(userRecord.email_verified),
        biography: userRecord.biography,
        job: userRecord.job,
        language: userRecord.language,
        location: userRecord.location,
        last_login_at: userRecord.last_login_at,
        created_at: userRecord.created_at,
        updated_at: userRecord.updated_at
      }

      if (userRecord.socials) {
        try { processed.socials = JSON.parse(userRecord.socials) } 
        catch (error) { processed.socials = []; console.error('Failed to parse user socials:', error) }
      }

      if (include_relations) {
        if (userRecord.quotes_count !== undefined) { processed.quotes_count = userRecord.quotes_count }
        if (userRecord.collections_count !== undefined) { processed.collections_count = userRecord.collections_count }
      }

      if (include_metadata) {
        processed._metadata = {
          exported_at: new Date().toISOString(),
          exported_by: user.id,
          export_id: uniqueExportId,
          export_filters: usersFilters
        }
      }

      return processed
    })

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
    const filename = `users-export-${timestamp}.${format}`
    let contentData: string
    let mimeType: string

    switch (format) {
      case 'json':
        contentData = JSON.stringify(processedUsers, null, 2)
        mimeType = 'application/json'
        break

      case 'csv':
        contentData = generateUsersCSV(processedUsers)
        mimeType = 'text/csv'
        break

      case 'xml':
        contentData = generateUsersXML(processedUsers)
        mimeType = 'application/xml'
        break

      default:
        throw createError({
          statusCode: 400,
          statusMessage: 'Unsupported export format'
        })
    }

    const fileSize: number = new TextEncoder().encode(contentData).length
    const { exportLogId } = await logUsersExport(db, {
      exportId: uniqueExportId,
      filename,
      format,
      filters: usersFilters,
      recordCount: processedUsers.length,
      userId: user.id,
      fileSize: fileSize
    })

    const backupResult = await createBackup(
      db,
      contentData,
      filename,
      'users',
      format,
      {
        exportLogId,
        retentionDays: 90,
        metadata: {
          export_config: body,
          filters: usersFilters,
          created_by: user.id,
          backup_type: 'export',
          data_type: 'users'
        }
      }
    )

    const backupInfo = {
      backup_id: backupResult.backupId,
      file_key: backupResult.fileKey,
      file_path: backupResult.filePath,
      storage_status: 'stored' as const,
      backup_download_url: `/api/admin/backup/download/${backupResult.backupId}`,
      retention_days: 90,
      expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString()
    }

    const result: ExportResultWithBackup = {
      success: true,
      data: {
        export_id: uniqueExportId,
        filename,
        format,
        record_count: processedUsers.length,
        file_size: fileSize,
        download_url: `/api/admin/export/download/${uniqueExportId}`,
        options: body,
        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() // 24 hours
      },
      backup: backupInfo
    }

    // For smaller exports, still provide direct content for immediate download
    if (contentData.length < 5 * 1024 * 1024) { // Less than 5MB
      const resultData = result.data as any
      resultData.content = contentData
      resultData.mimeType = mimeType
    }

    return result

  } catch (error: any) {
    console.error('Users export error:', error)
    throw createError({
      statusCode: error.statusCode || 500,
      statusMessage: error.statusMessage || 'Export failed'
    })
  }
})

/**
 * Build SQL query for users export with filters
 */
function buildUsersQuery(filters: UserExportFilters, includeRelations: boolean, limit: number) {
  let baseQuery = `
    SELECT 
      u.*
      ${includeRelations ? `,
        COUNT(DISTINCT q.id) as quotes_count,
        COUNT(DISTINCT c.id) as collections_count
      ` : ''}
    FROM users u
    ${includeRelations ? `
      LEFT JOIN quotes q ON u.id = q.user_id AND q.status = 'approved'
      LEFT JOIN user_collections c ON u.id = c.user_id
    ` : ''}
  `

  const conditions: string[] = []
  const bindings: any[] = []

  if (filters.search) {
    conditions.push('(u.name LIKE ? OR u.email LIKE ?)')
    bindings.push(`%${filters.search}%`, `%${filters.search}%`)
  }

  if (filters.role && Array.isArray(filters.role) && filters.role.length > 0) {
    const placeholders = filters.role.map(() => '?').join(',')
    conditions.push(`u.role IN (${placeholders})`)
    bindings.push(...filters.role)
  }

  if (filters.email_verified !== undefined) {
    conditions.push('u.email_verified = ?')
    bindings.push(filters.email_verified)
  }

  if (filters.is_active !== undefined) {
    conditions.push('u.is_active = ?')
    bindings.push(filters.is_active)
  }

  if (filters.language && Array.isArray(filters.language) && filters.language.length > 0) {
    const placeholders = filters.language.map(() => '?').join(',')
    conditions.push(`u.language IN (${placeholders})`)
    bindings.push(...filters.language)
  }

  if (filters.location) {
    conditions.push('u.location LIKE ?')
    bindings.push(`%${filters.location}%`)
  }

  if (filters.job) {
    conditions.push('u.job LIKE ?')
    bindings.push(`%${filters.job}%`)
  }

  if (filters.date_range?.start) {
    conditions.push('u.created_at >= ?')
    bindings.push(filters.date_range.start)
  }

  if (filters.date_range?.end) {
    conditions.push('u.created_at <= ?')
    bindings.push(filters.date_range.end + ' 23:59:59')
  }

  if (filters.last_login_range?.start) {
    conditions.push('u.last_login_at >= ?')
    bindings.push(filters.last_login_range.start)
  }

  if (filters.last_login_range?.end) {
    conditions.push('u.last_login_at <= ?')
    bindings.push(filters.last_login_range.end + ' 23:59:59')
  }

  if (conditions.length > 0) {
    baseQuery += ` WHERE ${conditions.join(' AND ')}`
  }

  if (includeRelations) {
    baseQuery += ' GROUP BY u.id'
  }

  if (filters.min_quotes && filters.min_quotes > 0 && includeRelations) {
    baseQuery += ` HAVING quotes_count >= ${filters.min_quotes}`
  }

  if (filters.min_collections && filters.min_collections > 0 && includeRelations) {
    if (baseQuery.includes('HAVING')) {
      baseQuery += ` AND collections_count >= ${filters.min_collections}`
    } else {
      baseQuery += ` HAVING collections_count >= ${filters.min_collections}`
    }
  }

  baseQuery += ' ORDER BY u.created_at DESC'

  if (limit > 0) {
    baseQuery += ' LIMIT ?'
    bindings.push(limit)
  }

  return { query: baseQuery, bindings }
}

/**
 * Generate CSV format for users export
 */
function generateUsersCSV(users: ExportedUser[]): string {
  if (users.length === 0) return ''

  const headers = [
    'id', 'email', 'name', 'avatar_url', 'role', 'is_active', 'email_verified',
    'biography', 'job', 'language', 'location', 'socials', 'last_login_at',
    'quotes_count', 'collections_count', 'created_at', 'updated_at'
  ]

  const csvRows = [
    headers.join(','), // Header row
    ...users.map(user => {
      const row = [
        user.id,
        `"${(user.email || '').replace(/"/g, '""')}"`,
        `"${(user.name || '').replace(/"/g, '""')}"`,
        user.avatar_url || '',
        user.role,
        user.is_active,
        user.email_verified,
        `"${(user.biography || '').replace(/"/g, '""')}"`,
        `"${(user.job || '').replace(/"/g, '""')}"`,
        user.language,
        `"${(user.location || '').replace(/"/g, '""')}"`,
        `"${user.socials ? JSON.stringify(user.socials).replace(/"/g, '""') : ''}"`,
        user.last_login_at || '',
        user.quotes_count || '',
        user.collections_count || '',
        user.created_at,
        user.updated_at
      ]
      return row.join(',')
    })
  ]

  return csvRows.join('\n')
}

/**
 * Generate XML format for users export
 */
function generateUsersXML(users: ExportedUser[]): string {
  const escapeXml = (str: string) => {
    return str.replace(/[<>&'"]/g, (char) => {
      switch (char) {
        case '<': return '&lt;'
        case '>': return '&gt;'
        case '&': return '&amp;'
        case "'": return '&apos;'
        case '"': return '&quot;'
        default: return char
      }
    })
  }

  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n'
  xml += '<users>\n'

  users.forEach(user => {
    xml += '  <user>\n'
    xml += `    <id>${user.id}</id>\n`
    xml += `    <email><![CDATA[${user.email}]]></email>\n`
    xml += `    <name><![CDATA[${user.name}]]></name>\n`

    if (user.avatar_url) xml += `    <avatar_url>${escapeXml(user.avatar_url)}</avatar_url>\n`

    xml += `    <role>${user.role}</role>\n`
    xml += `    <is_active>${user.is_active}</is_active>\n`
    xml += `    <email_verified>${user.email_verified}</email_verified>\n`

    if (user.biography) xml += `    <biography><![CDATA[${user.biography}]]></biography>\n`
    if (user.job) xml += `    <job><![CDATA[${user.job}]]></job>\n`

    xml += `    <language>${user.language}</language>\n`

    if (user.location) xml += `    <location><![CDATA[${user.location}]]></location>\n`

    if (user.socials && user.socials.length > 0) {
      xml += '    <socials>\n'
      user.socials.forEach(social => {
        xml += '      <social>\n'
        xml += `        <platform><![CDATA[${social.platform}]]></platform>\n`
        xml += `        <url>${escapeXml(social.url)}</url>\n`
        if (social.username) xml += `        <username><![CDATA[${social.username}]]></username>\n`
        xml += '      </social>\n'
      })
      xml += '    </socials>\n'
    }

    if (user.last_login_at) xml += `    <last_login_at>${user.last_login_at}</last_login_at>\n`

    if (user.quotes_count !== undefined) {
      xml += `    <quotes_count>${user.quotes_count}</quotes_count>\n`
    }

    if (user.collections_count !== undefined) {
      xml += `    <collections_count>${user.collections_count}</collections_count>\n`
    }

    xml += `    <created_at>${user.created_at}</created_at>\n`
    xml += `    <updated_at>${user.updated_at}</updated_at>\n`

    if (user._metadata) {
      xml += '    <metadata>\n'
      xml += `      <exported_at>${user._metadata.exported_at}</exported_at>\n`
      xml += `      <exported_by>${user._metadata.exported_by}</exported_by>\n`
      xml += `      <export_id>${user._metadata.export_id}</export_id>\n`
      xml += '    </metadata>\n'
    }

    xml += '  </user>\n'
  })

  xml += '</users>'
  return xml
}

/**
 * Log users export to database
 */
async function logUsersExport(db: any, exportInfo: {
  exportId: string
  filename: string
  format: string
  filters: UserExportFilters
  recordCount: number
  userId: number
  fileSize: number
  includeRelations?: boolean
  includeMetadata?: boolean
}): Promise<{ exportLogId: number }> {
  try {
    const result = await db.prepare(`
      INSERT INTO export_logs (
        export_id, filename, format, data_type, 
        filters_applied, record_count, file_size, 
        user_id, include_relations, include_metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      exportInfo.exportId,
      exportInfo.filename,
      exportInfo.format,
      'users',
      JSON.stringify(exportInfo.filters),
      exportInfo.recordCount,
      exportInfo.fileSize,
      exportInfo.userId,
      exportInfo.includeRelations || false,
      exportInfo.includeMetadata || false
  ).run()

  return { exportLogId: result.meta.last_row_id }

  } catch (error) {
    console.error('Failed to log users export:', error)
    return { exportLogId: 0 } // Return a fallback ID if logging fails
  }
}

/**
 * Validate filters for users export
 */
function validateFiltersForUsersExport(filters: UserExportFilters) {
  const validation = {
    valid: true,
    errors: [] as string[],
    warnings: [] as string[]
  }

  if (filters.date_range?.start && filters.date_range?.end) {
    if (new Date(filters.date_range.start) > new Date(filters.date_range.end)) {
      validation.errors.push('Date range start must be before end date')
      validation.valid = false
    }
  }

  if (filters.last_login_range?.start && filters.last_login_range?.end) {
    if (new Date(filters.last_login_range.start) > new Date(filters.last_login_range.end)) {
      validation.errors.push('Last login date range start must be before end date')
      validation.valid = false
    }
  }

  if (filters.min_quotes !== undefined && filters.min_quotes < 0) {
    validation.errors.push('Minimum quotes count must be non-negative')
    validation.valid = false
  }

  if (filters.min_collections !== undefined && filters.min_collections < 0) {
    validation.errors.push('Minimum collections count must be non-negative')
    validation.valid = false
  }

  if (filters.role && Array.isArray(filters.role)) {
    const validRoles = ['user', 'moderator', 'admin']
    const invalidRoles = filters.role.filter(role => !validRoles.includes(role))
    if (invalidRoles.length > 0) {
      validation.valid = false
      validation.errors.push(`
        Invalid roles: ${invalidRoles.join(', ')}. 
        Valid roles are: ${validRoles.join(', ')}
      `)
    }
  }

  if (filters.language && Array.isArray(filters.language)) {
    const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
    const invalidLanguages = filters.language.filter(lang => !validLanguages.includes(lang))
    if (invalidLanguages.length > 0) {
      validation.valid = false
      validation.errors.push(`
        Invalid languages: ${invalidLanguages.join(', ')}. 
        Valid languages are: ${validLanguages.join(', ')}
      `)
    }
  }

  return validation
}
