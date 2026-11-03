export interface ImportSelectOption {
  label: string
  value: string
}

const selectOptionByValue = (options: ImportSelectOption[], value: string): ImportSelectOption | null => {
  return options.find(option => option.value === value) || null
}

export const parseCSV = (csvContent: string): Record<string, any>[] => {
  // Simple CSV parser - in production, use a proper CSV library
  const lines = csvContent.trim().split('\n')
  if (!lines.length) return []
  const headers = (lines[0] ?? '').split(',').map(h => h.trim().replace(/"/g, ''))

  return lines.slice(1).map(line => {
    const values = line.split(',').map(v => v.trim().replace(/"/g, ''))
    const obj: Record<string, any> = {}
    headers.forEach((header, index) => {
      obj[header] = values[index] || null
    })
    return obj
  })
}

export const parseXML = (xmlText: string): Record<string, any>[] => {
  try {
    const doc = new DOMParser().parseFromString(xmlText, 'application/xml')
    const hasError = doc.getElementsByTagName('parsererror')[0]
    if (hasError) throw new Error('Invalid XML')
    const refs = Array.from(doc.getElementsByTagName('reference'))
    const nodes = refs.length ? refs : Array.from(doc.documentElement.children)
    return nodes.map((el) => {
      const obj: Record<string, any> = {}
      Array.from(el.children).forEach((c) => { obj[c.tagName] = c.textContent || '' })
      return obj
    })
  } catch (e: any) {
    console.error('XML parse failed:', e)
    return []
  }
}

// ---------- Detection Helpers ----------
export const guessDataTypeFromName = (lowerName: string, options: ImportSelectOption[]): ImportSelectOption | null => {
  const pairs: Array<{ re: RegExp; value: string }> = [
    { re: /(\b|[-_])(quote|quotes|qts)(\b|\.|[-_])/i, value: 'quotes' },
    { re: /(\b|[-_])(author|authors|people|persons)(\b|\.|[-_])/i, value: 'authors' },
    { re: /(\b|[-_])(reference|references|books|films|works)(\b|\.|[-_])/i, value: 'references' },
    { re: /(\b|[-_])(tag|tags)(\b|\.|[-_])/i, value: 'tags' },
    { re: /(\b|[-_])(user|users|accounts)(\b|\.|[-_])/i, value: 'users' },
  ]
  for (const pair of pairs) {
    if (pair.re.test(lowerName)) return selectOptionByValue(options, pair.value)
  }
  return null
}

export const guessFormatFromContent = (text: string): 'json' | 'csv' | 'xml' | null => {
  const t = text.trim()
  if (!t) return null
  if (t.startsWith('{') || t.startsWith('[')) return 'json'
  if (/^<\?xml|^<([a-zA-Z_][\w:-]*)(\s|>)/.test(t)) return 'xml'
  // crude CSV check: header, delimiter, newline
  const firstLine = t.split(/\r?\n/)[0] || ''
  if (firstLine.includes(',')) return 'csv'
  return null
}

const guessDataTypeFromJSONSample = (sample: any, options: ImportSelectOption[]): ImportSelectOption | null => {
  if (!sample || typeof sample !== 'object') return null
  const k = Object.keys(sample)
  const hasQuoteKeys = k.includes('language') || k.includes('status') || k.includes('author_id') || k.includes('reference_id') || k.includes('content')
  const hasReferenceKeys = k.includes('primary_type') || k.includes('secondary_type') || k.includes('release_date') || k.includes('source_url')
  const hasAuthorKeys = k.includes('is_fictional') || k.includes('birth_date') || k.includes('death_date') || k.includes('biography')
  const hasUserKeys = k.includes('email') || k.includes('role') || k.includes('display_name')
  const hasTagKeys = (k.includes('color') || k.includes('slug')) && !k.includes('email') && !k.includes('language')

  if (hasQuoteKeys) return selectOptionByValue(options, 'quotes')
  if (hasReferenceKeys) return selectOptionByValue(options, 'references')
  if (hasAuthorKeys) return selectOptionByValue(options, 'authors')
  if (hasUserKeys) return selectOptionByValue(options, 'users')
  if (hasTagKeys) return selectOptionByValue(options, 'tags')
  return null
}

export const guessDataTypeFromContent = (text: string, fmt: string | null | undefined, options: ImportSelectOption[]): ImportSelectOption | null => {
  const format = fmt || guessFormatFromContent(text)
  if (!format) return null

  if (format === 'json') {
    // Try light regex-based hints first (no full parse required)
    const t = text
    const hintPairs: Array<{ re: RegExp; type: 'quotes'|'authors'|'references'|'tags'|'users' }> = [
      { re: /"(language|status|author_id|reference_id|content)"\s*:/i, type: 'quotes' },
      { re: /"(primary_type|secondary_type|release_date|source_url)"\s*:/i, type: 'references' },
      { re: /"(is_fictional|birth_date|death_date|biography)"\s*:/i, type: 'authors' },
      { re: /"(email|role|display_name)"\s*:/i, type: 'users' },
      { re: /"(color|slug)"\s*:/i, type: 'tags' },
    ]
    for (const h of hintPairs) {
      if (h.re.test(t)) return selectOptionByValue(options, h.type)
    }

    // As a fallback, if the file is reasonably small, try parsing
    try {
      if (t.length < 2_000_000) {
        const parsed = JSON.parse(text)
        if (Array.isArray(parsed) && parsed.length) return guessDataTypeFromJSONSample(parsed[0], options)
        if (parsed && typeof parsed === 'object') {
          // If shape is { data: [...] }
          if (Array.isArray((parsed as any).data) && (parsed as any).data.length) return guessDataTypeFromJSONSample((parsed as any).data[0], options)
          // If shape is { quotes: [...]} etc.
          const keys = ['quotes','authors','references','tags','users']
          for (const k of keys) {
            const arr = (parsed as any)[k]
            if (Array.isArray(arr) && arr.length) return selectOptionByValue(options, k)
          }
        }
      }
    } catch { /* ignore */ }
    return null
  }

  if (format === 'csv') {
    const firstLine = (text.split(/\r?\n/)[0] || '').toLowerCase()
    const headers = firstLine.split(',').map(h => h.trim())
    const has = (h: string) => headers.includes(h)
    if (has('content') || has('author_id') || has('reference_id') || has('language')) return selectOptionByValue(options, 'quotes')
    if (has('primary_type') || has('release_date') || has('secondary_type')) return selectOptionByValue(options, 'references')
    if (has('is_fictional') || has('birth_date') || has('death_date')) return selectOptionByValue(options, 'authors')
    if (has('email') || has('role')) return selectOptionByValue(options, 'users')
    if (has('color') || has('slug')) return selectOptionByValue(options, 'tags')
    return null
  }

  if (format === 'xml') {
    // Try to infer via tag names without full parse
    const t = text.slice(0, 16384)
    if (/<quotes?\b|<quote\b/i.test(t)) return selectOptionByValue(options, 'quotes')
    if (/<authors?\b|<author\b/i.test(t)) return selectOptionByValue(options, 'authors')
    if (/<references?\b|<reference\b|<book\b|<film\b/i.test(t)) return selectOptionByValue(options, 'references')
    if (/<tags?\b|<tag\b/i.test(t)) return selectOptionByValue(options, 'tags')
    if (/<users?\b|<user\b/i.test(t)) return selectOptionByValue(options, 'users')
    return null
  }

  return null
}
