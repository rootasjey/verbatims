/**
 * Firestore Quote Transformer
 * Transforms Firestore draft quote documents to SQLite schema format
 */

interface FirestoreTimestamp {
  __time__: string
}

interface FirestoreQuote {
  name: string
  language?: string
  created_at?: FirestoreTimestamp
  updated_at?: FirestoreTimestamp
  user?: {
    id: string
  }
  author?: {
    id?: string
    name?: string
    job?: string
    summary?: string
    is_fictional?: boolean
    birth?: {
      city?: string
      country?: string
      date?: FirestoreTimestamp
    }
    death?: {
      city?: string
      country?: string
      date?: FirestoreTimestamp
    }
    urls?: {
      image?: string
      wikipedia?: string
      [key: string]: string | undefined
    }
  }
  reference?: {
    id?: string
    name?: string
    language?: string
    summary?: string
    release?: {
      original?: FirestoreTimestamp
    }
    urls?: {
      image?: string
      [key: string]: string | undefined
    }
  }
  topics?: {
    [key: string]: boolean
  }
}

interface TransformedQuote {
  firebase_id: string
  name: string
  language: string
  user_id: number
  status: string
  author?: {
    id?: string
    name: string
    job?: string
    summary?: string
    is_fictional?: boolean
    birth?: {
      city?: string
      country?: string
      date?: FirestoreTimestamp
    }
    death?: {
      city?: string
      country?: string
      date?: FirestoreTimestamp
    }
    urls?: {
      image?: string
      wikipedia?: string
      [key: string]: string | undefined
    }
  }
  reference?: {
    id?: string
    name: string
    language?: string
    summary?: string
    release?: {
      original?: FirestoreTimestamp
    }
    urls?: {
      image?: string
      [key: string]: string | undefined
    }
  }
  created_at: string
  updated_at: string
}

export class FirestoreQuoteTransformer {
  private warnings: Array<{ firebaseId?: string; warning: string }> = []
  private adminUserId: number

  constructor(adminUserId: number) {
    this.adminUserId = adminUserId
  }

  /**
   * Transform Firestore JSON export to array of quotes
   */
  transformFirestoreQuotes(firestoreData: any): {
    quotes: TransformedQuote[]
    warnings: Array<{ firebaseId?: string; warning: string }>
  } {
    this.warnings = []

    if (!firestoreData || !firestoreData.data) {
      throw new Error('Invalid Firestore export format: missing data property')
    }

    const quotes: TransformedQuote[] = []
    const data = firestoreData.data

    for (const [firebaseId, quoteData] of Object.entries(data)) {
      try {
        const transformedQuote = this.transformSingleQuote(firebaseId, quoteData as FirestoreQuote)
        quotes.push(transformedQuote)
      } catch (error: any) {
        this.warnings.push({
          firebaseId,
          warning: `Failed to transform quote: ${error.message}`
        })
      }
    }

    return {
      quotes,
      warnings: this.warnings
    }
  }

  /**
   * Transform a single Firestore quote document
   */
  private transformSingleQuote(firebaseId: string, firestoreQuote: FirestoreQuote): TransformedQuote {
    // Validate required fields
    if (!firestoreQuote.name || typeof firestoreQuote.name !== 'string') {
      throw new Error('Quote text (name) is required')
    }

    if (firestoreQuote.name.length < 10) {
      throw new Error('Quote text too short (minimum 10 characters)')
    }

    if (firestoreQuote.name.length > 3000) {
      throw new Error('Quote text too long (maximum 3000 characters)')
    }

    // Transform dates
    const createdAt = this.transformDate(firestoreQuote.created_at)
    const updatedAt = this.transformDate(firestoreQuote.updated_at)

    // Validate and normalize language
    const validLanguages = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh']
    let language = firestoreQuote.language || 'en'
    if (!validLanguages.includes(language)) {
      this.warnings.push({
        firebaseId,
        warning: `Unsupported language "${language}", defaulting to "en"`
      })
      language = 'en'
    }

    const transformedQuote: TransformedQuote = {
      firebase_id: firebaseId,
      name: firestoreQuote.name.trim(),
      language,
      user_id: this.adminUserId, // All drafts will be assigned to admin user
      status: 'draft',
      created_at: createdAt,
      updated_at: updatedAt
    }

    // Transform author if present and has name
    if (firestoreQuote.author && firestoreQuote.author.name?.trim()) {
      transformedQuote.author = {
        id: firestoreQuote.author.id || undefined,
        name: firestoreQuote.author.name.trim(),
        job: firestoreQuote.author.job || undefined,
        summary: firestoreQuote.author.summary || undefined,
        is_fictional: firestoreQuote.author.is_fictional || false,
        birth: firestoreQuote.author.birth,
        death: firestoreQuote.author.death,
        urls: firestoreQuote.author.urls
      }
    }

    // Transform reference if present and has name
    if (firestoreQuote.reference && firestoreQuote.reference.name?.trim()) {
      transformedQuote.reference = {
        id: firestoreQuote.reference.id || undefined,
        name: firestoreQuote.reference.name.trim(),
        language: firestoreQuote.reference.language || 'en',
        summary: firestoreQuote.reference.summary || undefined,
        release: firestoreQuote.reference.release,
        urls: firestoreQuote.reference.urls
      }
    }

    return transformedQuote
  }

  /**
   * Transform Firestore timestamp to ISO string
   */
  private transformDate(firestoreTimestamp?: FirestoreTimestamp): string {
    if (!firestoreTimestamp || !firestoreTimestamp.__time__) {
      return new Date().toISOString()
    }

    try {
      return new Date(firestoreTimestamp.__time__).toISOString()
    } catch (error) {
      this.warnings.push({
        warning: `Invalid date format: ${JSON.stringify(firestoreTimestamp)}, using current date`
      })
      return new Date().toISOString()
    }
  }

  /**
   * Get transformation warnings
   */
  getWarnings(): Array<{ firebaseId?: string; warning: string }> {
    return this.warnings
  }

  /**
   * Clear warnings
   */
  clearWarnings(): void {
    this.warnings = []
  }
}

/**
 * Quick transformation function for API use
 */
export function transformFirestoreQuotes(firestoreData: any, adminUserId: number) {
  const transformer = new FirestoreQuoteTransformer(adminUserId)
  return transformer.transformFirestoreQuotes(firestoreData)
}
