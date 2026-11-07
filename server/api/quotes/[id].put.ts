import { db, schema } from 'hub:db'
import { and, eq, sql } from 'drizzle-orm'
import { toISOStringOrNull } from '../../utils/date-normalization'
import { updateQuoteSchema } from '../../validation/schemas'
import { getQuoteProvenance } from '~~/server/utils/quote-provenance'
import { runWebEditorialAuditedBatch } from '~~/server/utils/api-editorial-audit'
import { assertQuoteNameAvailable, buildQuoteInlineEditResolutionStatements, isQuoteNameConflictError, scopeQuoteCreationRequestKey } from '~~/server/utils/quote-creation'

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
    let authorId = replacementPrimary?.author_id ?? primaryAttribution?.author_id ?? null
    let referenceId = replacementPrimary?.reference_id ?? primaryAttribution?.reference_id ?? null

    if (authorId == null && referenceId == null && !body.new_author && !body.new_reference) {
      throwServer(400, 'A quote requires an author or reference')
    }

    const updateData: Record<string, unknown> = {
      ...(body.name !== undefined ? { name: body.name } : {}),
      ...(body.language !== undefined ? { language: body.language } : {}),
      updatedAt: new Date(),
    }

    const hasInlineEntity = Boolean(body.new_author?.name || body.new_reference?.name)
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
        } : attribution)
        statements.push(db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.quoteId, e.id)))
        statements.push(db.insert(schema.quoteAttributions).values(resolvedAttributions.map(attribution => ({
          quoteId: e.id,
          authorId: attribution.author_id,
          referenceId: attribution.reference_id,
          isPrimary: attribution.is_primary,
          status: isAdmin ? attribution.status : 'unverified',
          notes: attribution.notes,
          createdBy: user.id,
        }))))
        statements.push(resolution.setPrimaryAttributionId(sql`(
          SELECT id FROM quote_attributions WHERE quote_id = ${e.id} AND is_primary = true ORDER BY id LIMIT 1
        )`))
      } else if (primaryAttribution) {
        statements.push(db.update(schema.quoteAttributions)
          .set({ authorId: resolution.authorId, referenceId: resolution.referenceId, updatedAt: new Date() })
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

      if (body.source_type !== undefined || body.source_url !== undefined) {
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

      statements.push(resolution.cleanup)
      try {
        await runWebEditorialAuditedBatch(event, user.id, statements, 'web_user')
      } catch (error) {
        if (isQuoteNameConflictError(error)) throwServer(409, 'A similar quote already exists')
        throw error
      }
    } else if (replacementAttributions) {
      try {
        await runWebEditorialAuditedBatch(event, user.id, [
        db.update(schema.quotes).set(updateData as any).where(eq(schema.quotes.id, parseInt(quoteId!))),
        db.delete(schema.quoteAttributions).where(eq(schema.quoteAttributions.quoteId, e.id)),
        db.insert(schema.quoteAttributions).values(replacementAttributions.map(attribution => ({
          quoteId: e.id,
          authorId: attribution.author_id,
          referenceId: attribution.reference_id,
          isPrimary: attribution.is_primary,
          status: isAdmin ? attribution.status : 'unverified',
          notes: attribution.notes,
          createdBy: user.id,
        }))),
        ] as any, 'web_user')
      } catch (error) {
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
      try {
        await runWebEditorialAuditedBatch(event, user.id, statements, 'web_user')
      } catch (error) {
        if (isQuoteNameConflictError(error)) throwServer(409, 'A similar quote already exists')
        throw error
      }
    }

    if (!hasInlineEntity && (body.source_type !== undefined || body.source_url !== undefined)) {
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
