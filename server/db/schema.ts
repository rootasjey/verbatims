import { sqliteTable, text, integer, index, uniqueIndex, primaryKey } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

export const users = sqliteTable('users', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  email: text('email').notNull().unique(),
  name: text('name').notNull(),
  password: text('password').notNull(),
  avatarUrl: text('avatar_url'),
  role: text('role', { enum: ['user', 'moderator', 'admin'] }).default('user'),
  isActive: integer('is_active', { mode: 'boolean' }).default(true),
  emailVerified: integer('email_verified', { mode: 'boolean' }).default(false),
  biography: text('biography'),
  job: text('job'),
  language: text('language').default('en'),
  location: text('location').default('On Earth'),
  socials: text('socials').default('[]'), // JSON string
  lastLoginAt: integer('last_login_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  emailIdx: index('idx_users_email').on(table.email),
  roleIdx: index('idx_users_role').on(table.role),
}))

export const authors = sqliteTable('authors', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  isFictional: integer('is_fictional', { mode: 'boolean' }).default(false),
  birthDate: text('birth_date'), // SQLite doesn't have DATE type, usually text
  birthLocation: text('birth_location'),
  deathDate: text('death_date'),
  deathLocation: text('death_location'),
  job: text('job'),
  description: text('description'),
  imageUrl: text('image_url'),
  socials: text('socials').default('[]'),
  viewsCount: integer('views_count').default(0),
  likesCount: integer('likes_count').default(0),
  sharesCount: integer('shares_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  nameIdx: index('idx_authors_name').on(table.name),
}))

export const quoteReferences = sqliteTable('quote_references', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  originalLanguage: text('original_language').default('en'),
  releaseDate: text('release_date'),
  description: text('description'),
  primaryType: text('primary_type', { enum: ['film', 'book', 'tv_series', 'music', 'speech', 'podcast', 'interview', 'documentary', 'media_stream', 'writings', 'video_game', 'other'] }).notNull(),
  secondaryType: text('secondary_type'),
  imageUrl: text('image_url'),
  urls: text('urls').default('[]'),
  viewsCount: integer('views_count').default(0),
  likesCount: integer('likes_count').default(0),
  sharesCount: integer('shares_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  typeIdx: index('idx_references_type').on(table.primaryType),
}))

export const quotes = sqliteTable('quotes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  language: text('language', { enum: ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la'] }).default('en'),
  authorId: integer('author_id').references(() => authors.id),
  referenceId: integer('reference_id').references(() => quoteReferences.id),
  userId: integer('user_id').notNull().references(() => users.id),
  status: text('status', { enum: ['draft', 'pending', 'approved', 'rejected'] }).default('draft'),
  moderatorId: integer('moderator_id').references(() => users.id),
  moderatedAt: integer('moderated_at', { mode: 'timestamp' }),
  rejectionReason: text('rejection_reason'),
  viewsCount: integer('views_count').default(0),
  likesCount: integer('likes_count').default(0),
  sharesCount: integer('shares_count').default(0),
  isFeatured: integer('is_featured', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  statusIdx: index('idx_quotes_status').on(table.status),
  authorIdx: index('idx_quotes_author').on(table.authorId),
  referenceIdx: index('idx_quotes_reference').on(table.referenceId),
  userIdx: index('idx_quotes_user').on(table.userId),
  createdIdx: index('idx_quotes_created').on(table.createdAt),
  featuredIdx: index('idx_quotes_featured').on(table.isFeatured),
  languageIdx: index('idx_quotes_language').on(table.language),
}))

export const tags = sqliteTable('tags', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull().unique(),
  description: text('description'),
  category: text('category'),
  color: text('color').default('#3B82F6'),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
})

export const quoteTags = sqliteTable('quote_tags', {
  quoteId: integer('quote_id').references(() => quotes.id, { onDelete: 'cascade' }),
  tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }),
}, (table) => ({
  pk: primaryKey({ columns: [table.quoteId, table.tagId] }),
}))

