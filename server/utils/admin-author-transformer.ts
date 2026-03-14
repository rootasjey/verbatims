import type { Author } from '#shared/types/author'

type AdminAuthorRow = {
  id: number | string
  name: string
  isFictional?: boolean | null
  birthDate?: string | null
  birthLocation?: string | null
  deathDate?: string | null
  deathLocation?: string | null
  job?: string | null
  description?: string | null
  imageUrl?: string | null
  socials?: string | null
  viewsCount?: number | string | null
  likesCount?: number | string | null
  sharesCount?: number | string | null
  createdAt?: string | number | Date | null
  updatedAt?: string | number | Date | null
  quotes_count?: number | string | null
  enrichment_pending_count?: number | string | null
  enrichment_latest_job_id?: number | string | null
}

export const normalizeAdminAuthor = (author: AdminAuthorRow): Author => ({
  id: Number(author.id),
  name: author.name,
  is_fictional: Boolean(author.isFictional),
  birth_date: author.birthDate ?? undefined,
  birth_location: author.birthLocation ?? undefined,
  death_date: author.deathDate ?? undefined,
  death_location: author.deathLocation ?? undefined,
  job: author.job ?? undefined,
  description: author.description ?? undefined,
  image_url: author.imageUrl ?? undefined,
  socials: author.socials ?? '',
  views_count: Number(author.viewsCount ?? 0),
  likes_count: Number(author.likesCount ?? 0),
  shares_count: Number(author.sharesCount ?? 0),
  created_at: author.createdAt ? String(author.createdAt) : '',
  updated_at: author.updatedAt ? String(author.updatedAt) : '',
  quotes_count: Number(author.quotes_count ?? 0),
  enrichment_pending_count: Number(author.enrichment_pending_count ?? 0),
  enrichment_latest_job_id: author.enrichment_latest_job_id !== undefined && author.enrichment_latest_job_id !== null
    ? Number(author.enrichment_latest_job_id)
    : null,
})