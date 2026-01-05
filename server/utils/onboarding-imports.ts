// Utilities extracted from the onboarding database import API.
// These functions operate against a D1-style `db` prepared statement API and
// report progress/warnings via the onboarding-progress utils.

import { updateStepProgress, addWarning } from './onboarding-progress'
import { schema } from 'hub:db'
import { sql } from 'drizzle-orm'

export async function extractDatasetsFromZip(zipBytes: Uint8Array): Promise<Record<string, any[]>> {
  const { unzipSync } = await import('fflate')
  const result: Record<string, any[]> = {}
  try {
    const files = unzipSync(zipBytes)
    const dec = new TextDecoder()
    const read = (name: string): any[] | null => {
      const entry = Object.keys(files).find(k => k.toLowerCase() === name)
      if (!entry) return null
      try {
        const text = dec.decode(files[entry])
        const parsed = JSON.parse(text)
        return Array.isArray(parsed) ? parsed : null
      } catch { return null }
    }

    const candidates = [
      'users.json',
      'authors.json',
      'references.json',
      'tags.json',
      'quotes.json',
      'quote_tags.json',
      'user_collections.json',
      'collection_quotes.json',
      'user_likes.json',
      'user_sessions.json',
      'user_messages.json',
      'quote_reports.json',
      'quote_views.json',
      'author_views.json',
      'reference_views.json'
    ]
    for (const c of candidates) {
      const data = read(c)
      if (data) {
        result[c.replace('.json','')] = data
      }
    }
  } catch (e) {
    console.error('Failed to unzip provided archive', e)
  }
  return result
}

export async function importUserCollectionsFromDataset(db: any, importId: string, cols: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${cols.length} user collections...` })

  const batchSize = 50
  const subSize = 10

  for (let i = 0; i < cols.length; i += batchSize) {
    const batch = cols.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)
      const stmts: any[] = []

      for (const c of sub) {
        const values: any = {
          userId: c.user_id,
          name: c.name || 'My Collection',
          description: c.description || null,
          isPublic: !!c.is_public,
          createdAt: c.created_at ? new Date(c.created_at) : new Date(),
          updatedAt: c.updated_at ? new Date(c.updated_at) : new Date()
        }
        const explicitId = Number.isFinite(Number(c?.id)) ? Number(c.id) : undefined
        if (explicitId != null) values.id = explicitId

        stmts.push(db.insert(schema.userCollections).values(values).onConflictDoNothing({ target: schema.userCollections.id }))
      }

      try {
        if (stmts.length > 0) {
          await db.batch(stmts as any)
          imported += sub.length
        }
      } catch (e) {
        for (let idx = 0; idx < stmts.length; idx++) {
          try { await stmts[idx]; imported++ } catch {}
        }
      }

      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  // Align sqlite_sequence for user_collections
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.userCollections).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'user_collections'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_collections', ${maxId})`) }
        catch {
          try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'user_collections'`) } catch {}
          try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_collections', ${maxId})`) } catch {}
        }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user collections` })
  return imported
} 

export async function importCollectionQuotesFromDataset(db: any, importId: string, rows: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Linking ${rows.length} collection-quote relations...` })

  const batchSize = 100
  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const r of batch) {
      const values = {
        collectionId: r.collection_id,
        quoteId: r.quote_id,
        addedAt: r.added_at ? new Date(r.added_at) : new Date()
      }
      stmts.push(db.insert(schema.collectionQuotes).values(values).onConflictDoNothing())
    }
    try {
      if (stmts.length > 0) {
        await db.batch(stmts as any)
        imported += stmts.length
      }
    } catch (e) {
      for (const s of stmts) { try { await s } catch {} }
    }
  }

  updateStepProgress(importId, 'quotes', { message: `Linked ${imported} collection-quote relations` })
  return imported
} 