export const userLikes = sqliteTable('user_likes', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  likeableType: text('likeable_type', { enum: ['quote', 'author', 'reference'] }).notNull(),
  likeableId: integer('likeable_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  uniqueLike: uniqueIndex('unique_user_like').on(table.userId, table.likeableType, table.likeableId),
  userIdx: index('idx_user_likes_user').on(table.userId),
  likeableIdx: index('idx_user_likes_likeable').on(table.likeableType, table.likeableId),
}))

export const userCollections = sqliteTable('user_collections', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  description: text('description'),
  isPublic: integer('is_public', { mode: 'boolean' }).default(false),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
})

export const collectionQuotes = sqliteTable('collection_quotes', {
  collectionId: integer('collection_id').references(() => userCollections.id, { onDelete: 'cascade' }),
  quoteId: integer('quote_id').references(() => quotes.id, { onDelete: 'cascade' }),
  addedAt: integer('added_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  pk: primaryKey({ columns: [table.collectionId, table.quoteId] }),
}))

export const userSessions = sqliteTable('user_sessions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  sessionToken: text('session_token').notNull().unique(),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  tokenIdx: index('idx_user_sessions_token').on(table.sessionToken),
  expiresIdx: index('idx_user_sessions_expires').on(table.expiresAt),
}))

export const quoteReports = sqliteTable('quote_reports', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteId: integer('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  reporterId: integer('reporter_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  reason: text('reason', { enum: ['spam', 'inappropriate', 'copyright', 'misinformation', 'other'] }).notNull(),
  description: text('description'),
  status: text('status', { enum: ['pending', 'reviewed', 'resolved'] }).default('pending'),
  reviewedBy: integer('reviewed_by').references(() => users.id),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  statusIdx: index('idx_quote_reports_status').on(table.status),
}))

export const userMessages = sqliteTable('user_messages', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  name: text('name'),
  email: text('email'),
  category: text('category', { enum: ['bug', 'feature', 'feedback', 'content', 'other'] }).notNull(),
  tags: text('tags').default('[]'),
  message: text('message').notNull(),
  targetType: text('target_type', { enum: ['general', 'quote', 'author', 'reference'] }).default('general'),
  targetId: integer('target_id'),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  status: text('status', { enum: ['new', 'triaged', 'spam', 'resolved'] }).default('new'),
  reviewedBy: integer('reviewed_by').references(() => users.id, { onDelete: 'set null' }),
  reviewedAt: integer('reviewed_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  createdIdx: index('idx_user_messages_created').on(table.createdAt),
  categoryIdx: index('idx_user_messages_category').on(table.category),
  statusIdx: index('idx_user_messages_status').on(table.status),
  targetIdx: index('idx_user_messages_target').on(table.targetType, table.targetId),
  userIdx: index('idx_user_messages_user').on(table.userId),
  ipIdx: index('idx_user_messages_ip').on(table.ipAddress),
}))

export const quoteViews = sqliteTable('quote_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  quoteId: integer('quote_id').notNull().references(() => quotes.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  viewedAt: integer('viewed_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  quoteIdx: index('idx_quote_views_quote').on(table.quoteId),
  userIdx: index('idx_quote_views_user').on(table.userId),
  dateIdx: index('idx_quote_views_date').on(table.viewedAt),
}))

export const authorViews = sqliteTable('author_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  authorId: integer('author_id').notNull().references(() => authors.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  viewedAt: integer('viewed_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  authorIdx: index('idx_author_views_author').on(table.authorId),
  userIdx: index('idx_author_views_user').on(table.userId),
  dateIdx: index('idx_author_views_date').on(table.viewedAt),
}))

export const referenceViews = sqliteTable('reference_views', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  referenceId: integer('reference_id').notNull().references(() => quoteReferences.id, { onDelete: 'cascade' }),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  ipAddress: text('ip_address'),
  userAgent: text('user_agent'),
  viewedAt: integer('viewed_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  referenceIdx: index('idx_reference_views_reference').on(table.referenceId),
  userIdx: index('idx_reference_views_user').on(table.userId),
  dateIdx: index('idx_reference_views_date').on(table.viewedAt),
}))

