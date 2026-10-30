import { db, schema } from 'hub:db'
import { and, eq, inArray } from 'drizzle-orm'
import { toISOStringOrNull } from './date-normalization'
import { localizeReferences, type ContentLanguage } from './entity-translations'
import { chunkForD1Bindings } from './d1-parameter-batching'

export async function getPrimaryQuoteProvenance(quoteIds: number[], language?: ContentLanguage) {
  if (quoteIds.length === 0) return new Map<number, { attributions: any[]; sources: any[] }>()

  const fetchAttributions = (ids: number[]) => db.select({
      id: schema.quoteAttributions.id,
      quoteId: schema.quoteAttributions.quoteId,
      authorId: schema.quoteAttributions.authorId,
      referenceId: schema.quoteAttributions.referenceId,
      isPrimary: schema.quoteAttributions.isPrimary,
      status: schema.quoteAttributions.status,
      verifiedBy: schema.quoteAttributions.verifiedBy,
      verifiedAt: schema.quoteAttributions.verifiedAt,
      notes: schema.quoteAttributions.notes,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      referenceImageUrl: schema.quoteReferences.imageUrl,
    })
      .from(schema.quoteAttributions)
      .leftJoin(schema.authors, eq(schema.quoteAttributions.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
      .where(inArray(schema.quoteAttributions.quoteId, ids))
      .all()
  const fetchSources = (ids: number[]) => db.select({
      id: schema.quoteSources.id,
      quoteId: schema.quoteSources.quoteId,
      attributionId: schema.quoteSources.attributionId,
      occurrenceId: schema.quoteSources.occurrenceId,
      sourceType: schema.quoteSources.sourceType,
      sourceUrl: schema.quoteSources.sourceUrl,
      label: schema.quoteSources.label,
      translatorName: schema.quoteSources.translatorName,
      verificationStatus: schema.quoteSources.verificationStatus,
      verifiedBy: schema.quoteSources.verifiedBy,
      verifiedAt: schema.quoteSources.verifiedAt,
      notes: schema.quoteSources.notes,
      isPrimary: schema.quoteSources.isPrimary,
    })
      .from(schema.quoteSources)
      .where(inArray(schema.quoteSources.quoteId, ids))
      .all()
  const attributions: Awaited<ReturnType<typeof fetchAttributions>> = []
  const sources: Awaited<ReturnType<typeof fetchSources>> = []
  for (const quoteIdBatch of chunkForD1Bindings(quoteIds)) {
    const [attributionBatch, sourceBatch] = await Promise.all([
      fetchAttributions(quoteIdBatch),
      fetchSources(quoteIdBatch),
    ])
    attributions.push(...attributionBatch)
    sources.push(...sourceBatch)
  }

  const referenceIds = [...new Set(attributions.map(item => item.referenceId).filter((id): id is number => id !== null))]
  const referenceRows = language && referenceIds.length
    ? [...new Map(attributions
      .filter(item => item.referenceId !== null)
      .map(item => [item.referenceId!, { id: item.referenceId!, name: item.referenceName }])).values()]
    : []
  const localizedReferences = language
    ? await localizeReferences(referenceRows, language)
    : referenceRows
  const referenceNameById = new Map(localizedReferences.map(row => [row.id, row.name]))

  const result = new Map<number, { attributions: any[]; sources: any[] }>()
  for (const quoteId of quoteIds) result.set(quoteId, { attributions: [], sources: [] })
  for (const attribution of attributions) {
    result.get(attribution.quoteId)!.attributions.push({
      id: attribution.id,
      quote_id: attribution.quoteId,
      author_id: attribution.authorId,
      reference_id: attribution.referenceId,
      is_primary: attribution.isPrimary,
      status: attribution.status,
      verified_by: attribution.verifiedBy,
      verified_at: toISOStringOrNull(attribution.verifiedAt),
      notes: attribution.notes,
      author: attribution.authorId ? { id: attribution.authorId, name: attribution.authorName, is_fictional: attribution.authorIsFictional, image_url: attribution.authorImageUrl } : undefined,
      reference: attribution.referenceId ? {
        id: attribution.referenceId,
        name: referenceNameById.get(attribution.referenceId) || attribution.referenceName,
        primary_type: attribution.referencePrimaryType,
        image_url: attribution.referenceImageUrl,
      } : undefined,
    })
  }
  for (const source of sources) {
    result.get(source.quoteId)!.sources.push({
      id: source.id,
      quote_id: source.quoteId,
      attribution_id: source.attributionId,
      occurrence_id: source.occurrenceId,
      source_type: source.sourceType,
      source_url: source.sourceUrl,
      label: source.label,
      translator_name: source.translatorName,
      verification_status: source.verificationStatus,
      verified_by: source.verifiedBy,
      verified_at: toISOStringOrNull(source.verifiedAt),
      notes: source.notes,
      is_primary: source.isPrimary,
    })
  }
  return result
}

export async function syncPrimaryAttribution(
  quoteId: number,
  authorId: number | null,
  referenceId: number | null,
  userId: number,
  status?: 'unverified' | 'manually_verified' | 'externally_verified' | 'disputed',
  notes?: string | null,
) {
  const existing = await db.select({ id: schema.quoteAttributions.id })
    .from(schema.quoteAttributions)
    .where(and(
      eq(schema.quoteAttributions.quoteId, quoteId),
      eq(schema.quoteAttributions.isPrimary, true),
    ))
    .get()

  const values = {
    authorId,
    referenceId,
    isPrimary: true,
    updatedAt: new Date(),
    ...(status ? {
      status,
      verifiedBy: status === 'unverified' ? null : userId,
      verifiedAt: status === 'unverified' ? null : new Date(),
    } : {}),
    ...(notes !== undefined ? { notes } : {}),
  }

  if (existing) {
    await db.update(schema.quoteAttributions)
      .set(values)
      .where(eq(schema.quoteAttributions.id, existing.id))
      .run()
    return existing.id
  }

  const created = await db.insert(schema.quoteAttributions)
    .values({ ...values, quoteId, createdBy: userId })
    .returning({ id: schema.quoteAttributions.id })
    .get()
  return created.id
}

export async function syncPrimarySource(
  quoteId: number,
  attributionId: number,
  sourceType: string | null | undefined,
  sourceUrl: string | null | undefined,
  userId: number,
  verificationStatus?: 'unverified' | 'manually_verified' | 'externally_verified' | 'disputed',
  label?: string | null,
  notes?: string | null,
) {
  if (!sourceType && !sourceUrl) return

  const existing = await db.select({ id: schema.quoteSources.id })
    .from(schema.quoteSources)
    .where(and(
      eq(schema.quoteSources.quoteId, quoteId),
      eq(schema.quoteSources.isPrimary, true),
    ))
    .get()

  const values = {
    attributionId,
    sourceType: sourceType || 'manual',
    sourceUrl: sourceUrl || null,
    isPrimary: true,
    updatedAt: new Date(),
    ...(verificationStatus ? { verificationStatus } : {}),
    ...(label !== undefined ? { label } : {}),
    ...(notes !== undefined ? { notes } : {}),
  }

  if (existing) {
    await db.update(schema.quoteSources)
      .set(values)
      .where(eq(schema.quoteSources.id, existing.id))
      .run()
    return existing.id
  }

  const created = await db.insert(schema.quoteSources)
    .values({ ...values, quoteId, createdBy: userId })
    .returning({ id: schema.quoteSources.id })
    .get()
  return created.id
}

export async function getQuoteProvenance(quoteId: number) {
  const [attributions, sources] = await Promise.all([
    db.select({
      id: schema.quoteAttributions.id,
      quoteId: schema.quoteAttributions.quoteId,
      authorId: schema.quoteAttributions.authorId,
      referenceId: schema.quoteAttributions.referenceId,
      isPrimary: schema.quoteAttributions.isPrimary,
      status: schema.quoteAttributions.status,
      verifiedBy: schema.quoteAttributions.verifiedBy,
      verifiedAt: schema.quoteAttributions.verifiedAt,
      notes: schema.quoteAttributions.notes,
      authorName: schema.authors.name,
      authorIsFictional: schema.authors.isFictional,
      authorImageUrl: schema.authors.imageUrl,
      referenceName: schema.quoteReferences.name,
      referencePrimaryType: schema.quoteReferences.primaryType,
      referenceImageUrl: schema.quoteReferences.imageUrl,
    })
      .from(schema.quoteAttributions)
      .leftJoin(schema.authors, eq(schema.quoteAttributions.authorId, schema.authors.id))
      .leftJoin(schema.quoteReferences, eq(schema.quoteAttributions.referenceId, schema.quoteReferences.id))
      .where(eq(schema.quoteAttributions.quoteId, quoteId))
      .all(),
    db.select({
      id: schema.quoteSources.id,
      quoteId: schema.quoteSources.quoteId,
      attributionId: schema.quoteSources.attributionId,
      occurrenceId: schema.quoteSources.occurrenceId,
      sourceType: schema.quoteSources.sourceType,
      sourceUrl: schema.quoteSources.sourceUrl,
      label: schema.quoteSources.label,
      translatorName: schema.quoteSources.translatorName,
      verificationStatus: schema.quoteSources.verificationStatus,
      verifiedBy: schema.quoteSources.verifiedBy,
      verifiedAt: schema.quoteSources.verifiedAt,
      notes: schema.quoteSources.notes,
      isPrimary: schema.quoteSources.isPrimary,
    })
      .from(schema.quoteSources)
      .where(eq(schema.quoteSources.quoteId, quoteId))
      .all(),
  ])

  return {
    attributions: attributions.map(attribution => ({
      id: attribution.id,
      quote_id: attribution.quoteId,
      author_id: attribution.authorId,
      reference_id: attribution.referenceId,
      is_primary: attribution.isPrimary,
      status: attribution.status,
      verified_by: attribution.verifiedBy,
      verified_at: toISOStringOrNull(attribution.verifiedAt),
      notes: attribution.notes,
      author: attribution.authorId ? { id: attribution.authorId, name: attribution.authorName, is_fictional: attribution.authorIsFictional, image_url: attribution.authorImageUrl } : undefined,
      reference: attribution.referenceId ? { id: attribution.referenceId, name: attribution.referenceName, primary_type: attribution.referencePrimaryType, image_url: attribution.referenceImageUrl } : undefined,
    })),
    sources: sources.map(source => ({
      id: source.id,
      quote_id: source.quoteId,
      attribution_id: source.attributionId,
      occurrence_id: source.occurrenceId,
      source_type: source.sourceType,
      source_url: source.sourceUrl,
      label: source.label,
      translator_name: source.translatorName,
      verification_status: source.verificationStatus,
      verified_by: source.verifiedBy,
      verified_at: toISOStringOrNull(source.verifiedAt),
      notes: source.notes,
      is_primary: source.isPrimary,
    })),
  }
}
