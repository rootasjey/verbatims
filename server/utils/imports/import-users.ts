import type { ImportOptions } from '~/types'
import { getAdminImport, updateAdminImport } from '~/server/utils/admin-import-progress'
import { uploadBackupFile } from '~/server/utils/backup-storage'
import { createBackupFile } from '~/server/utils/backup-database'
import { validateUserDataZod } from '~/server/utils/validation/user'

export async function importUsersInline(parentImportId: string, users: any[], options: ImportOptions) {
  const db = hubDatabase()
  if (!db) throw new Error('Database not available')

  const validation = validateUserDataZod(users)
  if (!validation.isValid && !options.ignoreValidationErrors) {
    throw new Error(`Users validation failed: ${validation.errors.length} errors`)
  }
  if (validation.warnings.length) {
    const p = getAdminImport(parentImportId)!
    updateAdminImport(parentImportId, { warnings: [...p.warnings, ...validation.warnings] })
  }

  // Optional centralized backup via backup_files + R2
  if (options.createBackup !== false) {
    try {
      const json = JSON.stringify({ data: users })
      const up = await uploadBackupFile(json, `import_${parentImportId}_users.json`, 'users', 'json')

      let importLogId: number | undefined = undefined
      try {
        const row = await db.prepare('SELECT id FROM import_logs WHERE import_id = ? LIMIT 1').bind(parentImportId).first()
        importLogId = Number(row?.id) ?? undefined
      } catch {}

      await createBackupFile(db, {
        file_key: up.fileKey,
        export_log_id: undefined,
        import_log_id: importLogId,
        filename: `import_${parentImportId}_users.json`,
        file_path: up.filePath,
        file_size: up.fileSize,
        compressed_size: up.compressedSize,
        content_hash: up.contentHash,
        compression_type: up.compressionType,
        retention_days: options.retentionDays || 90,
        metadata: JSON.stringify({ kind: 'import', import_id: parentImportId, data_type: 'users', format: 'json' })
      })

      const p2 = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p2.warnings, `Backup stored for users (${up.filePath})`] })
    } catch (e: any) {
      const p = getAdminImport(parentImportId)!
      updateAdminImport(parentImportId, { warnings: [...p.warnings, `Backup skipped (users): ${e.message}`] })
    }
  }

  const userPolicy = options.conflict?.users?.mode || 'upsert'
  const userStrategy = options.conflict?.users?.updateStrategy || 'fill-missing'

  let insertSql = `INSERT INTO users (
      email, name, password, avatar_url, role, is_active, email_verified,
      biography, job, language, location, socials, last_login_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`

  if (userPolicy === 'ignore') {
    insertSql = `INSERT OR IGNORE INTO users (
      email, name, password, avatar_url, role, is_active, email_verified,
      biography, job, language, location, socials, last_login_at, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  } else if (userPolicy === 'upsert') {
    if (userStrategy === 'overwrite') {
      // DO NOT overwrite password or role by default
      insertSql = `INSERT INTO users (
        email, name, password, avatar_url, role, is_active, email_verified,
        biography, job, language, location, socials, last_login_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name           = excluded.name,
        avatar_url     = excluded.avatar_url,
        is_active      = excluded.is_active,
        email_verified = excluded.email_verified,
        biography      = excluded.biography,
        job            = excluded.job,
        language       = excluded.language,
        location       = excluded.location,
        socials        = excluded.socials,
        last_login_at  = COALESCE(excluded.last_login_at, users.last_login_at),
        updated_at     = CURRENT_TIMESTAMP`
    } else {
      // fill-missing / prefer-existing (keep existing when new is null/empty)
      insertSql = `INSERT INTO users (
        email, name, password, avatar_url, role, is_active, email_verified,
        biography, job, language, location, socials, last_login_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        name           = COALESCE(excluded.name, users.name),
        avatar_url     = COALESCE(excluded.avatar_url, users.avatar_url),
        is_active      = COALESCE(excluded.is_active, users.is_active),
        email_verified = COALESCE(excluded.email_verified, users.email_verified),
        biography      = COALESCE(excluded.biography, users.biography),
        job            = COALESCE(excluded.job, users.job),
        language       = COALESCE(excluded.language, users.language),
        location       = COALESCE(excluded.location, users.location),
        socials        = COALESCE(excluded.socials, users.socials),
        last_login_at  = COALESCE(excluded.last_login_at, users.last_login_at),
        updated_at     = CURRENT_TIMESTAMP`
    }
  }

  const insert = db.prepare(insertSql)
  // Optional variant to include id explicitly when preserveIds and not using upsert
  const insertWithId = db.prepare(`INSERT INTO users (
    id, email, name, password, avatar_url, role, is_active, email_verified,
    biography, job, language, location, socials, last_login_at, created_at, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)

  const batchSize = options.batchSize || 50
  const subSize = 10

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)
      const stmts = sub.map((u) => {
        const socialsField = u.socials ? (typeof u.socials === 'string' ? u.socials : JSON.stringify(u.socials)) : '[]'
        const hasExplicit = options.preserveIds && Number.isFinite(Number(u.id))
        if (hasExplicit && userPolicy !== 'upsert') {
          return insertWithId.bind(
            Number(u.id),
            u.email,
            u.name || 'User',
            u.password || '',
            u.avatar_url || null,
            u.role || 'user',
            u.is_active ?? true,
            u.email_verified ?? false,
            u.biography || null,
            u.job || null,
            u.language || 'en',
            u.location || 'On Earth',
            socialsField,
            u.last_login_at || null,
            u.created_at || new Date().toISOString(),
            u.updated_at || new Date().toISOString(),
          )
        }
        return insert.bind(
          u.email,
          u.name || 'User',
          u.password || '',
          u.avatar_url || null,
          u.role || 'user',
          u.is_active ?? true,
          u.email_verified ?? false,
          u.biography || null,
          u.job || null,
          u.language || 'en',
          u.location || 'On Earth',
          socialsField,
          u.last_login_at || null,
          u.created_at || new Date().toISOString(),
          u.updated_at || new Date().toISOString(),
        )
      })

      try {
        await db.batch(stmts)
        const p = getAdminImport(parentImportId)!
        updateAdminImport(parentImportId, {
          successfulRecords: p.successfulRecords + sub.length,
          processedRecords: Math.min((p.processedRecords + sub.length), p.totalRecords)
        })
      } catch (e: any) {
        for (let idx = 0; idx < stmts.length; idx++) {
          try {
            await stmts[idx].run()
            const p = getAdminImport(parentImportId)!
            updateAdminImport(parentImportId, {
              successfulRecords: p.successfulRecords + 1,
              processedRecords: Math.min((p.processedRecords + 1), p.totalRecords)
            })
          } catch (ie: any) {
            const p = getAdminImport(parentImportId)!
            updateAdminImport(parentImportId, {
              failedRecords: p.failedRecords + 1,
              processedRecords: Math.min((p.processedRecords + 1), p.totalRecords),
              errors: [...p.errors, `Failed to import user "${sub[idx]?.email || sub[idx]?.name}": ${ie.message}`]
            })
          }
        }
      }

      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  // Align sqlite_sequence if IDs preserved
  if (options.preserveIds) {
    try {
      const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM users').first()
      const maxId = Number(row?.mx || 0)
      if (maxId > 0) {
        const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'users'`).bind(maxId).run()
        const changes = Number(upd?.meta?.changes || 0)
        if (changes === 0) {
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('users', ?)`).bind(maxId).run() }
          catch {
            try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'users'`).run() } catch {}
            try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('users', ?)`).bind(maxId).run() } catch {}
          }
        }
      }
    } catch {}
  }
}

