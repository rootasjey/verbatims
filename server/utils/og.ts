interface QuoteOgRecord {
  id: number
  name: string
  author_id?: number | null
  author_name?: string | null
  reference_id?: number | null
  reference_name?: string | null
  language?: string | null
  updated_at?: string | null
}

export interface QuoteOgPayload {
  id: number
  text: string
  authorName?: string
  referenceName?: string
  language: string
  updatedAt: string | null
}

export async function getApprovedQuoteForOg(quoteId: string): Promise<QuoteOgPayload | null> {
  const db = hubDatabase()

  const record = await db.prepare(`
    SELECT 
      q.id,
      q.name,
      q.author_id,
      a.name AS author_name,
      q.reference_id,
      r.name AS reference_name,
      q.language,
      q.updated_at
    FROM quotes q
    LEFT JOIN authors a ON q.author_id = a.id
    LEFT JOIN quote_references r ON q.reference_id = r.id
    WHERE q.id = ? AND q.status = 'approved'
    LIMIT 1
  `).bind(quoteId).first()

  if (!record) {
    return null
  }

  const data = record as unknown as QuoteOgRecord

  return {
    id: Number(data.id),
    text: String(data.name),
    authorName: data.author_name ?? undefined,
    referenceName: data.reference_name ?? undefined,
    language: data.language ?? 'en',
    updatedAt: data.updated_at ?? null
  }
}