export const exportLogs = sqliteTable('export_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  exportId: text('export_id').notNull().unique(),
  filename: text('filename').notNull(),
  format: text('format').notNull(),
  dataType: text('data_type', { enum: ['all', 'authors', 'quotes', 'references', 'tags', 'users'] }).notNull(),
  filtersApplied: text('filters_applied'),
  recordCount: integer('record_count'),
  fileSize: integer('file_size'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  includeRelations: integer('include_relations', { mode: 'boolean' }).default(false),
  includeMetadata: integer('include_metadata', { mode: 'boolean' }).default(false),
  downloadCount: integer('download_count').default(0),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  expiresAt: integer('expires_at', { mode: 'timestamp' }).default(sql`(datetime('now', '+24 hours'))`),
}, (table) => ({
  exportIdx: index('idx_export_logs_export_id').on(table.exportId),
  userIdx: index('idx_export_logs_user').on(table.userId),
  dataTypeIdx: index('idx_export_logs_data_type').on(table.dataType),
  createdIdx: index('idx_export_logs_created').on(table.createdAt),
  expiresIdx: index('idx_export_logs_expires').on(table.expiresAt),
}))

export const importLogs = sqliteTable('import_logs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  importId: text('import_id').notNull().unique(),
  filename: text('filename'),
  format: text('format').notNull(),
  dataType: text('data_type', { enum: ['all', 'authors', 'quotes', 'references', 'tags', 'users'] }).notNull(),
  recordCount: integer('record_count'),
  successfulCount: integer('successful_count'),
  failedCount: integer('failed_count'),
  warningsCount: integer('warnings_count'),
  userId: integer('user_id').references(() => users.id, { onDelete: 'set null' }),
  options: text('options'),
  status: text('status', { enum: ['pending', 'processing', 'completed', 'failed'] }).notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  completedAt: integer('completed_at', { mode: 'timestamp' }),
}, (table) => ({
  importIdx: index('idx_import_logs_import_id').on(table.importId),
  statusIdx: index('idx_import_logs_status').on(table.status),
  createdIdx: index('idx_import_logs_created').on(table.createdAt),
}))

export const backupFiles = sqliteTable('backup_files', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fileKey: text('file_key').notNull().unique(),
  exportLogId: integer('export_log_id').references(() => exportLogs.id, { onDelete: 'cascade' }),
  importLogId: integer('import_log_id').references(() => importLogs.id, { onDelete: 'cascade' }),
  filename: text('filename').notNull(),
  filePath: text('file_path').notNull(),
  fileSize: integer('file_size'),
  compressedSize: integer('compressed_size'),
  contentHash: text('content_hash'),
  compressionType: text('compression_type').default('none'),
  storageStatus: text('storage_status', { enum: ['uploading', 'stored', 'failed', 'expired'] }).default('uploading'),
  retentionDays: integer('retention_days').default(90),
  createdAt: integer('created_at', { mode: 'timestamp' }).default(sql`CURRENT_TIMESTAMP`),
  uploadedAt: integer('uploaded_at', { mode: 'timestamp' }),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  lastAccessedAt: integer('last_accessed_at', { mode: 'timestamp' }),
  accessCount: integer('access_count').default(0),
  metadata: text('metadata'),
}, (table) => ({
  importLogIdx: index('idx_backup_files_import_log').on(table.importLogId),
  fileKeyIdx: index('idx_backup_files_file_key').on(table.fileKey),
  exportLogIdx: index('idx_backup_files_export_log').on(table.exportLogId),
  statusIdx: index('idx_backup_files_status').on(table.storageStatus),
  createdIdx: index('idx_backup_files_created').on(table.createdAt),
  expiresIdx: index('idx_backup_files_expires').on(table.expiresAt),
  pathIdx: index('idx_backup_files_path').on(table.filePath),
}))
