import { db, schema } from 'hub:db'
import { and, eq } from 'drizzle-orm'

export async function syncPrimaryAttribution(
  quoteId: number,
  authorId: number | null,
  referenceId: number | null,
  userId: number,
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
      referenceName: schema.quoteReferences.name,
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
      sourceType: schema.quoteSources.sourceType,
      sourceUrl: schema.quoteSources.sourceUrl,
      label: schema.quoteSources.label,
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
      verified_at: attribution.verifiedAt,
      notes: attribution.notes,
      author: attribution.authorId ? { id: attribution.authorId, name: attribution.authorName } : undefined,
      reference: attribution.referenceId ? { id: attribution.referenceId, name: attribution.referenceName } : undefined,
    })),
    sources: sources.map(source => ({
      id: source.id,
      quote_id: source.quoteId,
      attribution_id: source.attributionId,
      source_type: source.sourceType,
      source_url: source.sourceUrl,
      label: source.label,
      verification_status: source.verificationStatus,
      verified_by: source.verifiedBy,
      verified_at: source.verifiedAt,
      notes: source.notes,
      is_primary: source.isPrimary,
    })),
  }
}
