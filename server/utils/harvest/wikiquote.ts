import type { QuoteLanguage } from '#shared/types/quote'
import type { HarvestSourceType } from '#shared/constants/harvest'
import type { HarvestSearchResult, HarvestQuotePreview, HarvestAuthorPreview } from '#shared/types/harvest'

import { detectQuoteLanguage } from './language'

export interface HarvestAdapter {
  readonly sourceType: HarvestSourceType
  readonly language: string
  readonly baseUrl: string
  search(query: string, limit?: number): Promise<HarvestSearchResult[]>
  getPageQuotes(pageSlug: string): Promise<HarvestQuotePreview[]>
  getSuggestions(limit?: number): Promise<HarvestSearchResult[]>
}

const WIKIQUOTE_USER_AGENT = 'VerbatimsBot/1.0 (+https://verbatims.cc)'

async function wikiQuoteApi(lang: string, params: Record<string, string>): Promise<any> {
  const url = new URL(`https://${lang}.wikiquote.org/w/api.php`)
  url.searchParams.set('format', 'json')
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value)
  }

  const response = await fetch(url.toString(), {
    headers: {
      'User-Agent': WIKIQUOTE_USER_AGENT,
      'Accept': 'application/json',
    },
  })

  if (!response.ok) {
    throw new Error(`WikiQuote API error: ${response.status} ${response.statusText}`)
  }

  return response.json()
}

function stripWikiMarkup(text: string): string {
  let result = text
  result = result.replace(/<ref[^>]*>[\s\S]*?<\/ref>/gi, '')
  result = result.replace(/<ref[^/]*\/>/gi, '')
  result = result.replace(/<[^>]+>/g, '')
  result = result.replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2')
  result = result.replace(/\[\[([^\]]+)\]\]/g, '$1')
  result = result.replace(/\{\{[^}]*\}\}/g, '')
  result = result.replace(/'''([^']*)'''/g, '$1')
  result = result.replace(/''([^']*)''/g, '$1')
  result = result.replace(/&amp;/g, '&')
  result = result.replace(/&lt;/g, '<')
  result = result.replace(/&gt;/g, '>')
  result = result.replace(/&quot;/g, '"')
  result = result.replace(/&#39;/g, "'")
  result = result.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)))
  result = result.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(Number('0x' + hex)))
  result = result.replace(/&nbsp;/g, ' ')
  result = result.replace(/&mdash;/g, '—')
  result = result.replace(/&ndash;/g, '–')
  result = result.replace(/&laquo;/g, '«')
  result = result.replace(/&raquo;/g, '»')
  result = result.replace(/&eacute;/g, 'é')
  result = result.replace(/&egrave;/g, 'è')
  result = result.replace(/&ecirc;/g, 'ê')
  result = result.replace(/&ccedil;/g, 'ç')
  result = result.replace(/\s+/g, ' ')
  return result.trim()
}

interface ParsedQuote {
  text: string
  attribution: string | null
}

const SKIP_SECTIONS_EN = [
  'see also', 'external links', 'references', 'bibliography', 'footnotes',
  'notes', 'about', 'sources', 'further reading', 'works', 'filmography',
  'discography', 'category', 'navigation', 'disputed', 'misattributed',
  'misattributions', 'novels', 'short stories', 'essays',
]

const SKIP_SECTIONS_FR = [
  'voir aussi', 'liens externes', 'références', 'source', 'bibliographie',
  'notes', 'annexe', 'catégorie', 'navigation', 'sommaire', 'article connexe',
  'sur le même sujet', 'modifier', 'œuvres', 'bibliographie sélective',
]

function shouldSkipSection(heading: string, lang: string): boolean {
  const lower = heading.toLowerCase().trim()
  const skipList = lang === 'fr' ? SKIP_SECTIONS_FR : SKIP_SECTIONS_EN
  return skipList.some(skip => lower.includes(skip))
}

function extractTemplateContent(wikitext: string, startIndex: number): { content: string; endIndex: number } | null {
  if (wikitext.substring(startIndex, startIndex + 2) !== '{{') return null

  let depth = 0
  let i = startIndex
  while (i < wikitext.length) {
    if (wikitext.substring(i, i + 2) === '{{') { depth++; i += 2; continue }
    if (wikitext.substring(i, i + 2) === '}}' && depth > 0) {
      depth--
      if (depth === 0) {
        return { content: wikitext.substring(startIndex + 2, i), endIndex: i + 2 }
      }
      i += 2; continue
    }
    i++
  }
  return null
}

