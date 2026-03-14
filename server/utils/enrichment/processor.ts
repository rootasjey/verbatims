import { db, schema } from 'hub:db'
import { and, asc, desc, eq, lte } from 'drizzle-orm'
import type { EntityEnrichmentPreview, EnrichmentProposalField } from '#shared/types/enrichment'
import { buildAuthorEnrichmentPreview, buildReferenceEnrichmentPreview } from './wikidata'
import { getEnrichmentPolicy, scheduleVerificationJobs } from './scheduler'
import { resolveEnrichmentConfig } from './config'

interface ProcessOptions {
  limit?: number
  entityType?: 'author' | 'reference'
  entityId?: number
}

export async function processEnrichmentJobs(options: ProcessOptions = {}) {
  const limit = Math.max(1, Math.min(options.limit || 3, 20))
  const claimedJobs = options.entityType && options.entityId
    ? await claimEntityJobs(options.entityType, options.entityId, limit)
    : await claimQueuedJobs(limit)

  const results = [] as Array<{ id: number, entityType: string, entityId: number, status: string, summary: string }>

  for (const job of claimedJobs) {
    try {
      if (job.entityType === 'author') {
        const author = await db.select()
          .from(schema.authors)
          .where(eq(schema.authors.id, job.entityId))
          .get()

        if (!author) {
          await failJob(job.id, job.entityType, job.entityId, 'Author not found.')
          results.push({ id: job.id, entityType: job.entityType, entityId: job.entityId, status: 'failed', summary: 'author not found' })
          continue
        }

        const preview = await buildAuthorEnrichmentPreview(author)
        await completeEnrichmentJob(job.id, job.entityType, author.id, preview)
        results.push({
          id: job.id,
          entityType: 'author',
          entityId: author.id,
          status: 'completed',
          summary: `${preview.summary.proposed_count} proposal(s) generated`,
        })
        continue
      }

      if (job.entityType === 'reference') {
        const reference = await db.select()
          .from(schema.quoteReferences)
          .where(eq(schema.quoteReferences.id, job.entityId))
          .get()

        if (!reference) {
          await failJob(job.id, job.entityType, job.entityId, 'Reference not found.')
          results.push({ id: job.id, entityType: job.entityType, entityId: job.entityId, status: 'failed', summary: 'reference not found' })
          continue
        }

        const preview = await buildReferenceEnrichmentPreview(reference)
        await completeEnrichmentJob(job.id, job.entityType, reference.id, preview)
        results.push({
          id: job.id,
          entityType: 'reference',
          entityId: reference.id,
          status: 'completed',
          summary: `${preview.summary.proposed_count} proposal(s) generated`,
        })
        continue
      }

      await failJob(job.id, job.entityType, job.entityId, 'Unsupported enrichment entity type.')
      results.push({
        id: job.id,
        entityType: job.entityType,
        entityId: job.entityId,
        status: 'failed',
        summary: 'unsupported entity type',
      })
    } catch (error: any) {
      console.error('Failed to process enrichment job:', error)
      await failJob(job.id, job.entityType, job.entityId, error?.message || 'Unexpected enrichment failure')
      results.push({ id: job.id, entityType: job.entityType, entityId: job.entityId, status: 'failed', summary: error?.message || 'unexpected error' })
    }
  }

  return {
    success: true,
    processed: results.length,
    results,
  }
}

export async function previewAuthorEnrichment(authorId: number, createdBy?: number | null) {
  await scheduleVerificationJobs({
    entityTypes: ['author'],
    entityIdsByType: { author: [authorId] },
    triggeredBy: 'manual',
    createdBy: createdBy ?? null,
    reason: 'manual',
  })

  await processEnrichmentJobs({ entityType: 'author', entityId: authorId, limit: 1 })

  return await getLatestAuthorJob(authorId)
}

export async function previewReferenceEnrichment(referenceId: number, createdBy?: number | null) {
  await scheduleVerificationJobs({
    entityTypes: ['reference'],
    entityIdsByType: { reference: [referenceId] },
    triggeredBy: 'manual',
    createdBy: createdBy ?? null,
    reason: 'manual',
  })

  await processEnrichmentJobs({ entityType: 'reference', entityId: referenceId, limit: 1 })

  return await getLatestReferenceJob(referenceId)
}