export async function importUserLikesFromDataset(db: any, importId: string, likes: any[]): Promise<number> {
  let imported = 0
  const allowed = new Set(['quote','author','reference'])
  updateStepProgress(importId, 'quotes', { message: `Importing ${likes.length} user likes...` })

  const batchSize = 100
  for (let i = 0; i < likes.length; i += batchSize) {
    const batch = likes.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const l of batch) {
      if (!allowed.has((l.likeable_type || '').toString())) continue
      const explicitId = Number.isFinite(Number(l?.id)) ? Number(l.id) : undefined
      const values: any = {
        userId: l.user_id,
        likeableType: l.likeable_type,
        likeableId: l.likeable_id,
        createdAt: l.created_at ? new Date(l.created_at) : new Date()
      }
      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.userLikes).values(values).onConflictDoNothing({ target: schema.userLikes.id }))
    }

    try {
      if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length }
    } catch (e) {
      for (const s of stmts) { try { await s; imported++ } catch {} }
    }
  }

  // Align sqlite_sequence for user_likes
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.userLikes).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'user_likes'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_likes', ${maxId})`) }
        catch {
          try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'user_likes'`) } catch {}
          try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_likes', ${maxId})`) } catch {}
        }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user likes` })
  return imported
} 

export async function importUserSessionsFromDataset(db: any, importId: string, sessions: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${sessions.length} user sessions...` })

  const batchSize = 100
  for (let i = 0; i < sessions.length; i += batchSize) {
    const batch = sessions.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const s of batch) {
      const explicitId = Number.isFinite(Number(s?.id)) ? Number(s.id) : undefined
      const values: any = {
        userId: s.user_id,
        sessionToken: s.session_token,
        expiresAt: s.expires_at ? new Date(s.expires_at) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
        createdAt: s.created_at ? new Date(s.created_at) : new Date()
      }
      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.userSessions).values(values).onConflictDoNothing({ target: schema.userSessions.id }))
    }

    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
  }

  // Align sqlite_sequence for user_sessions
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.userSessions).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'user_sessions'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_sessions', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'user_sessions'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_sessions', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user sessions` })
  return imported
} 

export async function importUserMessagesFromDataset(db: any, importId: string, msgs: any[]): Promise<number> {
  let imported = 0
  const allowedCat = new Set(['bug','feature','feedback','content','other'])
  const allowedTarget = new Set(['general','quote','author','reference'])
  const allowedStatus = new Set(['new','triaged','spam','resolved'])
  updateStepProgress(importId, 'quotes', { message: `Importing ${msgs.length} user messages...` })

  const batchSize = 50
  for (let i = 0; i < msgs.length; i += batchSize) {
    const batch = msgs.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const m of batch) {
      const category = allowedCat.has(m.category) ? m.category : 'other'
      const target_type = allowedTarget.has(m.target_type) ? m.target_type : 'general'
      const status = allowedStatus.has(m.status) ? m.status : 'new'
      const tagsJson = JSON.stringify(m.tags || [])
      const created = m.created_at ? new Date(m.created_at) : new Date()
      const explicitId = Number.isFinite(Number(m?.id)) ? Number(m.id) : undefined

      const values: any = {
        userId: m.user_id || null,
        name: m.name || null,
        email: m.email || null,
        category,
        tags: tagsJson,
        message: m.message || '',
        targetType: target_type,
        targetId: m.target_id || null,
        ipAddress: m.ip_address || null,
        userAgent: m.user_agent || null,
        status,
        reviewedBy: m.reviewed_by || null,
        reviewedAt: m.reviewed_at ? new Date(m.reviewed_at) : null,
        createdAt: created
      }

      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.userMessages).values(values).onConflictDoNothing({ target: schema.userMessages.id }))
    }

    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
  }

  // Align sqlite_sequence for user_messages
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.userMessages).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'user_messages'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_messages', ${maxId})`) }
        catch {
          try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'user_messages'`) } catch {}
          try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('user_messages', ${maxId})`) } catch {}
        }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} user messages` })
  return imported
} 

export async function importQuoteReportsFromDataset(db: any, importId: string, reports: any[]): Promise<number> {
  let imported = 0
  const allowedReason = new Set(['spam','inappropriate','copyright','misinformation','other'])
  const allowedStatus = new Set(['pending','reviewed','resolved'])
  updateStepProgress(importId, 'quotes', { message: `Importing ${reports.length} quote reports...` })

  const batchSize = 100
  for (let i = 0; i < reports.length; i += batchSize) {
    const batch = reports.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const r of batch) {
      const reason = allowedReason.has(r.reason) ? r.reason : 'other'
      const status = allowedStatus.has(r.status) ? r.status : 'pending'
      const created = r.created_at ? new Date(r.created_at) : new Date()
      const explicitId = Number.isFinite(Number(r?.id)) ? Number(r.id) : undefined

      const values: any = {
        quoteId: r.quote_id,
        reporterId: r.reporter_id,
        reason,
        description: r.description || null,
        status,
        reviewedBy: r.reviewed_by || null,
        reviewedAt: r.reviewed_at ? new Date(r.reviewed_at) : null,
        createdAt: created
      }
      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.quoteReports).values(values).onConflictDoNothing({ target: schema.quoteReports.id }))
    }

    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
  }

  // Align sqlite_sequence for quote_reports
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.quoteReports).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'quote_reports'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_reports', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'quote_reports'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_reports', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} quote reports` })
  return imported
} 

