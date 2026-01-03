// Utilities extracted from the onboarding database import API.
// These functions operate against a D1-style `db` prepared statement API and
// report progress/warnings via the onboarding-progress utils.

import { updateStepProgress, addWarning } from './onboarding-progress'

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
  const insert = db.prepare(`
        INSERT INTO user_collections (user_id, name, description, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
  const insertWithId = db.prepare(`
        INSERT INTO user_collections (id, user_id, name, description, is_public, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `)
  for (let i = 0; i < cols.length; i++) {
    const c = cols[i]
    try {
      const hasExplicitId = Number.isFinite(Number(c?.id))
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(c.id),
          c.user_id,
          c.name || 'My Collection',
          c.description || null,
          !!c.is_public,
          c.created_at || new Date().toISOString(),
          c.updated_at || new Date().toISOString()
        ).run()
      } else {
        await insert.bind(
          c.user_id,
          c.name || 'My Collection',
          c.description || null,
          !!c.is_public,
          c.created_at || new Date().toISOString(),
          c.updated_at || new Date().toISOString()
        ).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for user_collections
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM user_collections').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'user_collections'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_collections', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'user_collections'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_collections', ?)`).bind(maxId).run() } catch {}
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
  for (let i = 0; i < rows.length; i++) {
    const r = rows[i]
    try {
      await db.prepare(`
        INSERT OR IGNORE INTO collection_quotes (collection_id, quote_id, added_at)
        VALUES (?, ?, ?)
      `).bind(r.collection_id, r.quote_id, r.added_at || new Date().toISOString()).run()
      imported++
    } catch {}
  }
  updateStepProgress(importId, 'quotes', { message: `Linked ${imported} collection-quote relations` })
  return imported
}

