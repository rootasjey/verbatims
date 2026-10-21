import type { Author } from '#shared/types/author'

type AdminAuthorRow = {
  id: number | string
  name: string
  isFictional?: boolean | null
  birthDate?: string | null
  birthYear?: number | null
  birthEra?: 'bce' | 'ce' | null
  birthMonth?: number | null
  birthDay?: number | null
  birthIsApproximate?: boolean | null
  birthCalendar?: string | null
  birthLocation?: string | null
  deathDate?: string | null
  deathYear?: number | null
  deathEra?: 'bce' | 'ce' | null
  deathMonth?: number | null
  deathDay?: number | null
  deathIsApproximate?: boolean | null
  deathCalendar?: string | null
  deathLocation?: string | null
  job?: string | null
  description?: string | null
  imageUrl?: string | null
  imageAlt?: string | null
  imageCredit?: string | null
  imageSourceUrl?: string | null
  imageLicense?: string | null
  imageDate?: string | null
  imageLocation?: string | null
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
  birth_year: author.birthYear,
  birth_era: author.birthEra ?? 'ce',
  birth_month: author.birthMonth,
  birth_day: author.birthDay,
  birth_is_approximate: Boolean(author.birthIsApproximate),
  birth_calendar: author.birthCalendar ?? 'gregorian-proleptic',
  birth_location: author.birthLocation ?? undefined,
  death_date: author.deathDate ?? undefined,
  death_year: author.deathYear,
  death_era: author.deathEra ?? 'ce',
  death_month: author.deathMonth,
  death_day: author.deathDay,
  death_is_approximate: Boolean(author.deathIsApproximate),
  death_calendar: author.deathCalendar ?? 'gregorian-proleptic',
  death_location: author.deathLocation ?? undefined,
  job: author.job ?? undefined,
  description: author.description ?? undefined,
  image_url: author.imageUrl ?? undefined,
  image_alt: author.imageAlt ?? undefined,
  image_credit: author.imageCredit ?? undefined,
  image_source_url: author.imageSourceUrl ?? undefined,
  image_license: author.imageLicense ?? undefined,
  image_date: author.imageDate ?? undefined,
  image_location: author.imageLocation ?? undefined,
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