export async function applyAuthorEnrichmentJob(jobId: number, fields?: EnrichmentProposalField[], actedBy?: number | null) {
  return await applyEnrichmentJob(jobId, fields, actedBy)
}

export async function applyEnrichmentJob(jobId: number, fields?: EnrichmentProposalField[], actedBy?: number | null) {
  const job = await db.select()
    .from(schema.entityEnrichmentJobs)
    .where(eq(schema.entityEnrichmentJobs.id, jobId))
    .get()

  if (!job) {
    throw new Error('Enrichment job not found')
  }

  if (!job.resultPayload) {
    throw new Error('This enrichment job does not contain any preview payload')
  }

  if (job.entityType === 'author') {
    return await applyAuthorJob(job, fields, actedBy)
  }

  if (job.entityType === 'reference') {
    return await applyReferenceJob(job, fields, actedBy)
  }

  throw new Error('Unsupported enrichment job type')
}

async function applyAuthorJob(
  job: typeof schema.entityEnrichmentJobs.$inferSelect,
  fields?: EnrichmentProposalField[],
  actedBy?: number | null,
) {
  const preview = JSON.parse(job.resultPayload || 'null') as EntityEnrichmentPreview
  if (preview?.entity_type !== 'author') {
    throw new Error('This enrichment preview is not an author preview')
  }

  const selectedFields = new Set((fields && fields.length > 0 ? fields : preview.proposals.map(proposal => proposal.field)))
  const proposalRows = await db.select()
    .from(schema.entityEnrichmentFieldProposals)
    .where(eq(schema.entityEnrichmentFieldProposals.jobId, job.id))

  const proposals = proposalRows.filter(proposal => selectedFields.has(proposal.fieldName as EnrichmentProposalField))

  if (proposals.length === 0) {
    throw new Error('No enrichment field selected')
  }

  const author = await db.select()
    .from(schema.authors)
    .where(eq(schema.authors.id, job.entityId))
    .get()

  if (!author) {
    throw new Error('Author not found')
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  }

  for (const proposal of proposals) {
    if (!proposal.proposedValue) continue

    if (proposal.fieldName === 'birth_date') updateData.birthDate = proposal.proposedValue
    if (proposal.fieldName === 'birth_location') updateData.birthLocation = proposal.proposedValue
    if (proposal.fieldName === 'death_date') updateData.deathDate = proposal.proposedValue
    if (proposal.fieldName === 'death_location') updateData.deathLocation = proposal.proposedValue
    if (proposal.fieldName === 'job') updateData.job = proposal.proposedValue
    if (proposal.fieldName === 'description') updateData.description = proposal.proposedValue
    if (proposal.fieldName === 'image_url') updateData.imageUrl = proposal.proposedValue
    if (proposal.fieldName === 'socials') updateData.socials = proposal.proposedValue
  }

  await db.update(schema.authors)
    .set(updateData)
    .where(eq(schema.authors.id, job.entityId))
    .run()

  const now = new Date()
  const nextCheckAt = await computeNextCheckAt('author')

  await db.update(schema.entityEnrichmentJobs)
    .set({
      appliedAt: now,
      updatedAt: now,
      resultSummary: `${proposals.length} field(s) applied`,
    })
    .where(eq(schema.entityEnrichmentJobs.id, job.id))
    .run()

  for (const proposal of proposals) {
    await db.update(schema.entityEnrichmentFieldProposals)
      .set({
        decisionStatus: 'applied',
        decidedBy: actedBy ?? null,
        decidedAt: now,
        appliedBy: actedBy ?? null,
        appliedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.entityEnrichmentFieldProposals.id, proposal.id))
      .run()

    const previousValue = readAuthorFieldValue(author, proposal.fieldName)
    await db.insert(schema.entityFieldChangeHistory)
      .values({
        entityType: 'author',
        entityId: author.id,
        fieldName: proposal.fieldName,
        previousValue,
        newValue: proposal.proposedValue,
        changeOrigin: 'enrichment_review',
        jobId: job.id,
        proposalId: proposal.id,
        changedBy: actedBy ?? null,
      })
      .run()
  }

  await db.insert(schema.entityVerificationState)
    .values({
      entityType: 'author',
      entityId: job.entityId,
      verificationStatus: 'verified',
      lastVerifiedAt: now,
      nextCheckAt,
      lastSuccessfulJobId: job.id,
      lastSource: preview.match?.source || null,
      lastExternalId: preview.match?.external_id || null,
      lastConfidenceScore: preview.match?.score || null,
      reviewRequired: false,
      lastError: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.entityVerificationState.entityType, schema.entityVerificationState.entityId],
      set: {
        verificationStatus: 'verified',
        lastVerifiedAt: now,
        nextCheckAt,
        lastSuccessfulJobId: job.id,
        lastSource: preview.match?.source || null,
        lastExternalId: preview.match?.external_id || null,
        lastConfidenceScore: preview.match?.score || null,
        reviewRequired: false,
        lastError: null,
        updatedAt: now,
      }
    })
    .run()

  return {
    success: true,
    appliedFields: proposals.map(proposal => proposal.fieldName),
    jobId: job.id,
  }
}

