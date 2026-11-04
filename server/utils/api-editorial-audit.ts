import { db, schema } from 'hub:db'
import { eq } from 'drizzle-orm'
import type { H3Event } from 'h3'
import type { ApiKeyData } from './api-key'

/**
 * Run one API mutation and its trigger-generated editorial audit events atomically.
 * D1 serializes the batch as one transaction, so its singleton context cannot leak
 * into another request. Audit rows snapshot the stored values and generated IDs.
 */
export async function runApiAuditedBatch(event: H3Event, api: ApiKeyData, statements: unknown[]) {
  return runEditorialAuditedBatch(event, {
    actorUserId: api.userId,
    actorUserName: api.userName,
    apiKeyId: api.id,
    apiKeyName: api.name,
    apiKeyPrefix: api.keyPrefix,
    source: safeAuditHeader(event.context.source) || 'api_v1',
  }, statements)
}

export function getAuditedBatchRow<T>(results: unknown[], index: number): T {
  const result = results[index]
  const row = Array.isArray(result) ? result[0] : result
  if (!row || typeof row !== 'object') {
    throw new Error(`Audited batch did not return a row at index ${index}`)
  }
  return row as T
}

export async function runWebEditorialAuditedBatch(event: H3Event, userId: number, statements: unknown[], source = 'admin_ui') {
  const user = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId)).get()
  return runEditorialAuditedBatch(event, {
    actorUserId: userId,
    actorUserName: user?.name ?? null,
    apiKeyId: null,
    apiKeyName: null,
    apiKeyPrefix: null,
    source,
  }, statements)
}

export async function runImportedEditorialAuditedBatch(userId: number, importId: string, statements: unknown[]) {
  const user = await db.select({ name: schema.users.name }).from(schema.users).where(eq(schema.users.id, userId)).get()
  return runEditorialAuditedBatch(null, {
    actorUserId: userId,
    actorUserName: user?.name ?? null,
    apiKeyId: null,
    apiKeyName: null,
    apiKeyPrefix: null,
    source: 'admin_import',
  }, statements, importId)
}

async function runEditorialAuditedBatch(
  event: H3Event | null,
  actor: { actorUserId: number; actorUserName: string | null; apiKeyId: number | null; apiKeyName: string | null; apiKeyPrefix: string | null; source: string },
  statements: unknown[],
  taskIdOverride?: string,
) {
  const taskId = safeAuditHeader(taskIdOverride)
    || safeAuditHeader(event && (
      getHeader(event, 'x-task-id')
      || getHeader(event, 'x-paperclip-task-id')
      || getHeader(event, 'x-codex-task-id')))
  const requestId = event ? safeAuditHeader(getHeader(event, 'x-request-id') || getHeader(event, 'cf-ray')) : null
  const context = {
    id: 1,
    ...actor,
    apiKeyName: safeAuditHeader(actor.apiKeyName),
    apiKeyPrefix: safeAuditHeader(actor.apiKeyPrefix),
    taskId,
    requestId,
  }

  return await db.batch([
    db.insert(schema.quoteEditorialAuditContext).values(context).onConflictDoUpdate({
      target: schema.quoteEditorialAuditContext.id,
      set: context,
    }),
    ...statements as any[],
    db.delete(schema.quoteEditorialAuditContext),
  ] as any)
}

function safeAuditHeader(value: unknown): string | null {
  if (typeof value !== 'string') return null
  const normalized = value.trim().replace(/[\r\n\0]/g, '').slice(0, 200)
  return normalized || null
}