function extractNamedParam(templateContent: string, paramName: string): string | null {
  const re = new RegExp(`(?:^|\\n|[|])\\s*${paramName}\\s*=\\s*`, 'i')
  const match = templateContent.match(re)
  if (!match) return null

  let start = match.index! + match[0].length
  let value = ''
  let depth = 0
  while (start < templateContent.length) {
    if (templateContent.substring(start, start + 2) === '{{') { depth++; value += '{{'; start += 2; continue }
    if (templateContent.substring(start, start + 2) === '}}' && depth > 0) { depth--; value += '}}'; start += 2; continue }
    if (templateContent[start] === '|' && depth === 0) break
    if (templateContent[start] === '}' && templateContent[start + 1] === '}' && depth === 0) break
    value += templateContent[start]
    start++
  }
  return value.trim()
}

function extractRefAttribution(templateContent: string): string {
  const parts: string[] = []
  const author = extractNamedParam(templateContent, 'auteur')
  const title = extractNamedParam(templateContent, 'titre')
  const year = extractNamedParam(templateContent, 'année') || extractNamedParam(templateContent, 'année d\'origine')
  const publisher = extractNamedParam(templateContent, 'éditeur')
  const page = extractNamedParam(templateContent, 'page')

  if (author) parts.push(author)
  if (title) parts.push(`''${stripWikiMarkup(title)}''`)
  if (publisher) parts.push(stripWikiMarkup(publisher))
  if (year) parts.push(year)
  if (page) parts.push(`p. ${page}`)

  return parts.join(', ')
}

function extractCitationText(templateContent: string): string {
  const namedCitation = extractNamedParam(templateContent, 'citation')
  if (namedCitation) return namedCitation

  const firstPipe = templateContent.indexOf('|')
  let textStart = 0

  if (firstPipe >= 0) {
    textStart = firstPipe + 1
  } else {
    return templateContent.trim()
  }

  const remaining = templateContent.substring(textStart)
  if (!remaining.trim()) return ''

  const nextNamedParam = remaining.search(/(?:^|\n)\s*[a-zéèêë]+\s*=\s*/im)
  if (nextNamedParam >= 0) {
    return remaining.substring(0, nextNamedParam).trim()
  }

  return remaining.trim()
}