async function applyReferenceJob(
  job: typeof schema.entityEnrichmentJobs.$inferSelect,
  fields?: EnrichmentProposalField[],
  actedBy?: number | null,
) {
  const preview = JSON.parse(job.resultPayload || 'null') as EntityEnrichmentPreview
  if (preview?.entity_type !== 'reference') {
    throw new Error('This enrichment preview is not a reference preview')
  }

  const selectedFields = new Set((fields && fields.length > 0 ? fields : preview.proposals.map(proposal => proposal.field)))
  const proposalRows = await db.select()
    .from(schema.entityEnrichmentFieldProposals)
    .where(eq(schema.entityEnrichmentFieldProposals.jobId, job.id))

  const proposals = proposalRows.filter(proposal => selectedFields.has(proposal.fieldName as EnrichmentProposalField))
  if (proposals.length === 0) {
    throw new Error('No enrichment field selected')
  }

  const reference = await db.select()
    .from(schema.quoteReferences)
    .where(eq(schema.quoteReferences.id, job.entityId))
    .get()

  if (!reference) {
    throw new Error('Reference not found')
  }

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
  }

  for (const proposal of proposals) {
    if (!proposal.proposedValue) continue

    if (proposal.fieldName === 'release_date') updateData.releaseDate = proposal.proposedValue
    if (proposal.fieldName === 'description') updateData.description = proposal.proposedValue
    if (proposal.fieldName === 'image_url') updateData.imageUrl = proposal.proposedValue
    if (proposal.fieldName === 'urls') updateData.urls = proposal.proposedValue
  }

  await db.update(schema.quoteReferences)
    .set(updateData)
    .where(eq(schema.quoteReferences.id, job.entityId))
    .run()

  const now = new Date()
  const nextCheckAt = await computeNextCheckAt('reference')

  await db.update(schema.entityEnrichmentJobs)
    .set({
      appliedAt: now,
      updatedAt: now,
      resultSummary: `${proposals.length} field(s) applied`,
    })
    .where(eq(schema.entityEnrichmentJobs.id, job.id))
    .run()

  for (const proposal of proposals) {
    await db.update(schema.entityEnrichmentFieldProposals)
      .set({
        decisionStatus: 'applied',
        decidedBy: actedBy ?? null,
        decidedAt: now,
        appliedBy: actedBy ?? null,
        appliedAt: now,
        updatedAt: now,
      })
      .where(eq(schema.entityEnrichmentFieldProposals.id, proposal.id))
      .run()

    const previousValue = readReferenceFieldValue(reference, proposal.fieldName)
    await db.insert(schema.entityFieldChangeHistory)
      .values({
        entityType: 'reference',
        entityId: reference.id,
        fieldName: proposal.fieldName,
        previousValue,
        newValue: proposal.proposedValue,
        changeOrigin: 'enrichment_review',
        jobId: job.id,
        proposalId: proposal.id,
        changedBy: actedBy ?? null,
      })
      .run()
  }

  await db.insert(schema.entityVerificationState)
    .values({
      entityType: 'reference',
      entityId: job.entityId,
      verificationStatus: 'verified',
      lastVerifiedAt: now,
      nextCheckAt,
      lastSuccessfulJobId: job.id,
      lastSource: preview.match?.source || null,
      lastExternalId: preview.match?.external_id || null,
      lastConfidenceScore: preview.match?.score || null,
      reviewRequired: false,
      lastError: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.entityVerificationState.entityType, schema.entityVerificationState.entityId],
      set: {
        verificationStatus: 'verified',
        lastVerifiedAt: now,
        nextCheckAt,
        lastSuccessfulJobId: job.id,
        lastSource: preview.match?.source || null,
        lastExternalId: preview.match?.external_id || null,
        lastConfidenceScore: preview.match?.score || null,
        reviewRequired: false,
        lastError: null,
        updatedAt: now,
      }
    })
    .run()

  return {
    success: true,
    appliedFields: proposals.map(proposal => proposal.fieldName),
    jobId: job.id,
  }
}

