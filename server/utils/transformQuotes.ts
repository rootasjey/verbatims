/**
 * Transform raw database quote results into frontend-ready format
 */
export function transformQuotes(quotes: any[]): any[] {
  return quotes.map((quote: any) => ({
    id: quote.id,
    name: quote.name,
    language: quote.language,
    status: quote.status,
    views_count: quote.views_count,
    likes_count: quote.likes_count,
    shares_count: quote.shares_count,
    is_featured: quote.is_featured,
    created_at: quote.created_at,
    updated_at: quote.updated_at,
    moderated_at: quote.moderated_at,
    author: quote.author_id ? {
      id: quote.author_id,
      name: quote.author_name,
      is_fictional: quote.author_is_fictional,
      image_url: quote.author_image_url
    } : null,
    reference: quote.reference_id ? {
      id: quote.reference_id,
      name: quote.reference_name,
      type: quote.reference_type
    } : null,
    user: {
      name: quote.user_name,
      email: quote.user_email,
      avatar_url: quote.user_avatar
    },
    moderator: quote.moderator_name ? {
      name: quote.moderator_name
    } : null,
    tags: quote.tag_names ? quote.tag_names.split(',').map((name: string, index: number) => ({
      name,
      color: quote.tag_colors?.split(',')[index] || 'gray'
    })) : []
  }))
}