export async function importQuoteViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} quote views...` })

  const batchSize = 200
  for (let i = 0; i < views.length; i += batchSize) {
    const batch = views.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const v of batch) {
      const explicitId = Number.isFinite(Number(v?.id)) ? Number(v.id) : undefined
      const values: any = {
        quoteId: v.quote_id,
        userId: v.user_id || null,
        ipAddress: v.ip_address || null,
        userAgent: v.user_agent || null,
        viewedAt: v.viewed_at ? new Date(v.viewed_at) : new Date()
      }
      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.quoteViews).values(values).onConflictDoNothing({ target: schema.quoteViews.id }))
    }

    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
  }

  // Align sqlite_sequence for quote_views
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.quoteViews).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'quote_views'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_views', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'quote_views'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_views', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} quote views` })
  return imported
} 

export async function importAuthorViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} author views...` })

  const batchSize = 200
  for (let i = 0; i < views.length; i += batchSize) {
    const batch = views.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const v of batch) {
      const explicitId = Number.isFinite(Number(v?.id)) ? Number(v.id) : undefined
      const values: any = {
        authorId: v.author_id,
        userId: v.user_id || null,
        ipAddress: v.ip_address || null,
        userAgent: v.user_agent || null,
        viewedAt: v.viewed_at ? new Date(v.viewed_at) : new Date()
      }
      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.authorViews).values(values).onConflictDoNothing({ target: schema.authorViews.id }))
    }
    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
  }

  // Align sqlite_sequence for author_views
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.authorViews).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'author_views'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('author_views', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'author_views'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('author_views', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} author views` })
  return imported
} 

export async function importReferenceViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} reference views...` })

  const batchSize = 200
  for (let i = 0; i < views.length; i += batchSize) {
    const batch = views.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const v of batch) {
      const explicitId = Number.isFinite(Number(v?.id)) ? Number(v.id) : undefined
      const values: any = {
        referenceId: v.reference_id,
        userId: v.user_id || null,
        ipAddress: v.ip_address || null,
        userAgent: v.user_agent || null,
        viewedAt: v.viewed_at ? new Date(v.viewed_at) : new Date()
      }
      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.referenceViews).values(values).onConflictDoNothing({ target: schema.referenceViews.id }))
    }
    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
  }

  // Align sqlite_sequence for reference_views
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.referenceViews).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'reference_views'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('reference_views', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'reference_views'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('reference_views', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} reference views` })
  return imported
} 

