import { zipSync } from 'fflate'
import { db, schema } from 'hub:db'
import { blob } from 'hub:blob'
import { eq, inArray, sql, desc } from 'drizzle-orm'

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

  // Lightweight fetchers; rely on per-route builders if needed later

  // Place fetchQuoteTags after db is defined
  async function fetchQuoteTags() {
    return await db.select().from(schema.quoteTags);
  }
  async function fetchQuotes() {
    const qf = all_filters.quotes || {}
    let query = db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      status: schema.quotes.status,
      authorId: schema.quotes.authorId,
      referenceId: schema.quotes.referenceId,
      userId: schema.quotes.userId,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      moderatedAt: schema.quotes.moderatedAt,
      rejectionReason: schema.quotes.rejectionReason,
      author_name: schema.authors.name,
      reference_name: schema.quoteReferences.name,
      user_name: schema.users.name,
      user_email: schema.users.email,
    })
      .from(schema.quotes)
      .leftJoin(schema.authors, eq(schema.quotes.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quotes.referenceId, schema.quoteReferences.id))
      .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
      .$dynamic()

    if (qf.language && Array.isArray(qf.language) && qf.language.length) {
      query = query.where(inArray(schema.quotes.language, qf.language))
    }

    if (qf.status && Array.isArray(qf.status) && qf.status.length) {
      query = query.where(inArray(schema.quotes.status, qf.status))
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    query = query.orderBy(desc(schema.quotes.createdAt))

    return await query
  }

  async function fetchAuthors() {
    const af = all_filters.authors || {}
    let query = db.select().from(schema.authors).$dynamic()

    if (af.is_fictional !== undefined) {
      query = query.where(eq(schema.authors.isFictional, !!af.is_fictional))
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    query = query.orderBy(desc(schema.authors.createdAt))

    return await query
  }

  async function fetchReferences() {
    const rf = all_filters.references || {}
    let query = db.select().from(schema.quoteReferences).$dynamic()

    if (rf.primary_type && Array.isArray(rf.primary_type) && rf.primary_type.length) {
      query = query.where(inArray(schema.quoteReferences.primaryType, rf.primary_type))
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    query = query.orderBy(desc(schema.quoteReferences.createdAt))

    return await query
  }

  async function fetchTags() {
    const tf = all_filters.tags || {}
    let query = db.select().from(schema.tags).$dynamic()

    if (tf.category && Array.isArray(tf.category) && tf.category.length) {
      query = query.where(inArray(schema.tags.category, tf.category))
    }

    if (tf.search && tf.search.trim()) {
      const searchTerm = `%${tf.search.trim()}%`;
      query = query.where(
        sql`${schema.tags.name} LIKE ${searchTerm} OR ${schema.tags.description} LIKE ${searchTerm}`
      )
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    query = query.orderBy(desc(schema.tags.createdAt))

    return await query
  }

  async function fetchUsers() {
    const uf = all_filters.users || {}
    let query = db.select().from(schema.users).$dynamic()

    if (uf.role && Array.isArray(uf.role) && uf.role.length) {
      query = query.where(inArray(schema.users.role, uf.role))
    }

    if (limit > 0) {
      query = query.limit(limit)
    }

    query = query.orderBy(desc(schema.users.createdAt))

    return await query
  }

  // User-related fetchers
  async function fetchUserLikes() {
    return await db.select().from(schema.userLikes);
  }

  async function fetchUserCollections() {
    return await db.select().from(schema.userCollections);
  }

  async function fetchCollectionQuotes() {
    return await db.select().from(schema.collectionQuotes);
  }

  async function fetchUserSessions() {
    return await db.select().from(schema.userSessions);
  }

  async function fetchUserMessages() {
    return await db.select().from(schema.userMessages);
  }

  // Moderation-related fetchers
  async function fetchQuoteReports() {
    return await db.select().from(schema.quoteReports);
  }

  // Analytics-related fetchers
  async function fetchQuoteViews() {
    return await db.select().from(schema.quoteViews);
  }

  async function fetchAuthorViews() {
    return await db.select().from(schema.authorViews);
  }

  async function fetchReferenceViews() {
    return await db.select().from(schema.referenceViews);
  }

  const [quotes, authors, references, users, tags] = await Promise.all([
    fetchQuotes(), fetchAuthors(), fetchReferences(), fetchUsers(), fetchTags()
  ]);

  // Conditionally fetch additional data based on export options
  let quoteTags: any[] = [];
  let userLikes: any[] = [], userCollections: any[] = [], collectionQuotes: any[] = [], userSessions: any[] = [], userMessages: any[] = [];
  let quoteReports: any[] = [];
  let quoteViews: any[] = [], authorViews: any[] = [], referenceViews: any[] = [];

  if (include_relations) {
    quoteTags = await fetchQuoteTags();
  }

  if (include_user_data) {
    [userLikes, userCollections, collectionQuotes, userSessions, userMessages] = await Promise.all([
      fetchUserLikes(),
      fetchUserCollections(),
      fetchCollectionQuotes(),
      fetchUserSessions(),
      fetchUserMessages()
    ]);
  }

  if (include_moderation_data) {
    quoteReports = await fetchQuoteReports();
  }

  if (include_analytics) {
    [quoteViews, authorViews, referenceViews] = await Promise.all([
      fetchQuoteViews(),
      fetchAuthorViews(),
      fetchReferenceViews()
    ]);
  }

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

  // Conditionally include quote_tags if include_relations is true
  if (include_relations) {
    filesMap[`quote_tags.${format}`] = enc.encode(serialize(quoteTags, format, 'quote_tags', 'quote_tag'));
  }

  // Conditionally include user-related tables if include_user_data is true
  if (include_user_data) {
    filesMap[`user_likes.${format}`] = enc.encode(serialize(userLikes, format, 'user_likes', 'user_like'));
    filesMap[`user_collections.${format}`] = enc.encode(serialize(userCollections, format, 'user_collections', 'user_collection'));
    filesMap[`collection_quotes.${format}`] = enc.encode(serialize(collectionQuotes, format, 'collection_quotes', 'collection_quote'));
    filesMap[`user_sessions.${format}`] = enc.encode(serialize(userSessions, format, 'user_sessions', 'user_session'));
    filesMap[`user_messages.${format}`] = enc.encode(serialize(userMessages, format, 'user_messages', 'user_message'));
  }

  // Conditionally include moderation-related tables if include_moderation_data is true
  if (include_moderation_data) {
    filesMap[`quote_reports.${format}`] = enc.encode(serialize(quoteReports, format, 'quote_reports', 'quote_report'));
  }

  // Conditionally include analytics-related tables if include_analytics is true
  if (include_analytics) {
    filesMap[`quote_views.${format}`] = enc.encode(serialize(quoteViews, format, 'quote_views', 'quote_view'));
    filesMap[`author_views.${format}`] = enc.encode(serialize(authorViews, format, 'author_views', 'author_view'));
    filesMap[`reference_views.${format}`] = enc.encode(serialize(referenceViews, format, 'reference_views', 'reference_view'));
  }

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

  const totalRecords = (quotes?.length || 0) + (authors?.length || 0) + (references?.length || 0) + (users?.length || 0) + (tags?.length || 0) +
    (quoteTags?.length || 0) + (userLikes?.length || 0) + (userCollections?.length || 0) + (collectionQuotes?.length || 0) +
    (userSessions?.length || 0) + (userMessages?.length || 0) + (quoteReports?.length || 0) +
    (quoteViews?.length || 0) + (authorViews?.length || 0) + (referenceViews?.length || 0)
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

  const inserted = await db
    .insert(schema.exportLogs)
    .values({
      exportId,
      filename,
      format: 'zip',
      dataType: 'all',
      filtersApplied,
      recordCount: totalRecords,
      fileSize,
      userId: user.id,
      includeRelations: include_relations,
      includeMetadata: include_metadata,
    })
    .returning({ id: schema.exportLogs.id })
    .get()

  const fileKey = generateBackupFilePath(filename)
  const filePath = fileKey
  const contentHash = calculateContentHash(Buffer.from(new Uint8Array(ab)))

  const uploadData = new Blob([ab], { type: 'application/zip' })

  await blob.put(fileKey, uploadData, {
    addRandomSuffix: false,
  })

  const exportLogId = inserted.id
  const backupId = await createBackupFile({
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

  await updateBackupFileStatus(backupId, 'stored', new Date())
  return new Blob([ab], { type: 'application/zip' })
})
