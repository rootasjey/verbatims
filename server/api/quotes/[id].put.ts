import { db, schema } from 'hub:db'
import { and, eq, ne, sql, isNull, inArray } from 'drizzle-orm'
import { toISOStringOrNull } from '../../utils/date-normalization'
import { updateQuoteSchema } from '../../validation/schemas'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'
import { runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { assertQuoteNameAvailable, buildQuoteInlineEditResolutionStatements, isQuoteNameConflictError, scopeQuoteCreationRequestKey } from '~~/server/utils/quote-creation'
import { requireAttributionForQuote, requireOccurrenceForAttribution } from '~~/server/utils/admin-quote-provenance'
import { chunkForD1Bindings } from '~~/server/utils/d1-parameter-batching'
import { buildPrimaryAttributionUpdate, isQuoteSourceSnapshotConflictError, orderQuoteSourceMutations, quoteSourceMatchesEdit, quoteSourceMatchesSnapshot, quoteSourceProofChanged, resolvePrimaryAttributionIds, shouldUpdateOnlyPrimaryAttribution } from '~~/server/utils/quote-edit-safety'

export default defineEventHandler(async (event) => {
  try {
    const { user } = await requireAuth(event)

    const quoteId = getRouterParam(event, 'id')
    if (!quoteId || isNaN(parseInt(quoteId))) {
      throwServer(400, 'Invalid quote ID')
    }

    const body = await readValidatedBody(event, updateQuoteSchema.parse)

    const existingQuote = await db.select().from(schema.quotes).where(eq(schema.quotes.id, parseInt(quoteId!))).get()
    if (!existingQuote) throwServer(404, 'Quote not found')
    const e = existingQuote

    const isAdmin = user.role === 'admin' || user.role === 'moderator'
    if (body.language !== undefined && !isAdmin) {
      throwServer(403, 'Only moderators and admins can change a quote language')
    }
    if ((body.source_type !== undefined || body.source_url !== undefined) && !isAdmin) {
      throwServer(403, 'Only moderators and admins can change quote provenance')
    }
    const isOwner = e.userId === user.id
    const isDraft = e.status === 'draft'

    if (!isAdmin && (!isOwner || !isDraft)) {
      throwServer(403, 'You can only edit your own draft quotes')
    }

    const currentProvenance = await getQuoteProvenance(e.id)
    const primaryAttribution = currentProvenance.attributions.find(item => item.is_primary) ?? currentProvenance.attributions[0]
    const replacementAttributions = body.attributions
    const replacementPrimary = replacementAttributions?.find(attribution => attribution.is_primary)
    const canUpdatePrimaryAttributionInPlace = shouldUpdateOnlyPrimaryAttribution(replacementAttributions?.length, Boolean(primaryAttribution))
    const { authorId, referenceId } = resolvePrimaryAttributionIds(replacementPrimary, {
      authorId: primaryAttribution?.author_id ?? null,
      referenceId: primaryAttribution?.reference_id ?? null,
    })

    if (authorId == null && referenceId == null && !body.new_author && !body.new_reference) {
      throwServer(400, 'A quote requires an author or reference')
    }

    const updateData: Record<string, unknown> = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.language !== undefined ? { language: body.language } : {}),
      updatedAt: new Date(),
    }

    const hasInlineEntity = Boolean(body.new_author?.name || body.new_reference?.name)

    const sourceMutationStatements: unknown[] = []
    const sourceDemotionStatements: unknown[] = []
    const sourcePromotionStatements: unknown[] = []
    const sourceDeletionStatements: unknown[] = []
    if (body.sources !== undefined) {
      if (!isAdmin) throwServer(403, 'Only moderators and admins can change quote sources')
      if (body.source_snapshot_ids === undefined || body.source_snapshot === undefined) throwServer(400, 'Source snapshot is required')
      const initialIds = new Set(body.source_snapshot_ids)
      const snapshotById = new Map(body.source_snapshot.map(source => [source.id, source]))
      if (snapshotById.size !== body.source_snapshot.length || snapshotById.size !== initialIds.size
        || [...initialIds].some(id => !snapshotById.has(id))) throwServer(400, 'Source snapshot IDs do not match the source snapshot')
      const requestedIds = body.sources.flatMap(source => source.id === undefined ? [] : [source.id])
      if (new Set(requestedIds).size !== requestedIds.length || requestedIds.some(id => !initialIds.has(id))) {
        throwServer(409, 'Quote sources changed while editing. Reload and try again.')
      }
      const currentSources = await db.select().from(schema.quoteSources).where(eq(schema.quoteSources.quoteId, e.id)).all()
      const currentById = new Map(currentSources.map(source => [source.id, source]))
      const snapshotConditionFor = (expected: NonNullable<typeof body.source_snapshot>[number]) => and(
        eq(schema.quoteSources.id, expected.id), eq(schema.quoteSources.quoteId, e.id),
        expected.attribution_id === null ? isNull(schema.quoteSources.attributionId) : eq(schema.quoteSources.attributionId, expected.attribution_id),
        expected.occurrence_id === null ? isNull(schema.quoteSources.occurrenceId) : eq(schema.quoteSources.occurrenceId, expected.occurrence_id),
        eq(schema.quoteSources.sourceType, expected.source_type),
        expected.source_medium === null ? isNull(schema.quoteSources.sourceMedium) : eq(schema.quoteSources.sourceMedium, expected.source_medium),
        expected.source_url === null ? isNull(schema.quoteSources.sourceUrl) : eq(schema.quoteSources.sourceUrl, expected.source_url),
        expected.label === null ? isNull(schema.quoteSources.label) : eq(schema.quoteSources.label, expected.label),
        expected.locator_type === null ? isNull(schema.quoteSources.locatorType) : eq(schema.quoteSources.locatorType, expected.locator_type),
        expected.locator_value === null ? isNull(schema.quoteSources.locatorValue) : eq(schema.quoteSources.locatorValue, expected.locator_value),
        expected.translator_name === null ? isNull(schema.quoteSources.translatorName) : eq(schema.quoteSources.translatorName, expected.translator_name),
        eq(schema.quoteSources.verificationStatus, expected.verification_status),
        expected.verified_by === null ? isNull(schema.quoteSources.verifiedBy) : eq(schema.quoteSources.verifiedBy, expected.verified_by),
        expected.verified_at === null ? isNull(schema.quoteSources.verifiedAt) : eq(schema.quoteSources.verifiedAt, new Date(expected.verified_at)),
        expected.notes === null ? isNull(schema.quoteSources.notes) : eq(schema.quoteSources.notes, expected.notes),
        eq(schema.quoteSources.isPrimary, expected.is_primary),
      )!
      for (const snapshotChunk of chunkForD1Bindings(body.source_snapshot, 16, 1)) {
        const missingSnapshotRow = sql`(${sql.join(snapshotChunk.map(expected => sql`NOT EXISTS (
          SELECT 1 FROM quote_sources WHERE ${snapshotConditionFor(expected)}
        )`), sql` OR `)})`
        sourceMutationStatements.push(db.update(schema.quoteEditorialAuditContext).set({
          source: sql`CASE WHEN ${missingSnapshotRow} THEN NULL ELSE ${schema.quoteEditorialAuditContext.source} END`,
        }).where(eq(schema.quoteEditorialAuditContext.id, 1)))
      }
      if (requestedIds.some(id => !currentById.has(id))) throwServer(409, 'A source changed while editing. Reload and try again.')
      for (const [id, snapshot] of snapshotById) {
        const current = currentById.get(id)
        if (!current || !quoteSourceMatchesSnapshot(current, snapshot)) throwServer(409, 'A source changed while editing. Reload and try again.')
      }
      const attributionIds = new Set(currentProvenance.attributions.map(attribution => attribution.id))
      const requestedPrimarySources = body.sources.filter(source => source.is_primary)
      if (requestedPrimarySources.length > 1) throwServer(400, 'Only one source can be primary')
      const snapshotPrimaryId = body.source_snapshot.find(source => source.is_primary)?.id
      const requestedPrimary = requestedPrimarySources[0]
      const primaryChanged = snapshotPrimaryId !== requestedPrimary?.id || Boolean(requestedPrimary && requestedPrimary.id === undefined)
      if (primaryChanged) {
        if (currentSources.some(source => !initialIds.has(source.id) && source.isPrimary)) {
          throwServer(409, 'A primary source was added while editing. Reload and try again.')
        }
      }
      for (const source of body.sources) {
        const existing = source.id === undefined ? undefined : currentById.get(source.id)
        const attributionId = existing
          ? source.attribution_id ?? null
          : source.attribution_id ?? primaryAttribution?.id ?? null
        if (attributionId !== null && !attributionIds.has(attributionId)) throwServer(409, 'A source attribution changed while editing. Reload and try again.')
        await requireAttributionForQuote(e.id, attributionId)
        await requireOccurrenceForAttribution(e.id, attributionId, source.occurrence_id)
        const values: Record<string, unknown> = {
          attributionId, occurrenceId: source.occurrence_id ?? null, sourceType: source.source_type,
          sourceMedium: source.source_medium ?? null, sourceUrl: source.source_url ?? null, label: source.label ?? null,
          locatorType: source.locator_type ?? null, locatorValue: source.locator_value ?? null,
          translatorName: source.translator_name ?? null, notes: source.notes ?? null,
          isPrimary: source.is_primary ?? false, updatedAt: new Date(),
        }
        const snapshot = source.id === undefined ? undefined : snapshotById.get(source.id)
        const editSnapshot = {
          attribution_id: attributionId, occurrence_id: source.occurrence_id ?? null, source_type: source.source_type,
          source_medium: source.source_medium ?? null, source_url: source.source_url ?? null, label: source.label ?? null,
          locator_type: source.locator_type ?? null, locator_value: source.locator_value ?? null,
          translator_name: source.translator_name ?? null, verification_status: source.verification_status ?? 'unverified',
          verified_by: null, verified_at: null, notes: source.notes ?? null, is_primary: source.is_primary ?? false,
        }
        const proofChanged = Boolean(existing && snapshot && quoteSourceProofChanged(existing, editSnapshot))
        if (existing && proofChanged) {
          values.verificationStatus = 'unverified'
          values.verifiedBy = null
          values.verifiedAt = null
        } else if (source.verification_status !== undefined) {
          values.verificationStatus = source.verification_status
          values.verifiedBy = source.verification_status === 'unverified' ? null : user.id
          values.verifiedAt = source.verification_status === 'unverified' ? null : new Date()
        }
        if (source.id !== undefined) {
          if (!quoteSourceMatchesEdit(existing!, editSnapshot) || proofChanged || source.verification_status !== undefined) {
            const expected = snapshot!
            const snapshotCondition = snapshotConditionFor(expected)
            const statement = db.update(schema.quoteSources).set({
              ...values,
              sourceType: sql`CASE WHEN ${snapshotCondition} THEN ${source.source_type} ELSE NULL END`,
            } as any).where(and(eq(schema.quoteSources.id, source.id), eq(schema.quoteSources.quoteId, e.id)))
            if (source.is_primary) sourcePromotionStatements.push(statement)
            else sourceDemotionStatements.push(statement)
          }
        } else {
          const statement = db.insert(schema.quoteSources).values({ ...values, quoteId: e.id, createdBy: user.id } as any)
          if (source.is_primary) sourcePromotionStatements.push(statement)
          else sourceDemotionStatements.push(statement)
        }
      }
      const deleteIds = (body.delete_source_ids ?? []).filter(id => initialIds.has(id) && currentById.has(id))
      if (deleteIds.some(id => requestedIds.includes(id))) throwServer(400, 'A source cannot be updated and deleted together')
      for (const deleteChunk of chunkForD1Bindings(deleteIds, 1, 1)) {
        sourceDeletionStatements.push(db.delete(schema.quoteSources).where(and(
          eq(schema.quoteSources.quoteId, e.id),
          inArray(schema.quoteSources.id, deleteChunk),
        )))
      }
      sourceMutationStatements.push(...orderQuoteSourceMutations(sourceDemotionStatements, sourceDeletionStatements, sourcePromotionStatements))
    }
    if (body.name !== undefined && body.name.trim().toLowerCase() !== e.name.trim().toLowerCase()) {
      await assertQuoteNameAvailable(e.id, body.name)
    }

    if (hasInlineEntity) {
      const resolution = buildQuoteInlineEditResolutionStatements({
        requestKey: scopeQuoteCreationRequestKey(`quote-edit:${crypto.randomUUID()}`, user.id),
        userId: user.id,
        quoteId: e.id,
        authorId,
        referenceId,
        newAuthor: body.new_author ? {
          name: body.new_author.name,
          isFictional: body.new_author.is_fictional,
        } : undefined,
        newReference: body.new_reference ? {
          name: body.new_reference.name,
          originalLanguage: body.new_reference.original_language || body.language || 'en',
          primaryType: body.new_reference.primary_type || 'other',
        } : undefined,
      })
      const statements: unknown[] = [
        ...resolution.statements,
        db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, e.id)),
      ]

      if (replacementAttributions) {
        const resolvedAttributions = replacementAttributions.map(attribution => attribution.is_primary ? {
          ...attribution,
          author_id: resolution.authorId,
          reference_id: resolution.referenceId,
        } : {
          ...attribution,
          author_id: attribution.author_id ?? null,
          reference_id: attribution.reference_id ?? null,
        })
        if (canUpdatePrimaryAttributionInPlace && primaryAttribution) {
          const attribution = resolvedAttributions[0]!
          statements.push(db.update(schema.quoteAttributions).set(buildPrimaryAttributionUpdate({ authorId: primaryAttribution.author_id, referenceId: primaryAttribution.reference_id, status: primaryAttribution.status }, attribution, attribution.author_id, attribution.reference_id, user.id, isAdmin) as any).where(eq(schema.quoteAttributions.id, primaryAttribution.id)))
          statements.push(resolution.setPrimaryAttributionId(primaryAttribution.id))
        } else {
          statements.push(db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.quoteId, e.id)))
          statements.push(db.insert(schema.quoteAttributions).values(resolvedAttributions.map(attribution => ({
            quoteId: e.id,
            authorId: attribution.author_id,
            referenceId: attribution.reference_id,
            isPrimary: attribution.is_primary,
            status: isAdmin ? attribution.status ?? 'unverified' : 'unverified',
            verifiedBy: isAdmin && attribution.status && attribution.status !== 'unverified' ? user.id : null,
            verifiedAt: isAdmin && attribution.status && attribution.status !== 'unverified' ? new Date() : null,
            notes: attribution.notes,
            createdBy: user.id,
          }))))
          statements.push(resolution.setPrimaryAttributionId(sql`(
            SELECT id FROM quote_attributions WHERE quote_id = ${e.id} AND is_primary = true ORDER BY id LIMIT 1
          )`))
        }
      } else if (primaryAttribution) {
        statements.push(db.update(schema.quoteAttributions)
          .set(buildPrimaryAttributionUpdate({ authorId: primaryAttribution.author_id, referenceId: primaryAttribution.reference_id, status: primaryAttribution.status }, {}, resolution.authorId, resolution.referenceId, user.id, isAdmin) as any)
          .where(eq(schema.quoteAttributions.id, primaryAttribution.id)))
        statements.push(resolution.setPrimaryAttributionId(primaryAttribution.id))
      } else {
        statements.push(db.insert(schema.quoteAttributions).values({
          quoteId: e.id,
          authorId: resolution.authorId,
          referenceId: resolution.referenceId,
          isPrimary: true,
          status: 'unverified',
          createdBy: user.id,
        }))
        statements.push(resolution.setPrimaryAttributionId(sql`last_insert_rowid()`))
      }

      if (body.sources === undefined && (body.source_type !== undefined || body.source_url !== undefined)) {
        if (body.source_type || body.source_url) {
          const sourceType = body.source_type || 'manual'
          const sourceUrl = body.source_url || null
          statements.push(db.run(sql`UPDATE quote_sources
            SET attribution_id = ${resolution.primaryAttributionId},
                source_type = ${sourceType}, source_url = ${sourceUrl}, updated_at = CURRENT_TIMESTAMP
            WHERE quote_id = ${e.id} AND is_primary = true`))
          statements.push(db.run(sql`INSERT INTO quote_sources
            (quote_id, attribution_id, source_type, source_url, is_primary, created_by)
            SELECT ${e.id}, ${resolution.primaryAttributionId}, ${sourceType}, ${sourceUrl}, true, ${user.id}
            WHERE NOT EXISTS (
              SELECT 1 FROM quote_sources WHERE quote_id = ${e.id} AND is_primary = true
            )`))
        } else {
          statements.push(db.delete(schema.quoteSources)
            .where(and(eq(schema.quoteSources.quoteId, e.id), eq(schema.quoteSources.isPrimary, true))))
        }
      }

      statements.push(...sourceMutationStatements)
      statements.push(resolution.cleanup)
      try {
        await runWebEditorialAuditedBatch(event, user.id, statements, 'web_user')
      } catch (error) {
        if (isQuoteSourceSnapshotConflictError(error)) throwServer(409, 'Quote sources changed while editing. Reload and try again.')
        if (isQuoteNameConflictError(error)) throwServer(409, 'A similar quote already exists')
        throw error
      }
    } else if (replacementAttributions) {
      try {
        const statements: unknown[] = [db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, e.id))]
        const resolvedAttributions = replacementAttributions.map(attribution => attribution.is_primary
          ? { ...attribution, author_id: authorId, reference_id: referenceId }
          : { ...attribution, author_id: attribution.author_id ?? null, reference_id: attribution.reference_id ?? null })
        if (canUpdatePrimaryAttributionInPlace && primaryAttribution) {
          const attribution = resolvedAttributions[0]!
          statements.push(db.update(schema.quoteAttributions).set(buildPrimaryAttributionUpdate({ authorId: primaryAttribution.author_id, referenceId: primaryAttribution.reference_id, status: primaryAttribution.status }, attribution, attribution.author_id, attribution.reference_id, user.id, isAdmin) as any).where(eq(schema.quoteAttributions.id, primaryAttribution.id)))
        } else {
          statements.push(db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.quoteId, e.id)))
          statements.push(db.insert(schema.quoteAttributions).values(resolvedAttributions.map(attribution => ({
            quoteId: e.id,
            authorId: attribution.author_id,
            referenceId: attribution.reference_id,
            isPrimary: attribution.is_primary,
            status: isAdmin ? attribution.status ?? 'unverified' : 'unverified',
            verifiedBy: isAdmin && attribution.status && attribution.status !== 'unverified' ? user.id : null,
            verifiedAt: isAdmin && attribution.status && attribution.status !== 'unverified' ? new Date() : null,
            notes: attribution.notes,
            createdBy: user.id,
          }))))
        }
        statements.push(...sourceMutationStatements)
        await runWebEditorialAuditedBatch(event, user.id, statements as any, 'web_user')
      } catch (error) {
        if (isQuoteSourceSnapshotConflictError(error)) throwServer(409, 'Quote sources changed while editing. Reload and try again.')
        if (isQuoteNameConflictError(error)) throwServer(409, 'A similar quote already exists')
        throw error
      }
    } else {
      const statements: unknown[] = [db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, parseInt(quoteId!)))]
      if (primaryAttribution) {
        statements.push(db.update(schema.quoteAttributions).set({ authorId, referenceId, updatedAt: new Date() }).where(eq(schema.quoteAttributions.id, primaryAttribution.id)))
      } else {
        statements.push(db.insert(schema.quoteAttributions).values({ quoteId: e.id, authorId, referenceId, isPrimary: true, status: 'unverified', createdBy: user.id }))
      }
      statements.push(...sourceMutationStatements)
      try {
        await runWebEditorialAuditedBatch(event, user.id, statements, 'web_user')
      } catch (error) {
        if (isQuoteSourceSnapshotConflictError(error)) throwServer(409, 'Quote sources changed while editing. Reload and try again.')
        if (isQuoteNameConflictError(error)) throwServer(409, 'A similar quote already exists')
        throw error
      }
    }

    if (body.sources === undefined && !hasInlineEntity && (body.source_type !== undefined || body.source_url !== undefined)) {
      const primaryAttributionId = await db.select({ id: schema.quoteAttributions.id })
        .from(schema.quoteAttributions)
        .where(and(
          eq(schema.quoteAttributions.quoteId, e.id),
          eq(schema.quoteAttributions.isPrimary, true),
        ))
        .get()

      if (!primaryAttributionId) throwServer(400, 'A quote requires a primary attribution to record provenance')

      if (body.source_type || body.source_url) {
        const existingSource = await db.select({ id: schema.quoteSources.id }).from(schema.quoteSources).where(and(eq(schema.quoteSources.quoteId, e.id), eq(schema.quoteSources.isPrimary, true))).get()
        const values = { attributionId: primaryAttributionId.id, sourceType: body.source_type || 'manual', sourceUrl: body.source_url || null, isPrimary: true, updatedAt: new Date() }
        await runWebEditorialAuditedBatch(event, user.id, [existingSource
          ? db.update(schema.quoteSources).set(values).where(eq(schema.quoteSources.id, existingSource.id))
          : db.insert(schema.quoteSources).values({ ...values, quoteId: e.id, createdBy: user.id })], 'web_user')
      } else {
        await runWebEditorialAuditedBatch(event, user.id, [db.delete(schema.quoteSources)
          .where(and(
            eq(schema.quoteSources.quoteId, e.id),
            eq(schema.quoteSources.isPrimary, true),
          ))], 'web_user')
      }
    }

    // Fetch the updated quote with all related data
    const updatedQuote = await db.select({
      id: schema.quotes.id,
      name: schema.quotes.name,
      language: schema.quotes.language,
      userId: schema.quotes.userId,
      status: schema.quotes.status,
      moderatorId: schema.quotes.moderatorId,
      moderatedAt: schema.quotes.moderatedAt,
      rejectionReason: schema.quotes.rejectionReason,
      viewsCount: schema.quotes.viewsCount,
      likesCount: schema.quotes.likesCount,
      sharesCount: schema.quotes.sharesCount,
      isFeatured: schema.quotes.isFeatured,
      createdAt: schema.quotes.createdAt,
      updatedAt: schema.quotes.updatedAt,
      userName: schema.users.name
    })
    .from(schema.quotes)
    .leftJoin(schema.users, eq(schema.quotes.userId, schema.users.id))
    .where(eq(schema.quotes.id, parseInt(quoteId!)))
    .get()

    if (!updatedQuote) {
      throwServer(500, 'Failed to fetch updated quote')
    }
    const u = updatedQuote!

    // Fetch tags for the quote
    const tags = await db.select({
      id: schema.tags.id,
      name: schema.tags.name,
      color: schema.tags.color
    })
    .from(schema.tags)
    .innerJoin(schema.quoteTags, eq(schema.tags.id, schema.quoteTags.tagId))
    .where(eq(schema.quoteTags.quoteId, parseInt(quoteId!)))
    .all()

    const transformedQuote: QuoteWithMetadata = {
      id: u.id,
      name: u.name,
      language: u.language!,
      user_id: u.userId,
      status: u.status as QuoteStatus,
      moderator_id: u.moderatorId ?? undefined,
      moderated_at: toISOStringOrNull(u.moderatedAt) ?? undefined,
      rejection_reason: u.rejectionReason ?? undefined,
      views_count: u.viewsCount ?? 0,
      likes_count: u.likesCount ?? 0,
      shares_count: u.sharesCount ?? 0,
      is_featured: u.isFeatured ?? false,
      created_at: toISOStringOrNull(u.createdAt) || '',
      updated_at: toISOStringOrNull(u.updatedAt) || '',
      user: {
        id: u.userId,
        name: u.userName || ''
      },
      tags: tags.map(t => ({
        id: t.id,
        name: t.name,
        color: t.color || 'gray'
      })),
      ...((await getQuoteProvenance(u.id)) as any),
    }

    return {
      success: true,
      data: transformedQuote,
      message: 'Quote updated successfully'
    }

  } catch (error: any) {
    console.error('Error updating quote:', error)
    
    if ((error as any).statusCode) {
      throw error
    }
    
    throwServer(500, 'Internal server error')
  }
})