export async function getLatestAuthorJob(authorId: number) {
  return await db.select()
    .from(schema.entityEnrichmentJobs)
    .where(and(
      eq(schema.entityEnrichmentJobs.entityType, 'author'),
      eq(schema.entityEnrichmentJobs.entityId, authorId),
    ))
    .orderBy(desc(schema.entityEnrichmentJobs.createdAt), desc(schema.entityEnrichmentJobs.id))
    .get()
}

export async function getLatestReferenceJob(referenceId: number) {
  return await db.select()
    .from(schema.entityEnrichmentJobs)
    .where(and(
      eq(schema.entityEnrichmentJobs.entityType, 'reference'),
      eq(schema.entityEnrichmentJobs.entityId, referenceId),
    ))
    .orderBy(desc(schema.entityEnrichmentJobs.createdAt), desc(schema.entityEnrichmentJobs.id))
    .get()
}

async function claimQueuedJobs(limit: number) {
  const rows = await db.select()
    .from(schema.entityEnrichmentJobs)
    .where(and(
      eq(schema.entityEnrichmentJobs.status, 'queued'),
      lte(schema.entityEnrichmentJobs.scheduledFor, new Date()),
    ))
    .orderBy(desc(schema.entityEnrichmentJobs.priority), asc(schema.entityEnrichmentJobs.createdAt), asc(schema.entityEnrichmentJobs.id))
    .limit(limit)

  return await claimRows(rows)
}

async function claimEntityJobs(entityType: 'author' | 'reference', entityId: number, limit: number) {
  const rows = await db.select()
    .from(schema.entityEnrichmentJobs)
    .where(and(
      eq(schema.entityEnrichmentJobs.entityType, entityType),
      eq(schema.entityEnrichmentJobs.entityId, entityId),
      eq(schema.entityEnrichmentJobs.status, 'queued'),
    ))
    .orderBy(desc(schema.entityEnrichmentJobs.priority), asc(schema.entityEnrichmentJobs.createdAt), asc(schema.entityEnrichmentJobs.id))
    .limit(limit)

  return await claimRows(rows)
}

async function claimRows(rows: typeof schema.entityEnrichmentJobs.$inferSelect[]) {
  const claimed: typeof rows = []
  const now = new Date()

  for (const row of rows) {
    const updated = await db.update(schema.entityEnrichmentJobs)
      .set({
        status: 'processing',
        startedAt: now,
        attemptCount: (row.attemptCount || 0) + 1,
        updatedAt: now,
      })
      .where(and(
        eq(schema.entityEnrichmentJobs.id, row.id),
        eq(schema.entityEnrichmentJobs.status, 'queued'),
      ))
      .returning()
      .get()

    if (updated) {
      claimed.push(updated)
    }
  }

  return claimed
}

