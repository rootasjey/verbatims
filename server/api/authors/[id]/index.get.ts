import type { ApiResponse, Author, AuthorSocialLink, AuthorWithSocials } from "~/types"
import { throwServer } from '~/server/utils/throw-server'
import { parseAuthorSocials } from "~/server/utils/author-transformer"

export default defineEventHandler(async (event) => {
  try {
    const authorId = getRouterParam(event, 'id')
    if (!authorId || isNaN(parseInt(authorId))) throwServer(400, 'Invalid author ID')

    const db = hubDatabase()
    // Fetch author with quote count and origin reference if any

    const author: Author | null = await db.prepare(`
      SELECT 
        a.*,
        COUNT(q.id) as quotes_count,
        (
          SELECT r.id FROM quotes q2
          JOIN quote_references r ON r.id = q2.reference_id
          WHERE q2.author_id = a.id AND q2.status = 'approved' AND q2.reference_id IS NOT NULL
          GROUP BY q2.reference_id
          ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
          LIMIT 1
        ) AS origin_reference_id,
        (
          SELECT r.name FROM quotes q2
          JOIN quote_references r ON r.id = q2.reference_id
          WHERE q2.author_id = a.id AND q2.status = 'approved' AND q2.reference_id IS NOT NULL
          GROUP BY q2.reference_id
          ORDER BY COUNT(*) DESC, MAX(q2.created_at) DESC
          LIMIT 1
        ) AS origin_reference_name
      FROM authors a
      LEFT JOIN quotes q ON a.id = q.author_id AND q.status = 'approved'
      WHERE a.id = ?
      GROUP BY a.id
  `).bind(authorId).first()

    if (!author) { throwServer(404, 'Author not found'); return }

    // Parse JSON fields
    const socials = parseAuthorSocials(author.socials as string | null | undefined)

    const transformedAuthor: AuthorWithSocials = {
      id: Number(author.id),
      name: author.name,
      is_fictional: Boolean(author.is_fictional),
      birth_date: author.birth_date ?? undefined,
      birth_location: author.birth_location ?? undefined,
      death_date: author.death_date ?? undefined,
      death_location: author.death_location ?? undefined,
      job: author.job ?? undefined,
      description: author.description ?? undefined,
      image_url: author.image_url ?? undefined,
      socials,
      views_count: Number(author.views_count ?? 0),
      likes_count: Number(author.likes_count ?? 0),
      shares_count: Number(author.shares_count ?? 0),
      quotes_count: Number(author.quotes_count ?? 0),
      created_at: author.created_at,
      updated_at: author.updated_at,
      origin_reference_id: author.origin_reference_id ? Number(author.origin_reference_id) : undefined,
      origin_reference_name: author.origin_reference_name ?? undefined
    }

    const response: ApiResponse<AuthorWithSocials> = {
      success: true,
      data: transformedAuthor
    }

    return response
  } catch (error: any) {
    if (error && error.statusCode) throw error
    console.error('Error fetching author:', error)
    throwServer(500, 'Failed to fetch author')
  }
})
