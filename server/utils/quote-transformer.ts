import type { 
  AdminQuote, 
  DatabaseAdminQuote, 
  DatabaseQuoteWithRelations, 
  QuoteReferencePrimaryType, 
  QuoteWithMetadata, 
} from "~/types"

/**
 * Transform basic database quote results into frontend-ready format
 */
export function transformQuotes(quotes: DatabaseQuoteWithRelations[]): QuoteWithMetadata[] {
  return quotes.map((quote): QuoteWithMetadata => ({
    id: quote.id,
    name: quote.name,
    language: quote.language,
    status: quote.status,
    author_id: quote.author_id,
    reference_id: quote.reference_id,
    user_id: quote.user_id,
    moderator_id: quote.moderator_id,
    moderated_at: quote.moderated_at,
    rejection_reason: quote.rejection_reason,
    views_count: quote.views_count,
    likes_count: quote.likes_count,
    shares_count: quote.shares_count,
    is_featured: quote.is_featured,
    created_at: quote.created_at,
    updated_at: quote.updated_at,
    author: quote.author_id ? {
      id: quote.author_id,
      name: quote.author_name!,
      is_fictional: quote.author_is_fictional!,
      image_url: quote.author_image_url ?? undefined
    } : undefined,
    reference: quote.reference_id ? {
      id: quote.reference_id,
      name: quote.reference_name,
      primary_type: quote.reference_type as QuoteReferencePrimaryType
    } : undefined,
    tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
      id: index, // Not available in results
      name,
      color: quote.tag_colors?.split(',')[index] || 'gray'
    })) : []
  }))
}

/**
 * Transform admin database quote results into frontend-ready format with admin fields
 */
export function transformAdminQuotes(quotes: DatabaseAdminQuote[]): AdminQuote[] {
  return quotes.map((quote): AdminQuote => {
    const baseQuote = transformQuotes([quote])[0]

    return {
      ...baseQuote,
      // Preserve flat structure for template compatibility
      author_name: quote.author_name,
      author_is_fictional: quote.author_is_fictional,
      author_image_url: quote.author_image_url,
      author: quote.author_id ? {
        id: quote.author_id,
        name: quote.author_name!,
        is_fictional: quote.author_is_fictional!,
        image_url: quote.author_image_url ?? undefined
      } : undefined,
      reference_name: quote.reference_name,
      reference_type: quote.reference_type,
      reference: quote.reference_id ? {
        id: quote.reference_id,
        name: quote.reference_name,
        primary_type: quote.reference_type
      } : undefined,
      user_name: quote.user_name,
      user_email: quote.user_email,
      user_avatar_url: quote.user_avatar || quote.user_avatar_url,
      moderator_name: quote.moderator_name,
      // Keep nested structure for proper typing
      user: {
        id: quote.user_id,
        name: quote.user_name || '',
        email: quote.user_email,
        avatar_url: (quote.user_avatar || quote.user_avatar_url)
      },
      moderator: quote.moderator_name ? {
        id: quote.moderator_id,
        name: quote.moderator_name
      } : undefined,
    }
  })
}
