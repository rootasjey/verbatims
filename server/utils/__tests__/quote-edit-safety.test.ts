import { describe, expect, it } from 'vitest'
import { buildPrimaryAttributionUpdate, buildProvenanceStatusFields, getQuoteSourceSnapshotDeleteIds, isQuoteSourceSnapshotConflictError, orderQuoteSourceMutations, quoteSourceMatchesEdit, quoteSourceMatchesSnapshot, quoteSourceProofChanged, resolvePrimaryAttributionIds, shouldUpdateOnlyPrimaryAttribution } from '../quote-edit-safety'
import { buildQuoteSourceEditPayload, getExplicitQuoteSourceDeleteIds, isQuoteSourceLoadCurrent } from '../../../app/utils/quote-source-edit'
import { chunkForD1Bindings } from '../d1-parameter-batching'
import { updateQuoteSchema } from '../../validation/schemas'

describe('quote edit safety', () => {
	it('keeps secondary attributions when an ordinary edit submits only the primary', () => {
		expect(shouldUpdateOnlyPrimaryAttribution(1, true)).toBe(true)
		expect(shouldUpdateOnlyPrimaryAttribution(2, true)).toBe(false)
		expect(shouldUpdateOnlyPrimaryAttribution(1, false)).toBe(false)
	})

	it('respects explicit removal of either primary attribution while retaining omitted IDs', () => {
		const current = { authorId: 11, referenceId: 22 }
		const authorCleared = updateQuoteSchema.parse({ attributions: [{ author_id: null, is_primary: true }] })
		const referenceCleared = updateQuoteSchema.parse({ attributions: [{ reference_id: null, is_primary: true }] })
		expect(resolvePrimaryAttributionIds(authorCleared.attributions?.[0], current))
			.toEqual({ authorId: null, referenceId: 22 })
		expect(resolvePrimaryAttributionIds(referenceCleared.attributions?.[0], current))
			.toEqual({ authorId: 11, referenceId: null })
		const referenceChanged = updateQuoteSchema.parse({ attributions: [{ reference_id: 33, is_primary: true }] })
		expect(resolvePrimaryAttributionIds(referenceChanged.attributions?.[0], current))
			.toEqual({ authorId: 11, referenceId: 33 })
	})

	it('preserves attribution verification status unless identity or status changes', () => {
		const current = { authorId: 4, referenceId: 8, status: 'externally_verified' as const }
		expect(buildPrimaryAttributionUpdate(current, {}, 4, 8, 12)).not.toHaveProperty('status')
		expect(buildPrimaryAttributionUpdate(current, {}, 5, 8, 12)).toMatchObject({ status: 'unverified', verifiedBy: null, verifiedAt: null })
		expect(buildPrimaryAttributionUpdate(current, { status: 'disputed' }, 4, 8, 12)).toMatchObject({ status: 'disputed', verifiedBy: 12 })
		expect(buildPrimaryAttributionUpdate(current, { status: 'externally_verified' }, 4, 8, 12, false)).not.toHaveProperty('status')
	})

	it('keeps omitted v1 verification fields together and initializes new statuses coherently', () => {
		expect(buildProvenanceStatusFields('externally_verified', undefined, true, 12)).toEqual({})
		expect(buildProvenanceStatusFields(undefined, undefined, true, 12, true)).toMatchObject({ status: 'unverified', verifiedBy: null, verifiedAt: null })
		expect(buildProvenanceStatusFields('unverified', 'externally_verified', true, 12)).toMatchObject({ status: 'externally_verified', verifiedBy: 12, verifiedAt: expect.any(Date) })
		expect(buildProvenanceStatusFields('unverified', 'externally_verified', false, 12)).toEqual({})
	})

	it('deletes only omitted IDs from the opening snapshot', () => {
		expect(getQuoteSourceSnapshotDeleteIds([2, 3, 4], new Set([2, 4]))).toEqual([3])
		expect(getExplicitQuoteSourceDeleteIds([2, 3], new Set([2]))).toEqual([3])
	})

	it('demotes or deletes the old primary before promoting its replacement', () => {
		expect(orderQuoteSourceMutations(['demote'], ['delete-old'], ['promote', 'insert-primary']))
			.toEqual(['demote', 'delete-old', 'promote', 'insert-primary'])
	})

	it('turns missing or changed snapshot rows into a conflict and chunks D1 deletes', () => {
		expect(isQuoteSourceSnapshotConflictError(new Error('NOT NULL constraint failed: quote_editorial_audit_context.source'))).toBe(true)
		expect(isQuoteSourceSnapshotConflictError(new Error('UNIQUE constraint failed: quote_sources.quote_id'))).toBe(true)
		const chunks = chunkForD1Bindings(Array.from({ length: 100 }, (_, index) => index), 1, 1)
		expect(chunks.map(chunk => chunk.length)).toEqual([99, 1])
		expect(chunks.every(chunk => chunk.length + 1 <= 100)).toBe(true)
	})

	it('rejects stale source loads after close, quote switch, or a newer request', () => {
		expect(isQuoteSourceLoadCurrent(3, 3, 9, 9, true)).toBe(true)
		expect(isQuoteSourceLoadCurrent(3, 4, 9, 9, true)).toBe(false)
		expect(isQuoteSourceLoadCurrent(3, 3, 9, 10, true)).toBe(false)
		expect(isQuoteSourceLoadCurrent(3, 3, 9, 9, false)).toBe(false)
	})

	it('omits existing source verification metadata and never reuses IDs outside the snapshot', () => {
		const initial = [{ id: 20, attribution_id: null, source_type: 'book', source_url: 'https://example.com', label: '  Original label  ', notes: '   ', verification_status: 'externally_verified' as const, verified_by: 3, verified_at: '2026-01-01T00:00:00.000Z' }]
		const payload = buildQuoteSourceEditPayload([
			{ id: 20, attribution_id: null, source_type: 'book', source_url: 'https://example.com', label: '  Original label  ', notes: '   ', verification_status: 'externally_verified' },
			{ id: 99, attribution_id: 700, source_type: 'web_page', label: 'Concurrent row' },
			{ source_type: 'manual', label: 'New source' },
		], [20], initial, new Set([7]), 7)
		expect(payload.sources[0]).not.toHaveProperty('verification_status')
		expect(payload.sources[1]).not.toHaveProperty('id')
		expect(payload.sources[1]).toMatchObject({ attribution_id: 7, verification_status: 'unverified' })
		expect(payload.source_snapshot_ids).toEqual([20])
		expect(payload.delete_source_ids).toEqual([])
		expect(payload.sources[0]?.attribution_id).toBeNull()
		expect(payload.sources[1]?.attribution_id).toBe(7)
		expect(payload.source_snapshot[0]).toMatchObject({ attribution_id: null, verified_by: 3 })
		expect(payload.source_snapshot[0]).toMatchObject({ label: '  Original label  ', notes: '   ' })
		expect(payload.sources[0]).toMatchObject({ label: '  Original label  ', notes: '   ' })
		expect(payload.sources[0]).not.toHaveProperty('verification_status')
		const verifiedSource = {
			attributionId: null, occurrenceId: null, sourceType: 'book', sourceMedium: null,
			sourceUrl: 'https://example.com', label: '  Original label  ', locatorType: null,
			locatorValue: null, translatorName: null, verificationStatus: 'externally_verified' as const,
			verifiedBy: 3, verifiedAt: '2026-01-01T00:00:00.000Z', notes: '   ', isPrimary: false,
		}
		const unchangedEdit = { ...payload.source_snapshot[0]!, ...payload.sources[0]! }
		expect(quoteSourceMatchesEdit(verifiedSource, unchangedEdit)).toBe(true)
		expect(quoteSourceProofChanged(verifiedSource, unchangedEdit)).toBe(false)
	})

	it('normalizes only text fields that differ from the raw snapshot', () => {
		const initial = [{ id: 21, attribution_id: 2, source_type: 'book', label: '  Original  ', notes: '  Keep  ' }]
		const payload = buildQuoteSourceEditPayload([
			{ ...initial[0], label: '  Edited  ', notes: '  Keep  ' },
		], [21], initial, new Set([2]), 2)
		expect(payload.sources[0]).toMatchObject({ label: 'Edited', notes: '  Keep  ' })
	})

	it('preserves verified whitespace fields through payload and update schema parsing', () => {
		const initial = [{
			id: 22, attribution_id: null, occurrence_id: null, source_type: ' book ', source_medium: null,
			source_url: 'https://example.com', label: '  Verified label  ', locator_type: null,
			locator_value: null, translator_name: null, notes: '  Verified notes  ',
			verification_status: 'externally_verified' as const, verified_by: 3,
			verified_at: '2026-01-01T00:00:00.000Z', is_primary: false,
		}]
		const payload = buildQuoteSourceEditPayload(initial, [22], initial, new Set(), 1)
		const parsed = updateQuoteSchema.parse(payload)
		const parsedSource = parsed.sources?.[0]

		expect(parsedSource).toMatchObject({
			id: 22, source_type: ' book ', label: '  Verified label  ', notes: '  Verified notes  ',
		})
		expect(parsedSource).not.toHaveProperty('verification_status')
		const row = {
			attributionId: null, occurrenceId: null, sourceType: ' book ', sourceMedium: null,
			sourceUrl: 'https://example.com', label: '  Verified label  ', locatorType: null,
			locatorValue: null, translatorName: null, verificationStatus: 'externally_verified' as const,
			verifiedBy: 3, verifiedAt: '2026-01-01T00:00:00.000Z', notes: '  Verified notes  ', isPrimary: false,
		}
		const edit = { ...payload.source_snapshot[0]!, ...parsedSource! }
		expect(quoteSourceMatchesEdit(row, edit)).toBe(true)
		expect(quoteSourceProofChanged(row, edit)).toBe(false)
	})

	it('detects concurrent source edits and invalidates only changed evidence', () => {
		const row = { attributionId: null, occurrenceId: null, sourceType: 'book', sourceMedium: null, sourceUrl: 'https://a.test', label: 'A', locatorType: 'page', locatorValue: '2', translatorName: null, verificationStatus: 'externally_verified' as const, verifiedBy: 3, verifiedAt: '2026-01-01T00:00:00.000Z', notes: null, isPrimary: true }
		const snapshot = { attribution_id: null, occurrence_id: null, source_type: 'book', source_medium: null, source_url: 'https://a.test', label: 'A', locator_type: 'page', locator_value: '2', translator_name: null, verification_status: 'externally_verified' as const, verified_by: 3, verified_at: '2026-01-01T00:00:00.000Z', notes: null, is_primary: true }
		expect(quoteSourceMatchesSnapshot(row, snapshot)).toBe(true)
		expect(quoteSourceMatchesEdit(row, snapshot)).toBe(true)
		expect(quoteSourceProofChanged(row, { ...snapshot, source_url: 'https://b.test' })).toBe(true)
		expect(quoteSourceMatchesSnapshot({ ...row, sourceUrl: 'https://concurrent.test' }, snapshot)).toBe(false)
	})
})