export async function importUserLikesFromDataset(db: any, importId: string, likes: any[]): Promise<number> {
  let imported = 0
  const allowed = new Set(['quote','author','reference'])
  updateStepProgress(importId, 'quotes', { message: `Importing ${likes.length} user likes...` })
  const insert = db.prepare(`
        INSERT OR IGNORE INTO user_likes (user_id, likeable_type, likeable_id, created_at)
        VALUES (?, ?, ?, ?)
      `)
  const insertWithId = db.prepare(`
        INSERT OR IGNORE INTO user_likes (id, user_id, likeable_type, likeable_id, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
  for (let i = 0; i < likes.length; i++) {
    const l = likes[i]
    if (!allowed.has((l.likeable_type || '').toString())) continue
    try {
      const hasExplicitId = Number.isFinite(Number(l?.id))
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(l.id), l.user_id, l.likeable_type, l.likeable_id, l.created_at || new Date().toISOString()
        ).run()
      } else {
        await insert.bind(l.user_id, l.likeable_type, l.likeable_id, l.created_at || new Date().toISOString()).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for user_likes
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM user_likes').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'user_likes'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_likes', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'user_likes'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_likes', ?)`).bind(maxId).run() } catch {}
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
  const insert = db.prepare(`
        INSERT OR IGNORE INTO user_sessions (user_id, session_token, expires_at, created_at)
        VALUES (?, ?, ?, ?)
      `)
  const insertWithId = db.prepare(`
        INSERT OR IGNORE INTO user_sessions (id, user_id, session_token, expires_at, created_at)
        VALUES (?, ?, ?, ?, ?)
      `)
  for (let i = 0; i < sessions.length; i++) {
    const s = sessions[i]
    try {
      const hasExplicitId = Number.isFinite(Number(s?.id))
      const exp = s.expires_at || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      const crt = s.created_at || new Date().toISOString()
      if (hasExplicitId) {
        await insertWithId.bind(Number(s.id), s.user_id, s.session_token, exp, crt).run()
      } else {
        await insert.bind(s.user_id, s.session_token, exp, crt).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for user_sessions
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM user_sessions').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'user_sessions'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_sessions', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'user_sessions'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_sessions', ?)`).bind(maxId).run() } catch {}
        }
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
  for (let i = 0; i < msgs.length; i++) {
    const m = msgs[i]
    try {
      const category = allowedCat.has(m.category) ? m.category : 'other'
      const target_type = allowedTarget.has(m.target_type) ? m.target_type : 'general'
      const status = allowedStatus.has(m.status) ? m.status : 'new'
      const insert = db.prepare(`
        INSERT INTO user_messages (
          user_id, name, email, category, tags, message, target_type, target_id,
          ip_address, user_agent, status, reviewed_by, reviewed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const insertWithId = db.prepare(`
        INSERT INTO user_messages (
          id, user_id, name, email, category, tags, message, target_type, target_id,
          ip_address, user_agent, status, reviewed_by, reviewed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const tagsJson = JSON.stringify(m.tags || [])
      const created = m.created_at || new Date().toISOString()
      const hasExplicitId = Number.isFinite(Number(m?.id))
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(m.id),
          m.user_id || null,
          m.name || null,
          m.email || null,
          category,
          tagsJson,
          m.message || '',
          target_type,
          m.target_id || null,
          m.ip_address || null,
          m.user_agent || null,
          status,
          m.reviewed_by || null,
          m.reviewed_at || null,
          created
        ).run()
      } else {
        await insert.bind(
          m.user_id || null,
          m.name || null,
          m.email || null,
          category,
          tagsJson,
          m.message || '',
          target_type,
          m.target_id || null,
          m.ip_address || null,
          m.user_agent || null,
          status,
          m.reviewed_by || null,
          m.reviewed_at || null,
          created
        ).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for user_messages
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM user_messages').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'user_messages'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_messages', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'user_messages'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('user_messages', ?)`).bind(maxId).run() } catch {}
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
  for (let i = 0; i < reports.length; i++) {
    const r = reports[i]
    try {
      const reason = allowedReason.has(r.reason) ? r.reason : 'other'
      const status = allowedStatus.has(r.status) ? r.status : 'pending'
      const insert = db.prepare(`
        INSERT INTO quote_reports (
          quote_id, reporter_id, reason, description, status, reviewed_by, reviewed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const insertWithId = db.prepare(`
        INSERT INTO quote_reports (
          id, quote_id, reporter_id, reason, description, status, reviewed_by, reviewed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      const hasExplicitId = Number.isFinite(Number(r?.id))
      const created = r.created_at || new Date().toISOString()
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(r.id), r.quote_id, r.reporter_id, reason, r.description || null, status, r.reviewed_by || null, r.reviewed_at || null, created
        ).run()
      } else {
        await insert.bind(
          r.quote_id, r.reporter_id, reason, r.description || null, status, r.reviewed_by || null, r.reviewed_at || null, created
        ).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for quote_reports
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM quote_reports').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'quote_reports'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_reports', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'quote_reports'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_reports', ?)`).bind(maxId).run() } catch {}
        }
      }
    }
  } catch {}
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} quote reports` })
  return imported
}

export async function importQuoteViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} quote views...` })
  for (let i = 0; i < views.length; i++) {
    const v = views[i]
    try {
      const insert = db.prepare(`
        INSERT INTO quote_views (quote_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      const insertWithId = db.prepare(`
        INSERT INTO quote_views (id, quote_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      const hasExplicitId = Number.isFinite(Number(v?.id))
      const viewedAt = v.viewed_at || new Date().toISOString()
      if (hasExplicitId) {
        await insertWithId.bind(Number(v.id), v.quote_id, v.user_id || null, v.ip_address || null, v.user_agent || null, viewedAt).run()
      } else {
        await insert.bind(v.quote_id, v.user_id || null, v.ip_address || null, v.user_agent || null, viewedAt).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for quote_views
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM quote_views').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'quote_views'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_views', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'quote_views'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_views', ?)`).bind(maxId).run() } catch {}
        }
      }
    }
  } catch {}
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} quote views` })
  return imported
}

export async function importAuthorViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} author views...` })
  for (let i = 0; i < views.length; i++) {
    const v = views[i]
    try {
      const insert = db.prepare(`
        INSERT INTO author_views (author_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      const insertWithId = db.prepare(`
        INSERT INTO author_views (id, author_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      const hasExplicitId = Number.isFinite(Number(v?.id))
      const viewedAt = v.viewed_at || new Date().toISOString()
      if (hasExplicitId) {
        await insertWithId.bind(Number(v.id), v.author_id, v.user_id || null, v.ip_address || null, v.user_agent || null, viewedAt).run()
      } else {
        await insert.bind(v.author_id, v.user_id || null, v.ip_address || null, v.user_agent || null, viewedAt).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for author_views
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM author_views').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'author_views'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('author_views', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'author_views'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('author_views', ?)`).bind(maxId).run() } catch {}
        }
      }
    }
  } catch {}
  updateStepProgress(importId, 'quotes', { message: `Imported ${imported} author views` })
  return imported
}