export async function importUsersFromDataset(db: any, importId: string, users: any[]): Promise<number> {
  const total = users.length
  let imported = 0
  updateStepProgress(importId, 'users', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} users...` })

  const batchSize = 50
  const subSize = 10

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)
      const stmts: any[] = []

      for (const u of sub) {
        const socials = u.socials ? (typeof u.socials === 'string' ? u.socials : JSON.stringify(u.socials)) : '[]'
        const explicitId = Number.isFinite(Number(u?.id)) ? Number(u.id) : undefined

        const values: any = {
          email: u.email || '',
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
          socials: socials,
          createdAt: u.created_at ? new Date(u.created_at) : new Date(),
          updatedAt: u.updated_at ? new Date(u.updated_at) : new Date()
        }

        if (explicitId != null) values.id = explicitId

        // Use onConflictDoNothing to mimic previous behavior (ignore duplicates)
        stmts.push(db.insert(schema.users).values(values).onConflictDoNothing({ target: schema.users.email }))
      }

      try {
        if (stmts.length > 0) {
          await db.batch(stmts as any)
          imported += sub.length
        }
      } catch (e) {
        // On failure, attempt single execution to get per-row resilience
        for (let idx = 0; idx < stmts.length; idx++) {
          try {
            await stmts[idx]
            imported++
          } catch {}
        }
      }

      if (imported % 10 === 0) updateStepProgress(importId, 'users', { current: Math.min(i + j + sub.length, total), imported, message: `Imported ${imported}/${total} users` })
      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  // Align sqlite_sequence to MAX(id)
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

  updateStepProgress(importId, 'users', { status: 'completed', current: total, imported, message: `Imported ${imported} users` })
  return imported
}

export async function importAuthorsFromDataset(db: any, importId: string, authors: any[]): Promise<number> {
  const total = authors.length
  let imported = 0
  updateStepProgress(importId, 'authors', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} authors...` })

  const batchSize = 50
  const subSize = 10

  for (let i = 0; i < authors.length; i += batchSize) {
    const batch = authors.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)
      const stmts: any[] = []
      for (const a of sub) {
        const explicitId = Number.isFinite(Number(a?.id)) ? Number(a.id) : undefined
        const values: any = {
          name: a.name || '',
          description: a.description || '',
          birthDate: a.birth_date || null,
          deathDate: a.death_date || null,
          birthLocation: a.birth_location || '',
          job: a.job || '',
          imageUrl: a.image_url || '',
          isFictional: !!a.is_fictional,
          viewsCount: a.views_count || 0,
          likesCount: a.likes_count || 0,
          sharesCount: a.shares_count || 0,
          createdAt: a.created_at ? new Date(a.created_at) : new Date(),
          updatedAt: a.updated_at ? new Date(a.updated_at) : new Date()
        }
        if (explicitId != null) values.id = explicitId
        stmts.push(db.insert(schema.authors).values(values).onConflictDoNothing({ target: schema.authors.id }))
      }
      try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
      catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.authors).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'authors'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'authors'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'authors', { status: 'completed', current: total, imported, message: `Imported ${imported} authors` })
  return imported
} 

export async function importReferencesFromDataset(db: any, importId: string, refs: any[]): Promise<number> {
  const total = refs.length
  let imported = 0
  updateStepProgress(importId, 'references', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} references...` })

  const batchSize = 50
  const subSize = 10

  for (let i = 0; i < refs.length; i += batchSize) {
    const batch = refs.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)
      const stmts: any[] = []
      for (const r of sub) {
        const explicitId = Number.isFinite(Number(r?.id)) ? Number(r.id) : undefined
        const urls = JSON.stringify(r.urls || [])
        const values: any = {
          name: r.name || '',
          originalLanguage: r.original_language || 'en',
          releaseDate: r.release_date || null,
          description: r.description || '',
          primaryType: r.primary_type || 'other',
          secondaryType: r.secondary_type || '',
          imageUrl: r.image_url || '',
          urls: urls,
          viewsCount: r.views_count || 0,
          likesCount: r.likes_count || 0,
          sharesCount: r.shares_count || 0,
          createdAt: r.created_at ? new Date(r.created_at) : new Date(),
          updatedAt: r.updated_at ? new Date(r.updated_at) : new Date()
        }
        if (explicitId != null) values.id = explicitId
        stmts.push(db.insert(schema.quoteReferences).values(values).onConflictDoNothing({ target: schema.quoteReferences.id }))
      }
      try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
      catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  // Align sqlite_sequence for quote_references
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.quoteReferences).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'quote_references'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_references', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'quote_references'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_references', ${maxId})`) } catch {} }
      }
    }
  } catch {}
  updateStepProgress(importId, 'references', { status: 'completed', current: total, imported, message: `Imported ${imported} references` })
  return imported
} 