const CITATION_RE = /^\{\{citation\s*[|\n]/i

function parseWikiTextQuotes(wikitext: string, lang: string): ParsedQuote[] {
  const quotes: ParsedQuote[] = []
  const lines = wikitext.split('\n')
  let currentSection = ''
  let inNoInclude = false
  const length = wikitext.length

  for (let i = 0; i < length; i++) {
    if (wikitext.substring(i, i + 12) === '<noinclude>') inNoInclude = true
    if (wikitext.substring(i, i + 13) === '</noinclude>') { inNoInclude = false; continue }
    if (inNoInclude) continue

    const headingMatch = wikitext.substring(i).match(/^={2,}\s*(.+?)\s*={2,}/)
    if (headingMatch) {
      currentSection = stripWikiMarkup(headingMatch[1]!)
      i += headingMatch[0].length - 1
      continue
    }

    if (wikitext.substring(i, i + 2) === '{{') {
      const rest = wikitext.substring(i)
      if (CITATION_RE.test(rest)) {
        if (shouldSkipSection(currentSection, lang)) { i++; continue }

        const tmpl = extractTemplateContent(wikitext, i)
        if (!tmpl) { i++; continue }

        const quoteText = extractCitationText(tmpl.content)
        const cleaned = stripWikiMarkup(quoteText)
        if (cleaned.length >= 10 && cleaned.length <= 5000) {
          let attribution: string | null = null

          const remaining = wikitext.substring(tmpl.endIndex)
          const refMatch = remaining.match(/^\s*\{\{réf\s+(?:Livre|Article|Web|Citation|Livre court|Livre BD)\b/i)
          if (refMatch) {
            const refOffset = tmpl.endIndex + (refMatch.index || 0)
            const refTmpl = extractTemplateContent(wikitext, refOffset)
            if (refTmpl) {
              attribution = extractRefAttribution(refTmpl.content) || null
              i = refTmpl.endIndex
            } else {
              i = tmpl.endIndex
            }
          } else {
            i = tmpl.endIndex
          }

          quotes.push({ text: cleaned, attribution })
        } else {
          i = tmpl.endIndex
        }
        continue
      }

      const tmpl = extractTemplateContent(wikitext, i)
      if (tmpl) { i = tmpl.endIndex; continue }
    }
    if (wikitext.substring(i, i + 1) === '\n') { i++; continue }
    i++
  }

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i]!

    const headingMatch = raw.match(/^={2,}\s*(.+?)\s*={2,}/)
    if (headingMatch) {
      currentSection = stripWikiMarkup(headingMatch[1]!)
      continue
    }

    if (raw.match(/^\s*\|/) || raw.match(/^\s*\|}/) || raw.match(/^\s*\{\|/)) continue
    if (raw.match(/^\s*\{\{/)) continue

    if (raw.match(/^\s*\*/)) {
      if (shouldSkipSection(currentSection, lang)) continue

      const level = raw.match(/^(\*+)/)?.[1]?.length || 1

      if (level === 1) {
        const quoteText = raw.replace(/^\*\s*/, '').trim()
        if (!quoteText) continue

        const cleaned = stripWikiMarkup(quoteText)
        if (cleaned.length < 10) continue
        if (cleaned.length > 5000) continue

        let attribution: string | null = null
        for (let j = i + 1; j < lines.length; j++) {
          const nextLine = lines[j]!
          const nextLevel = nextLine.match(/^(\*+)/)?.[1]?.length || 0
          if (nextLevel <= 1) break
          if (nextLevel === 2) {
            const attrText = nextLine.replace(/^\*\*\s*/, '').trim()
            if (attrText) {
              attribution = stripWikiMarkup(attrText)
            }
          }
        }

        quotes.push({ text: cleaned, attribution })
      }
    }
  }

  const seen = new Set<string>()
  return quotes.filter(q => {
    const key = q.text.toLowerCase().trim()
    if (seen.has(key)) return false
    if (key.length < 10) return false
    seen.add(key)
    return true
  })
}

function extractDescriptionFromWikiText(wikitext: string, title: string, lang: string): HarvestAuthorPreview {
  const baseUrl = lang === 'fr'
    ? 'https://fr.wikiquote.org/wiki/'
    : 'https://en.wikiquote.org/wiki/'

  const lines = wikitext.split('\n')
  let description: string | undefined
  let job: string | undefined

  for (const line of lines) {
    if (!line.startsWith("'''")) continue

    const cleaned = stripWikiMarkup(line)
    if (cleaned.length < 15 || cleaned.length > 600) continue

    description = cleaned.slice(0, 300)

    if (lang === 'fr') {
      const frMatch = cleaned.match(/^(.+?)\s+(?:est un(?:e)?|est le|est la)\s+(.+?)(?:[.;,]|\n|$)/i)
      if (frMatch?.[2]) {
        job = frMatch[2].replace(/,?\s*\d{4}.*$/, '').trim()
        if (job.length > 150) job = job.slice(0, 150)
      }
    } else {
      const enMatch = cleaned.match(/^(.+?)\s+(?:was|is)\s+(?:an?\s+)?(.+?)(?:[.;,]|\n|$)/i)
      if (enMatch?.[2]) {
        job = enMatch[2].replace(/,?\s*\d{4}.*$/, '').trim()
        if (job.length > 150) job = job.slice(0, 150)
      }
    }

    break
  }

  return {
    name: title.replace(/_/g, ' '),
    slug: title,
    url: `${baseUrl}${encodeURIComponent(title)}`,
    description,
    job,
  }
}

export class WikiQuoteFrAdapter implements HarvestAdapter {
  readonly sourceType = 'wikiquote-fr' as const
  readonly language = 'fr'
  readonly baseUrl = 'https://fr.wikiquote.org'

  async search(query: string, limit = 20): Promise<HarvestSearchResult[]> {
    const data = await wikiQuoteApi('fr', {
      action: 'query',
      list: 'search',
      srsearch: query,
      srnamespace: '0',
      srlimit: String(limit),
    })

    const results: HarvestSearchResult[] = []
    for (const item of data?.query?.search || []) {
      results.push({
        slug: item.title,
        title: item.title.replace(/_/g, ' '),
        description: (item.snippet || '').replace(/<[^>]+>/g, '').trim().slice(0, 200),
        url: `https://fr.wikiquote.org/wiki/${encodeURIComponent(item.title)}`,
        sourceType: this.sourceType,
        language: this.language,
      })
    }

    return results
  }

  async getPageQuotes(pageSlug: string): Promise<HarvestQuotePreview[]> {
    const data = await wikiQuoteApi('fr', {
      action: 'query',
      titles: pageSlug,
      prop: 'revisions',
      rvprop: 'content',
      rvlimit: '1',
      formatversion: '2',
    })

    const pages = data?.query?.pages
    if (!pages || !pages.length) return []

    const wikitext = pages[0]?.revisions?.[0]?.content
    if (!wikitext || typeof wikitext !== 'string') return []

    const authorInfo = extractDescriptionFromWikiText(wikitext, pageSlug, 'fr')
    const parsed = parseWikiTextQuotes(wikitext, 'fr')

    return parsed.map(q => ({
      text: q.text,
      language: detectQuoteLanguage(q.text, 'fr'),
      author: {
        ...authorInfo,
        ...(q.attribution ? {} : {}),
      },
      reference: q.attribution ? { name: q.attribution, type: 'other' } : undefined,
      sourceUrl: `https://fr.wikiquote.org/wiki/${encodeURIComponent(pageSlug)}`,
      sourceType: this.sourceType,
    }))
  }

  async getSuggestions(limit = 20): Promise<HarvestSearchResult[]> {
    const data = await wikiQuoteApi('fr', {
      action: 'query',
      list: 'random',
      rnnamespace: '0',
      rnlimit: String(limit),
    })

    const results: HarvestSearchResult[] = []
    for (const item of data?.query?.random || []) {
      results.push({
        slug: item.title,
        title: item.title.replace(/_/g, ' '),
        url: `https://fr.wikiquote.org/wiki/${encodeURIComponent(item.title)}`,
        sourceType: this.sourceType,
        language: this.language,
      })
    }

    return results
  }
}

export class WikiQuoteEnAdapter implements HarvestAdapter {
  readonly sourceType = 'wikiquote-en' as const
  readonly language = 'en'
  readonly baseUrl = 'https://en.wikiquote.org'

  async search(query: string, limit = 20): Promise<HarvestSearchResult[]> {
    const data = await wikiQuoteApi('en', {
      action: 'query',
      list: 'search',
      srsearch: query,
      srlimit: String(limit),
      srnamespace: '0',
    })

    const results: HarvestSearchResult[] = []
    for (const item of data?.query?.search || []) {
      results.push({
        slug: item.title,
        title: item.title.replace(/_/g, ' '),
        description: (item.snippet || '').replace(/<[^>]+>/g, '').trim().slice(0, 200),
        url: `https://en.wikiquote.org/wiki/${encodeURIComponent(item.title)}`,
        sourceType: this.sourceType,
        language: this.language,
      })
    }

    return results
  }

  async getPageQuotes(pageSlug: string): Promise<HarvestQuotePreview[]> {
    const data = await wikiQuoteApi('en', {
      action: 'query',
      titles: pageSlug,
      prop: 'revisions',
      rvprop: 'content',
      rvlimit: '1',
      formatversion: '2',
    })

    const pages = data?.query?.pages
    if (!pages || !pages.length) return []

    const wikitext = pages[0]?.revisions?.[0]?.content
    if (!wikitext || typeof wikitext !== 'string') return []

    const authorInfo = extractDescriptionFromWikiText(wikitext, pageSlug, 'en')
    const parsed = parseWikiTextQuotes(wikitext, 'en')

    return parsed.map(q => ({
      text: q.text,
      language: detectQuoteLanguage(q.text, 'en'),
      author: {
        ...authorInfo,
      },
      reference: q.attribution ? { name: q.attribution, type: 'other' } : undefined,
      sourceUrl: `https://en.wikiquote.org/wiki/${encodeURIComponent(pageSlug)}`,
      sourceType: this.sourceType,
    }))
  }

  async getSuggestions(limit = 20): Promise<HarvestSearchResult[]> {
    const data = await wikiQuoteApi('en', {
      action: 'query',
      list: 'random',
      rnnamespace: '0',
      rnlimit: String(limit),
    })

    const results: HarvestSearchResult[] = []
    for (const item of data?.query?.random || []) {
      results.push({
        slug: item.title,
        title: item.title.replace(/_/g, ' '),
        url: `https://en.wikiquote.org/wiki/${encodeURIComponent(item.title)}`,
        sourceType: this.sourceType,
        language: this.language,
      })
    }

    return results
  }
}

export function toQuoteLanguage(lang: string): QuoteLanguage {
  const valid: QuoteLanguage[] = ['en', 'fr', 'es', 'de', 'it', 'pt', 'ru', 'ja', 'zh', 'la']
  if (valid.includes(lang as QuoteLanguage)) return lang as QuoteLanguage
  return 'en'
}

export function mapWikiQuoteLang(sourceType: HarvestSourceType): string {
  if (sourceType === 'wikiquote-fr') return 'fr'
  if (sourceType === 'wikiquote-en') return 'en'
  return 'en'
}