import { zipSync } from 'fflate'

export default defineEventHandler(async (event) => {
  const { user } = await requireUserSession(event)
  if (user.role !== 'admin' && user.role !== 'moderator') {
    throw createError({ statusCode: 403, statusMessage: 'Admin or moderator access required' })
  }

  const body = await readBody(event) as any
  const {
    format, // internal format for files: json|csv|xml
    include_relations = true,
    include_metadata = false,
    include_user_data = false,
    include_moderation_data = false,
    include_analytics = true,
    limit = 0,
    all_filters = {}
  } = body || {}

  if (!['json', 'csv', 'xml'].includes(format)) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Unsupported export format (use json, csv, or xml)',
    })
  }

  const db = hubDatabase()

  // Lightweight fetchers; rely on per-route builders if needed later
  async function fetchQuotes() {
    let query = `
      SELECT q.*,
             a.name as author_name,
             r.name as reference_name,
             u.name as user_name,
             u.email as user_email
      FROM quotes q
      LEFT JOIN authors a ON q.author_id = a.id
      LEFT JOIN quote_references r ON q.reference_id = r.id
      LEFT JOIN users u ON q.user_id = u.id
    `

    const bindings: any[] = []
    const where: string[] = []
    const qf = all_filters.quotes || {}

    if (qf.language && Array.isArray(qf.language) && qf.language.length) {
      where.push(`q.language IN (${qf.language.map(() => '?').join(',')})`)
      bindings.push(...qf.language)
    }

    if (qf.status && Array.isArray(qf.status) && qf.status.length) {
      where.push(`q.status IN (${qf.status.map(() => '?').join(',')})`)
      bindings.push(...qf.status)
    }

    if (where.length) query += ` WHERE ${where.join(' AND ')}`
    query += ' ORDER BY q.created_at DESC'

    if (limit > 0) { query += ' LIMIT ?'; bindings.push(limit) }

    const queryResponse = await db.prepare(query).bind(...bindings).all()
    return queryResponse.results || []
  }

  async function fetchAuthors() {
    let query = 'SELECT a.* FROM authors a'
    const bindings: any[] = []
    const where: string[] = []
    const af = all_filters.authors || {}

    if (af.is_fictional !== undefined) { where.push('a.is_fictional = ?'); bindings.push(!!af.is_fictional) }
    if (where.length) query += ` WHERE ${where.join(' AND ')}`

    query += ' ORDER BY a.created_at DESC'

    if (limit > 0) { query += ' LIMIT ?'; bindings.push(limit) }

    const queryResponse = await db.prepare(query).bind(...bindings).all()
    return queryResponse.results || []
  }

  async function fetchReferences() {
    let query = 'SELECT r.* FROM quote_references r'
    const bindings: any[] = []
    const where: string[] = []
    const rf = all_filters.references || {}

    if (rf.primary_type && Array.isArray(rf.primary_type) && rf.primary_type.length) {
      where.push(`r.primary_type IN (${rf.primary_type.map(() => '?').join(',')})`)
      bindings.push(...rf.primary_type)
    }

    if (where.length) query += ` WHERE ${where.join(' AND ')}`
    query += ' ORDER BY r.created_at DESC'

    if (limit > 0) { query += ' LIMIT ?'; bindings.push(limit) }
    const queryResponse = await db.prepare(query).bind(...bindings).all()
    return queryResponse.results || []
  }

  async function fetchTags() {
    let query = 'SELECT t.* FROM tags t'
    const bindings: any[] = []
    const where: string[] = []
    const tf = all_filters.tags || {}

    if (tf.category && Array.isArray(tf.category) && tf.category.length) {
      where.push(`t.category IN (${tf.category.map(() => '?').join(',')})`)
      bindings.push(...tf.category)
    }

    if (tf.search && tf.search.trim()) {
      where.push('(t.name LIKE ? OR t.description LIKE ?)')
      bindings.push(`%${tf.search.trim()}%`, `%${tf.search.trim()}%`)
    }

    if (where.length) query += ` WHERE ${where.join(' AND ')}`
    query += ' ORDER BY t.created_at DESC'

    if (limit > 0) { query += ' LIMIT ?'; bindings.push(limit) }

    const queryResponse = await db.prepare(query).bind(...bindings).all()
    return queryResponse.results || []
  }


  async function fetchUsers() {
    let query = 'SELECT u.* FROM users u'
    const bindings: any[] = []
    const where: string[] = []
    const uf = all_filters.users || {}

    if (uf.role && Array.isArray(uf.role) && uf.role.length) {
      where.push(`u.role IN (${uf.role.map(() => '?').join(',')})`)
      bindings.push(...uf.role)
    }

    if (where.length) query += ` WHERE ${where.join(' AND ')}`
    query += ' ORDER BY u.created_at DESC'

    if (limit > 0) { query += ' LIMIT ?'; bindings.push(limit) }

    const queryResponse = await db.prepare(query).bind(...bindings).all()
    return queryResponse.results || []
  }

  const [quotes, authors, references, users, tags] = await Promise.all([
    fetchQuotes(), fetchAuthors(), fetchReferences(), fetchUsers(), fetchTags()
  ])

  function toCSV(rows: any[]): string {
    if (!rows || rows.length === 0) return ''
    const headers = Array.from(new Set(rows.flatMap((r: any) => Object.keys(r))))
    const esc = (v: any) => {
      if (v === null || v === undefined) return ''
      const s = String(v)
      return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s
    }

    const lines = [headers.join(','), ...rows.map(r => headers.map(h => esc(r[h])).join(','))]
    return lines.join('\n')
  }

  function toXML(root: string, item: string, rows: any[]): string {
    const esc = (s: any) => String(s ?? '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')
    const serialize = (obj: any) => Object.entries(obj).map(([k,v]) => `    <${k}>${esc(v)}</${k}>`).join('\n')
    const items = rows.map(r => `  <${item}>\n${serialize(r)}\n  </${item}>`).join('\n')
    return `<?xml version="1.0" encoding="UTF-8"?>\n<${root}>\n${items}\n</${root}>`
  }

  const serialize = (rows: any[], fmt: string, root: string, item: string): string => {
    switch (fmt) {
      case 'json': return JSON.stringify(rows, null, 2)
      case 'csv': return toCSV(rows)
      case 'xml': return toXML(root, item, rows)
      default: return JSON.stringify(rows)
    }
  }

  const enc = new TextEncoder()
  const filesMap: Record<string, Uint8Array> = {}

  filesMap[`quotes.${format}`] = enc.encode(serialize(quotes, format, 'quotes', 'quote'))
  filesMap[`authors.${format}`] = enc.encode(serialize(authors, format, 'authors', 'author'))
  filesMap[`references.${format}`] = enc.encode(serialize(references, format, 'references', 'reference'))
  filesMap[`users.${format}`] = enc.encode(serialize(users, format, 'users', 'user'))
  filesMap[`tags.${format}`] = enc.encode(serialize(tags, format, 'tags', 'tag'))

  if (include_metadata) {
    const meta = {
      generated_at: new Date().toISOString(),
      generated_by: user.id,
      limit,
      include_relations,
      include_user_data,
      include_moderation_data,
      include_analytics,
    }
    filesMap['README.txt'] = enc.encode(`Verbatims Combined Export\n${JSON.stringify(meta, null, 2)}`)
  }

  const content = zipSync(filesMap, { level: 0 })
  // Convert to ArrayBuffer for consistent Blob handling (and for upload)
  const ab = content.byteOffset === 0 && content.byteLength === content.buffer.byteLength
    ? (content.buffer as ArrayBuffer)
    : content.slice().buffer as ArrayBuffer

  const totalRecords = (quotes?.length || 0) + (authors?.length || 0) + (references?.length || 0) + (users?.length || 0) + (tags?.length || 0)
  const fileSize = content.byteLength
  const exportId = `all_export_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`

  setHeader(event, 'Content-Type', 'application/zip')
  const currentDate = new Date().toISOString().replace(/[:.]/g, '-')
  const filename = `all-export-${currentDate}.zip`
  setHeader(event, 'Content-Disposition', `attachment; filename="${filename}"`)

  const filtersApplied = JSON.stringify({
    all_filters,
    include_relations,
    include_metadata,
    include_user_data,
    include_moderation_data,
    include_analytics,
    limit,
  })

  const insertRes = await db.prepare(`
    INSERT INTO export_logs (
      export_id,
      filename,
      format,
      data_type,
      filters_applied,
      record_count,
      file_size,
      user_id,
      include_relations,
      include_metadata
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    exportId,
    filename,
    'zip',
    'all',
    filtersApplied,
    totalRecords,
    fileSize,
    user.id,
    include_relations,
    include_metadata
  ).run()

  const fileKey = generateBackupFilePath(filename)
  const filePath = fileKey
  const contentHash = calculateContentHash(Buffer.from(new Uint8Array(ab)))

  const blob = hubBlob()
  const uploadData = new Blob([ab], { type: 'application/zip' })

  await blob.put(fileKey, uploadData, {
    addRandomSuffix: false,
  })

  const exportLogId = insertRes.meta.last_row_id as number
  const backupId = await createBackupFile(db, {
    file_key: fileKey,
    export_log_id: exportLogId,
    filename,
    file_path: filePath,
    file_size: fileSize,
    compressed_size: fileSize,
    content_hash: contentHash,
    compression_type: 'none',
    retention_days: 90,
    metadata: JSON.stringify({
      export_config: body,
      filters: all_filters,
      created_by: user.id,
      backup_type: 'export',
      data_type: 'all'
    })
  })

  await updateBackupFileStatus(db, backupId, 'stored', new Date())
  return new Blob([ab], { type: 'application/zip' })
})