// High-level processing + parsers moved from API route
export async function processImportUsers(
  importId: string,
  rawData: any,
  format: 'json' | 'csv' | 'xml',
  options: ImportOptions,
  _userId: number,
) {
  updateAdminImport(importId, { status: 'processing' })

  try {
    // Parse data
    let users: any[] = []
    if (Array.isArray(rawData)) {
      users = rawData
    } else if (format === 'json') {
      users = Array.isArray(rawData) ? rawData : [rawData]
    } else if (format === 'csv') {
      users = await parseUsersCsv(rawData)
    } else if (format === 'xml') {
      users = minimalXmlParse(String(rawData || ''), 'user')
    } else {
      throw new Error(`Unsupported format: ${format}`)
    }

    updateAdminImport(importId, { totalRecords: users.length })

    const db = hubDatabase()
    if (!db) throw new Error('Database not available')

    await importUsersInline(importId, users, options)

    // Persist completion
    try {
      const db2 = hubDatabase()
      const pp = getAdminImport(importId)!
      await db2.prepare(`UPDATE import_logs SET status=?, record_count=?, successful_count=?, failed_count=?, warnings_count=?, completed_at=CURRENT_TIMESTAMP WHERE import_id=?`)
        .bind('completed', pp.totalRecords, pp.successfulRecords, pp.failedRecords, pp.warnings.length, importId).run()
      updateAdminImport(importId, { status: 'completed', completedAt: new Date() as any })
    } catch {}

  } catch (e: any) {
    const p = getAdminImport(importId)!
    updateAdminImport(importId, { status: 'failed', completedAt: new Date() as any, errors: [...p.errors, e.message] })
    throw e
  }
}

export async function parseUsersCsv(csvData: string): Promise<any[]> {
  const lines = String(csvData || '').trim().split('\n')
  if (lines.length < 2) return []
  const headers = parseCSVLine(lines[0] ?? '')
  return lines.slice(1).map(line => {
    const values = parseCSVLine(line)
    const obj: any = {}
    headers.forEach((h, idx) => {
      const v = values[idx] ?? null
      if (['is_active','email_verified'].includes(h)) obj[h] = String(v).toLowerCase() === 'true'
      else obj[h] = v
    })
    return obj
  })
}

function parseCSVLine(line: string): string[] {
  const out: string[] = []
  let cur = ''
  let quoted = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (quoted && line[i+1] === '"') { cur += '"'; i++ } else { quoted = !quoted }
    } else if (ch === ',' && !quoted) { out.push(cur.trim()); cur = '' } else { cur += ch }
  }
  out.push(cur.trim())
  return out
}

function minimalXmlParse(xml: string, itemTag: string): any[] {
  const items: any[] = []
  const itemRegex = new RegExp(`<${itemTag}>([\\s\\S]*?)<\/${itemTag}>`, 'g')
  const fieldRegex = new RegExp('<([a-zA-Z0-9_]+)>([\\s\\S]*?)<\\/([a-zA-Z0-9_]+)>', 'g')
  let m: RegExpExecArray | null
  while ((m = itemRegex.exec(xml))) {
    const obj: any = {}
    let fm: RegExpExecArray | null
    while ((fm = fieldRegex.exec(m[1]))) {
      if (fm[1] !== fm[3]) continue
      obj[fm[1]] = fm[2]
        .replace(/&lt;/g,'<')
        .replace(/&gt;/g,'>')
        .replace(/&amp;/g,'&')
        .replace(/&quot;/g,'"')
        .replace(/&apos;/g,"'")
    }
    items.push(obj)
  }
  return items
}