async function completeEnrichmentJob(
  jobId: number,
  entityType: 'author' | 'reference',
  entityId: number,
  preview: EntityEnrichmentPreview,
) {
  const now = new Date()
  const nextCheckAt = preview.summary.proposed_count > 0
    ? await computeReviewFollowUpAt()
    : await computeNextCheckAt(entityType)

  await db.update(schema.entityEnrichmentJobs)
    .set({
      status: 'completed',
      completedAt: now,
      updatedAt: now,
      resultPayload: JSON.stringify(preview),
      resultSummary: `${preview.summary.proposed_count} proposal(s) generated`,
      errorMessage: null,
    })
    .where(eq(schema.entityEnrichmentJobs.id, jobId))
    .run()

  await db.delete(schema.entityEnrichmentFieldProposals)
    .where(eq(schema.entityEnrichmentFieldProposals.jobId, jobId))
    .run()

  if (preview.proposals.length > 0) {
    await db.insert(schema.entityEnrichmentFieldProposals)
      .values(preview.proposals.map((proposal) => ({
        jobId,
        entityType,
        entityId,
        fieldName: proposal.field,
        currentValue: proposal.current_value,
        proposedValue: proposal.proposed_value,
        confidence: proposal.confidence,
        overwrite: proposal.overwrite,
        recommended: proposal.recommended,
        sourceLabels: JSON.stringify(proposal.source_labels),
        sourceUrls: JSON.stringify(proposal.source_urls),
        externalSourceType: preview.match?.source || null,
        externalSourceId: preview.match?.external_id || null,
        rationale: proposal.rationale,
        proposedByType: 'system' as const,
        decisionStatus: 'pending' as const,
        updatedAt: now,
      })))
      .run()
  }

  await db.insert(schema.entityVerificationState)
    .values({
      entityType,
      entityId,
      verificationStatus: preview.summary.proposed_count > 0 ? 'review' : 'verified',
      lastVerifiedAt: now,
      nextCheckAt,
      lastSuccessfulJobId: jobId,
      lastSource: preview.match?.source || null,
      lastExternalId: preview.match?.external_id || null,
      lastConfidenceScore: preview.match?.score || null,
      reviewRequired: preview.review_required,
      lastError: null,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.entityVerificationState.entityType, schema.entityVerificationState.entityId],
      set: {
        verificationStatus: preview.summary.proposed_count > 0 ? 'review' : 'verified',
        lastVerifiedAt: now,
        nextCheckAt,
        lastSuccessfulJobId: jobId,
        lastSource: preview.match?.source || null,
        lastExternalId: preview.match?.external_id || null,
        lastConfidenceScore: preview.match?.score || null,
        reviewRequired: preview.review_required,
        lastError: null,
        updatedAt: now,
      }
    })
    .run()
}

async function failJob(jobId: number, entityType: string, entityId: number, message: string) {
  const now = new Date()

  await db.update(schema.entityEnrichmentJobs)
    .set({
      status: 'failed',
      completedAt: now,
      updatedAt: now,
      errorMessage: message,
      resultSummary: message,
    })
    .where(eq(schema.entityEnrichmentJobs.id, jobId))
    .run()

  await db.insert(schema.entityVerificationState)
    .values({
      entityType: entityType as 'author' | 'reference',
      entityId,
      verificationStatus: 'failed',
      nextCheckAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
      lastError: message,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: [schema.entityVerificationState.entityType, schema.entityVerificationState.entityId],
      set: {
        verificationStatus: 'failed',
        nextCheckAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
        lastError: message,
        updatedAt: now,
      }
    })
    .run()
}

async function computeNextCheckAt(entityType: 'author' | 'reference') {
  const policy = await getEnrichmentPolicy()
  const days = policy.staleAfterDays[entityType]
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

async function computeReviewFollowUpAt() {
  const config = await resolveEnrichmentConfig()
  const days = config.values.reviewGraceDays
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000)
}

function readAuthorFieldValue(author: typeof schema.authors.$inferSelect, fieldName: string) {
  if (fieldName === 'birth_date') return author.birthDate || null
  if (fieldName === 'birth_location') return author.birthLocation || null
  if (fieldName === 'death_date') return author.deathDate || null
  if (fieldName === 'death_location') return author.deathLocation || null
  if (fieldName === 'job') return author.job || null
  if (fieldName === 'description') return author.description || null
  if (fieldName === 'image_url') return author.imageUrl || null
  if (fieldName === 'socials') return author.socials || null
  return null
}

function readReferenceFieldValue(reference: typeof schema.quoteReferences.$inferSelect, fieldName: string) {
  if (fieldName === 'release_date') return reference.releaseDate || null
  if (fieldName === 'description') return reference.description || null
  if (fieldName === 'image_url') return reference.imageUrl || null
  if (fieldName === 'urls') return reference.urls || null
  return null
}