export async function importReferenceViewsFromDataset(db: any, importId: string, views: any[]): Promise<number> {
  let imported = 0
  updateStepProgress(importId, 'quotes', { message: `Importing ${views.length} reference views...` })
  for (let i = 0; i < views.length; i++) {
    const v = views[i]
    try {
      const insert = db.prepare(`
        INSERT INTO reference_views (reference_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?)
      `)
      const insertWithId = db.prepare(`
        INSERT INTO reference_views (id, reference_id, user_id, ip_address, user_agent, viewed_at)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      const hasExplicitId = Number.isFinite(Number(v?.id))
      const viewedAt = v.viewed_at || new Date().toISOString()
      if (hasExplicitId) {
        await insertWithId.bind(Number(v.id), v.reference_id, v.user_id || null, v.ip_address || null, v.user_agent || null, viewedAt).run()
      } else {
        await insert.bind(v.reference_id, v.user_id || null, v.ip_address || null, v.user_agent || null, viewedAt).run()
      }
      imported++
    } catch {}
  }
  // Align sqlite_sequence for reference_views
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM reference_views').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'reference_views'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('reference_views', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'reference_views'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('reference_views', ?)`).bind(maxId).run() } catch {}
        }
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
  // Prepare statements (with and without explicit id)
  const insert = db.prepare(`
        INSERT INTO users (email, name, password, avatar_url, role, is_active, email_verified, biography, job, language, location, socials, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
  const insertWithId = db.prepare(`
        INSERT INTO users (id, email, name, password, avatar_url, role, is_active, email_verified, biography, job, language, location, socials, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
  for (let i = 0; i < users.length; i++) {
    const u = users[i]
    try {
      const hasExplicitId = Number.isFinite(Number(u?.id))
      const socials = JSON.stringify(u.socials || [])
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(u.id),
          u.email || '',
          u.name || '',
          u.password || '',
          u.avatar_url || null,
          u.role || 'user',
          u.is_active !== false,
          !!u.email_verified,
          u.biography || null,
          u.job || null,
          u.language || 'en',
          u.location || 'On Earth',
          socials,
          u.created_at || new Date().toISOString(),
          u.updated_at || new Date().toISOString()
        ).run()
      } else {
        await insert.bind(
          u.email || '',
          u.name || '',
          u.password || '',
          u.avatar_url || null,
          u.role || 'user',
          u.is_active !== false,
          !!u.email_verified,
          u.biography || null,
          u.job || null,
          u.language || 'en',
          u.location || 'On Earth',
          socials,
          u.created_at || new Date().toISOString(),
          u.updated_at || new Date().toISOString()
        ).run()
      }
      imported++
      if (imported % 10 === 0) updateStepProgress(importId, 'users', { current: i + 1, imported, message: `Imported ${imported}/${total} users` })
    } catch (e) {
      // continue on duplicates/errors
    }
  }
  // Align sqlite_sequence when IDs preserved (or generally safe to align to MAX(id))
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
  updateStepProgress(importId, 'users', { status: 'completed', current: total, imported, message: `Imported ${imported} users` })
  return imported
}

