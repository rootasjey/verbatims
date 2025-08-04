/**
 * Test API: Quote Transformation
 * Test the Firestore quote transformation functionality
 */

import { readFileSync } from 'fs'
import { join } from 'path'
import { transformFirestoreQuotes } from '~/server/utils/firestore-quote-transformer'

export default defineEventHandler(async (event) => {
  try {
    // Read the drafts file
    const filePath = join(process.cwd(), 'server/database/backups/drafts-1752640057.json')
    const draftsData = JSON.parse(readFileSync(filePath, 'utf8'))

    const totalQuotes = Object.keys(draftsData.data).length
    
    // Transform the data
    const adminUserId = 1 // Assuming admin user ID is 1
    const transformResult = transformFirestoreQuotes(draftsData, adminUserId)

    // Analyze the quotes
    let quotesWithAuthors = 0
    let quotesWithReferences = 0
    let quotesWithExistingAuthorIds = 0
    let quotesWithExistingReferenceIds = 0

    transformResult.quotes.forEach(quote => {
      if (quote.author) {
        quotesWithAuthors++
        if (quote.author.id) {
          quotesWithExistingAuthorIds++
        }
      }
      
      if (quote.reference) {
        quotesWithReferences++
        if (quote.reference.id) {
          quotesWithExistingReferenceIds++
        }
      }
    })

    return {
      success: true,
      analysis: {
        totalQuotesInFile: totalQuotes,
        transformedQuotes: transformResult.quotes.length,
        warningsCount: transformResult.warnings.length,
        quotesWithAuthors,
        quotesWithExistingAuthorIds,
        quotesWithNewAuthors: quotesWithAuthors - quotesWithExistingAuthorIds,
        quotesWithReferences,
        quotesWithExistingReferenceIds,
        quotesWithNewReferences: quotesWithReferences - quotesWithExistingReferenceIds
      },
      sampleQuotes: transformResult.quotes.slice(0, 3).map(quote => ({
        name: quote.name.substring(0, 100) + (quote.name.length > 100 ? '...' : ''),
        language: quote.language,
        author: quote.author?.name || 'None',
        reference: quote.reference?.name || 'None',
        hasAuthorId: !!quote.author?.id,
        hasReferenceId: !!quote.reference?.id
      })),
      warnings: transformResult.warnings.slice(0, 5)
    }

  } catch (error: any) {
    return {
      success: false,
      error: error.message
    }
  }
})
