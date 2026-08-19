/**
 * Transform basic database quote results into frontend-ready format
 */
export function transformQuotes(quotes: DatabaseQuoteWithRelations[]): QuoteWithMetadata[] {
  return quotes.map((quote): QuoteWithMetadata => {
    const provenance = (quote as any).provenance
    const primaryAttribution = provenance?.attributions?.find((item: any) => item.is_primary) ?? provenance?.attributions?.[0]
    const primarySource = provenance?.sources?.find((item: any) => item.is_primary) ?? provenance?.sources?.[0]
    const record = quote as any

    return {
    id: quote.id,
    name: quote.name,
    language: quote.language,
    status: quote.status,
    author_id: primaryAttribution?.author_id ?? undefined,
    reference_id: primaryAttribution?.reference_id ?? undefined,
    user_id: record.user_id ?? record.userId,
    moderator_id: record.moderator_id ?? record.moderatorId,
    moderated_at: record.moderated_at ?? record.moderatedAt,
    rejection_reason: record.rejection_reason ?? record.rejectionReason,
    views_count: record.views_count ?? record.viewsCount ?? 0,
    likes_count: record.likes_count ?? record.likesCount ?? 0,
    shares_count: record.shares_count ?? record.sharesCount ?? 0,
    is_featured: record.is_featured ?? record.isFeatured ?? false,
    source_type: primarySource?.source_type ?? undefined,
    source_url: primarySource?.source_url ?? undefined,
    created_at: record.created_at ?? record.createdAt,
    updated_at: record.updated_at ?? record.updatedAt,
    author: primaryAttribution?.author_id ? {
      id: primaryAttribution.author_id,
      name: primaryAttribution.author?.name,
      is_fictional: primaryAttribution.author?.is_fictional,
      image_url: primaryAttribution.author?.image_url ?? undefined
    } : undefined,
    reference: primaryAttribution?.reference_id ? {
      id: primaryAttribution.reference_id,
      name: primaryAttribution.reference?.name,
      primary_type: primaryAttribution.reference?.primary_type as QuoteReferencePrimaryType
    } : undefined,
    tags: parseTags(record.tag_names ?? record.tagNames, record.tag_colors ?? record.tagColors),
    attributions: provenance?.attributions,
    sources: provenance?.sources,
  }
  })
}

/**
 * Transform admin database quote results into frontend-ready format with admin fields
 */
export function transformAdminQuotes(quotes: DatabaseAdminQuote[]): AdminQuote[] {
  return quotes.map((quote): AdminQuote => {
    const baseQuote = transformQuotes([quote])[0]!

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