export async function importAuthorsFromDataset(db: any, importId: string, authors: any[]): Promise<number> {
  const total = authors.length
  let imported = 0
  updateStepProgress(importId, 'authors', { status: 'processing', total, current: 0, imported: 0, message: `Importing ${total} authors...` })
  
  const insert = db.prepare(`
    INSERT INTO authors (
      name, description, birth_date, death_date, birth_location, job,
      image_url, is_fictional, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  
  const insertWithId = db.prepare(`
    INSERT INTO authors (
      id, name, description, birth_date, death_date, birth_location, job,
      image_url, is_fictional, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < authors.length; i++) {
    const a = authors[i]
    try {
      const hasExplicitId = Number.isFinite(Number(a?.id))
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(a.id),
          a.name || '', a.description || '', a.birth_date || null, a.death_date || null, a.birth_location || '', a.job || '',
          a.image_url || '', !!a.is_fictional, a.views_count || 0, a.likes_count || 0, a.shares_count || 0,
          a.created_at || new Date().toISOString(), a.updated_at || new Date().toISOString()
        ).run()
      } else {
        await insert.bind(
          a.name || '', a.description || '', a.birth_date || null, a.death_date || null, a.birth_location || '', a.job || '',
          a.image_url || '', !!a.is_fictional, a.views_count || 0, a.likes_count || 0, a.shares_count || 0,
          a.created_at || new Date().toISOString(), a.updated_at || new Date().toISOString()
        ).run()
      }
      imported++
      if (imported % 10 === 0) updateStepProgress(importId, 'authors', { current: i + 1, imported, message: `Imported ${imported}/${total} authors` })
    } catch {}
  }
  // Align sqlite_sequence for authors
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM authors').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'authors'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'authors'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('authors', ?)`).bind(maxId).run() } catch {}
        }
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
  
  const insert = db.prepare(`
    INSERT INTO quote_references (
      name, original_language, release_date, description, primary_type, secondary_type,
      image_url, urls, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  const insertWithId = db.prepare(`
    INSERT INTO quote_references (
      id, name, original_language, release_date, description, primary_type, secondary_type,
      image_url, urls, views_count, likes_count, shares_count,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < refs.length; i++) {
    const r = refs[i]
    try {
      const hasExplicitId = Number.isFinite(Number(r?.id))
      const urls = JSON.stringify(r.urls || [])
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(r.id),
          r.name || '', r.original_language || 'en', r.release_date || null, r.description || '', r.primary_type || 'other', r.secondary_type || '',
          r.image_url || '', urls, r.views_count || 0, r.likes_count || 0, r.shares_count || 0,
          r.created_at || new Date().toISOString(), r.updated_at || new Date().toISOString()
        ).run()
      } else {
        await insert.bind(
          r.name || '', r.original_language || 'en', r.release_date || null, r.description || '', r.primary_type || 'other', r.secondary_type || '',
          r.image_url || '', urls, r.views_count || 0, r.likes_count || 0, r.shares_count || 0,
          r.created_at || new Date().toISOString(), r.updated_at || new Date().toISOString()
        ).run()
      }
      imported++
      if (imported % 10 === 0) updateStepProgress(importId, 'references', { current: i + 1, imported, message: `Imported ${imported}/${total} references` })
    } catch {}
  }
  // Align sqlite_sequence for quote_references
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM quote_references').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'quote_references'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_references', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'quote_references'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quote_references', ?)`).bind(maxId).run() } catch {}
        }
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
  for (let i = 0; i < tags.length; i++) {
    const t = tags[i]
    try {
      const hasExplicitId = Number.isFinite(Number(t?.id))
      if (hasExplicitId) {
        await db.prepare(`
          INSERT INTO tags (id, name, description, category, color, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          Number(t.id), t.name || '', t.description || null, t.category || null, t.color || '#3B82F6', t.created_at || new Date().toISOString(), t.updated_at || new Date().toISOString()
        ).run()
      } else {
        await db.prepare(`
          INSERT INTO tags (name, description, category, color, created_at, updated_at)
          VALUES (?, ?, ?, ?, ?, ?)
        `).bind(
          t.name || '', t.description || null, t.category || null, t.color || '#3B82F6', t.created_at || new Date().toISOString(), t.updated_at || new Date().toISOString()
        ).run()
      }
      imported++
      if (imported % 25 === 0) updateStepProgress(importId, 'tags', { current: i + 1, imported, message: `Imported ${imported}/${total} tags` })
    } catch {}
  }
  // Align sqlite_sequence for tags
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM tags').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'tags'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('tags', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'tags'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('tags', ?)`).bind(maxId).run() } catch {}
        }
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
  const insert = db.prepare(`
    INSERT INTO quotes (
      name, language, author_id, reference_id, user_id, status,
      likes_count, shares_count, views_count, is_featured,
      created_at, updated_at, moderator_id, moderated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)
  const insertWithId = db.prepare(`
    INSERT INTO quotes (
      id, name, language, author_id, reference_id, user_id, status,
      likes_count, shares_count, views_count, is_featured,
      created_at, updated_at, moderator_id, moderated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `)

  for (let i = 0; i < quotes.length; i++) {
    const q = quotes[i]
    try {
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

      const language = allowedLanguages.has(str(q.language).toLowerCase()) ? str(q.language).toLowerCase() : 'en'
      const status = allowedStatuses.has(str(q.status).toLowerCase()) ? str(q.status).toLowerCase() : 'approved'
      const authorId = toInt(q.author_id)
      const referenceId = toInt(q.reference_id)
      const userId = toInt(q.user_id) ?? (adminUserId ?? 1)
      const likes = toNonNeg(q.likes_count)
      const shares = toNonNeg(q.shares_count)
      const views = toNonNeg(q.views_count)
      const isFeatured = toBool(q.is_featured)
      const createdAt = q.created_at || new Date().toISOString()
      const updatedAt = q.updated_at || new Date().toISOString()
      const moderatorId = toInt(q.moderator_id) ?? adminUserId
      const moderatedAt = q.moderated_at || new Date().toISOString()

      const hasExplicitId = Number.isFinite(Number(q?.id))
      if (hasExplicitId) {
        await insertWithId.bind(
          Number(q.id),
          q.name || '', language, authorId, referenceId,
          userId, status, likes, shares, views, isFeatured,
          createdAt, updatedAt, moderatorId, moderatedAt
        ).run()
      } else {
        await insert.bind(
          q.name || '', language, authorId, referenceId,
          userId, status, likes, shares, views, isFeatured,
          createdAt, updatedAt, moderatorId, moderatedAt
        ).run()
      }
      imported++
      if (imported % 25 === 0) updateStepProgress(importId, 'quotes', { current: i + 1, imported, message: `Imported ${imported}/${total} quotes` })
    } catch (e: any) {
      skipped++
      addWarning(importId, `Quote ${i + 1} "${String(q.name || '').slice(0,80)}" skipped: ${e?.message || 'unknown error'}`)
    }
  }
  // Align sqlite_sequence for quotes
  try {
    const row = await db.prepare('SELECT COALESCE(MAX(id), 0) as mx FROM quotes').first()
    const maxId = Number(row?.mx || 0)
    if (maxId > 0) {
      const upd = await db.prepare(`UPDATE sqlite_sequence SET seq = ? WHERE name = 'quotes'`).bind(maxId).run()
      const changes = Number(upd?.meta?.changes || 0)
      if (changes === 0) {
        try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quotes', ?)`).bind(maxId).run() }
        catch {
          try { await db.prepare(`DELETE FROM sqlite_sequence WHERE name = 'quotes'`).run() } catch {}
          try { await db.prepare(`INSERT INTO sqlite_sequence(name, seq) VALUES('quotes', ?)`).bind(maxId).run() } catch {}
        }
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

  for (let i = 0; i < quoteTags.length; i++) {
    const qt = quoteTags[i]
    try {
      if (qt && (qt.quote_id != null) && (qt.tag_id != null)) {
        await db.prepare(`
          INSERT OR IGNORE INTO quote_tags (quote_id, tag_id) VALUES (?, ?)
        `).bind(qt.quote_id, qt.tag_id).run()
        imported++
        if (imported % 50 === 0) {
          updateStepProgress(importId, 'quotes', {
            message: `Linked ${imported}/${total} quote-tag relations...`
          })
        }
      }
    } catch {
      // ignore and continue
    }
  }

  updateStepProgress(importId, 'quotes', {
    message: `Linked ${imported} quote-tag relations`
  })
  return imported
}