export async function importTagsFromDataset(db: any, importId: string, tags: any[]): Promise<number> {
  const total = tags.length
  let imported = 0
  updateStepProgress(importId, 'tags', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} tags...` })

  const batchSize = 200
  for (let i = 0; i < tags.length; i += batchSize) {
    const batch = tags.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const t of batch) {
      const explicitId = Number.isFinite(Number(t?.id)) ? Number(t.id) : undefined
      const values: any = {
        name: t.name || '',
        description: t.description || null,
        category: t.category || null,
        color: t.color || '#3B82F6',
        createdAt: t.created_at ? new Date(t.created_at) : new Date(),
        updatedAt: t.updated_at ? new Date(t.updated_at) : new Date()
      }
      if (explicitId != null) values.id = explicitId
      stmts.push(db.insert(schema.tags).values(values).onConflictDoNothing({ target: schema.tags.id }))
    }
    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
    if (imported % 25 === 0) updateStepProgress(importId, 'tags', { current: Math.min(i + imported, total), imported, message: `Imported ${imported}/${total} tags` })
  }

  // Align sqlite_sequence for tags
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.tags).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'tags'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('tags', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'tags'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('tags', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'tags', { status: 'completed', current: total, imported, message: `Imported ${imported} tags` })
  return imported
} 

export async function importQuotesFromDataset(db: any, adminUserId: number, importId: string, quotes: any[]): Promise<number> {
  const total = quotes.length
  let imported = 0
  let skipped = 0
  updateStepProgress(importId, 'quotes', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} quotes...` })

  const batchSize = 50
  const subSize = 10

  const allowedStatuses = new Set(['draft','pending','approved','rejected'])
  const allowedLanguages = new Set(['en','fr','es','de','it','pt','ru','ja','zh'])
  const str = (v: any) => typeof v === 'string' ? v.trim() : ''
  const toInt = (v: any) => {
    if (v === null || v === undefined || v === '') return null
    const n = Number(v)
    return Number.isFinite(n) ? Math.trunc(n) : null
  }
  const toNonNeg = (v: any) => {
    const n = toInt(v)
    return n == null ? 0 : Math.max(0, n)
  }
  const toBool = (v: any) => {
    if (typeof v === 'boolean') return v
    if (typeof v === 'number') return v === 1
    if (typeof v === 'string') {
      const s = v.trim().toLowerCase()
      if (['1','true','yes','y'].includes(s)) return true
      if (['0','false','no','n'].includes(s)) return false
    }
    return !!v
  }

  for (let i = 0; i < quotes.length; i += batchSize) {
    const batch = quotes.slice(i, i + batchSize)
    for (let j = 0; j < batch.length; j += subSize) {
      const sub = batch.slice(j, j + subSize)
      const stmts: any[] = []

      for (const q of sub) {
        try {
          const language = allowedLanguages.has(str(q.language).toLowerCase()) ? str(q.language).toLowerCase() : 'en'
          const status = allowedStatuses.has(str(q.status).toLowerCase()) ? str(q.status).toLowerCase() : 'approved'
          const authorId = toInt(q.author_id)
          const referenceId = toInt(q.reference_id)
          const userId = toInt(q.user_id) ?? (adminUserId ?? 1)
          const likes = toNonNeg(q.likes_count)
          const shares = toNonNeg(q.shares_count)
          const views = toNonNeg(q.views_count)
          const isFeatured = toBool(q.is_featured)
          const createdAt = q.created_at ? new Date(q.created_at) : new Date()
          const updatedAt = q.updated_at ? new Date(q.updated_at) : new Date()
          const moderatorId = toInt(q.moderator_id) ?? adminUserId
          const moderatedAt = q.moderated_at ? new Date(q.moderated_at) : null

          const explicitId = Number.isFinite(Number(q?.id)) ? Number(q.id) : undefined
          const values: any = {
            name: q.name || '',
            language: language,
            authorId: authorId ?? null,
            referenceId: referenceId ?? null,
            userId: userId,
            status: status,
            moderatorId: moderatorId,
            moderatedAt: moderatedAt,
            viewsCount: views,
            likesCount: likes,
            sharesCount: shares,
            isFeatured: isFeatured,
            createdAt: createdAt,
            updatedAt: updatedAt
          }
          if (explicitId != null) values.id = explicitId

          stmts.push(db.insert(schema.quotes).values(values))
        } catch (e: any) {
          skipped++
          addWarning(importId, `Quote import skipped: ${e?.message || 'unknown error'}`)
        }
      }

      try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
      catch (e: any) {
        for (let idx = 0; idx < stmts.length; idx++) {
          try { await stmts[idx]; imported++ } catch (ie: any) { skipped++; addWarning(importId, `Quote ${(i + j + (idx+1))} skipped: ${ie?.message || 'unknown error'}`) }
        }
      }

      if (imported % 25 === 0) updateStepProgress(importId, 'quotes', { current: Math.min(i + j + imported, total), imported, message: `Imported ${imported}/${total} quotes` })
      if (sub.length > 1) await new Promise(r => setTimeout(r, 10))
    }
  }

  // Align sqlite_sequence for quotes
  try {
    const row = await db.select({ mx: sql<number>`MAX(id)` }).from(schema.quotes).get()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.run(sql`UPDATE sqlite_sequence SET seq = ${maxId} WHERE name = 'quotes'`)
      const changes = Number((upd as { meta?: { changes?: number } } | undefined)?.meta?.changes ?? 0)
      if (changes === 0) {
        try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quotes', ${maxId})`) }
        catch { try { await db.run(sql`DELETE FROM sqlite_sequence WHERE name = 'quotes'`) } catch {} try { await db.run(sql`INSERT INTO sqlite_sequence(name, seq) VALUES('quotes', ${maxId})`) } catch {} }
      }
    }
  } catch {}

  updateStepProgress(importId, 'quotes', { status: 'completed', current: total, imported, message: `Imported ${imported}/${total} quotes${skipped ? ` • Skipped ${skipped}` : ''}` })
  return imported
} 

export async function importQuoteTagsFromDataset(db: any, importId: string, quoteTags: any[]): Promise<number> {
  const total = quoteTags.length
  let imported = 0
  // Reuse quotes step progress to avoid adding a separate stage
  updateStepProgress(importId, 'quotes', {
    message: `Linking ${total} quote-tag relations...`
  })

  const batchSize = 200
  for (let i = 0; i < quoteTags.length; i += batchSize) {
    const batch = quoteTags.slice(i, i + batchSize)
    const stmts: any[] = []
    for (const qt of batch) {
      if (qt && (qt.quote_id != null) && (qt.tag_id != null)) {
        stmts.push(db.insert(schema.quoteTags).values({ quoteId: qt.quote_id, tagId: qt.tag_id }).onConflictDoNothing())
      }
    }
    try { if (stmts.length > 0) { await db.batch(stmts as any); imported += stmts.length } }
    catch (e) { for (const s of stmts) { try { await s; imported++ } catch {} } }
    if (imported % 50 === 0) updateStepProgress(importId, 'quotes', { message: `Linked ${imported}/${total} quote-tag relations...` })
  }

  updateStepProgress(importId, 'quotes', {
    message: `Linked ${imported} quote-tag relations`
  })
  return imported
}
