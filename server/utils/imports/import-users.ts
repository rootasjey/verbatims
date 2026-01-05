import { db, schema } from 'hub:db'
import { eq, sql } from 'drizzle-orm'
import type { ImportOptions } from '~~/server/types'

export async function importUsersInline(parentImportId: string, users: any[], options: ImportOptions) {
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
        const row = await db.select({ id: schema.importLogs.id })
          .from(schema.importLogs)
          .where(eq(schema.importLogs.importId, parentImportId))
          .limit(1)
          .get()
        importLogId = row?.id
      } catch {}

      await createBackupFile({
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

  const batchSize = options.batchSize || 50
  const subSize = 10

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)
      const stmts: any[] = []

      for (const u of sub) {
        const socialsField = u.socials ? (typeof u.socials === 'string' ? u.socials : JSON.stringify(u.socials)) : '[]'
        const explicitId = options.preserveIds && Number.isFinite(Number(u.id)) ? Number(u.id) : undefined
        
        const values = {
            id: explicitId,
            email: u.email,
            name: u.name || 'User',
            password: u.password || '',
            avatarUrl: u.avatar_url || null,
            role: u.role || 'user',
            isActive: u.is_active ?? true,
            emailVerified: u.email_verified ?? false,
            biography: u.biography || null,
            job: u.job || null,
            language: u.language || 'en',
            location: u.location || 'On Earth',
            socials: socialsField,
            lastLoginAt: u.last_login_at ? new Date(u.last_login_at) : null,
            createdAt: u.created_at ? new Date(u.created_at) : new Date(),
            updatedAt: u.updated_at ? new Date(u.updated_at) : new Date(),
        }

        if (userPolicy === 'ignore') {
            stmts.push(db.insert(schema.users).values(values).onConflictDoNothing({ target: schema.users.email }))
        } else if (userPolicy === 'upsert') {
            const updateData: any = {}
            
            if (userStrategy === 'overwrite') {
                updateData.name = sql`excluded.name`
                updateData.avatarUrl = sql`excluded.avatar_url`
                updateData.isActive = sql`excluded.is_active`
                updateData.emailVerified = sql`excluded.email_verified`
                updateData.biography = sql`excluded.biography`
                updateData.job = sql`excluded.job`
                updateData.language = sql`excluded.language`
                updateData.location = sql`excluded.location`
                updateData.socials = sql`excluded.socials`
                updateData.lastLoginAt = sql`COALESCE(excluded.last_login_at, users.last_login_at)`
                updateData.updatedAt = new Date()
            } else {
                // fill-missing
                updateData.name = sql`COALESCE(excluded.name, users.name)`
                updateData.avatarUrl = sql`COALESCE(excluded.avatar_url, users.avatar_url)`
                updateData.isActive = sql`COALESCE(excluded.is_active, users.is_active)`
                updateData.emailVerified = sql`COALESCE(excluded.email_verified, users.email_verified)`
                updateData.biography = sql`COALESCE(excluded.biography, users.biography)`
                updateData.job = sql`COALESCE(excluded.job, users.job)`
                updateData.language = sql`COALESCE(excluded.language, users.language)`
                updateData.location = sql`COALESCE(excluded.location, users.location)`
                updateData.socials = sql`COALESCE(excluded.socials, users.socials)`
                updateData.lastLoginAt = sql`COALESCE(excluded.last_login_at, users.last_login_at)`
                updateData.updatedAt = new Date()
            }
            
            stmts.push(db.insert(schema.users).values(values).onConflictDoUpdate({
                target: schema.users.email,
                set: updateData
            }))
        } else {
            // Insert (default) - might fail if exists
            stmts.push(db.insert(schema.users).values(values))
        }
      }

      try {
        if (stmts.length > 0) {
            await db.batch(stmts as any)
            const p = getAdminImport(parentImportId)!
            updateAdminImport(parentImportId, {
            successfulRecords: p.successfulRecords + stmts.length,
            processedRecords: Math.min((p.processedRecords + stmts.length), p.totalRecords)
            })
        }
      } catch (e: any) {
        for (let idx = 0; idx < stmts.length; idx++) {
          try {
            const s = stmts[idx]
            if (!s) continue
            await s
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
      const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.users).get()
      const maxId = Number(row?.mx || 0)
      if (maxId > 0) {
        const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'users'`)
        const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
        if (changes === 0) {
          try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('users', ${maxId})`) }
          catch {
            try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'users'`) } catch {}
            try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('users', ${maxId})`) } catch {}
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

    await importUsersInline(importId, users, options)

    // Persist completion
    try {
      const pp = getAdminImport(importId)!
      await db.update(schema.importLogs)
        .set({
            status: 'completed',
            recordCount: pp.totalRecords,
            successfulCount: pp.successfulRecords,
            failedCount: pp.failedRecords,
            warningsCount: pp.warnings.length,
            completedAt: new Date()
        })
        .where(eq(schema.importLogs.importId, importId))
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
    if (!m) continue
    const obj: any = {}
    let fm: RegExpExecArray | null
    const xmlBlock = String(m[1] ?? '')
    while ((fm = fieldRegex.exec(xmlBlock))) {
      if (!fm) continue
      const key = String(fm[1] ?? '')
      const val = String(fm[2] ?? '')
      if (key !== String(fm[3] ?? '')) continue
      obj[key] = val.replace(/&lt;/g,'<').replace(/&gt;/g,'>').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&apos;/g,"'")
    }
    items.push(obj)
  }
  return items
}
