import type { ImportProgress } from '~/types'

export type AdminImportStatus = 'pending' | 'processing' | 'completed' | 'failed'

export interface AdminImportProgress extends ImportProgress {
  // Optional metadata for UI/context
  dataType?: 'authors' | 'quotes' | 'references' | 'tags' | 'users' | 'all'
  filename?: string
}

// In-memory store for admin imports (separate from onboarding)
const adminImportStore = new Map<string, AdminImportProgress>()

// Cancellation flags
const cancelled = new Set<string>()

// SSE listeners per importId
const listeners = new Map<string, Set<(progress: AdminImportProgress) => void>>()

// Throttle notifications
const THROTTLE_INTERVAL = 500
const throttles = new Map<string, { last: number; pending?: AdminImportProgress }>()

export function createAdminImport(importId: string, initial: Partial<AdminImportProgress> = {}): AdminImportProgress {
  const progress: AdminImportProgress = {
    id: importId,
    status: 'pending',
    totalRecords: 0,
    processedRecords: 0,
    successfulRecords: 0,
    failedRecords: 0,
    errors: [],
    warnings: [],
    startedAt: new Date(),
    ...initial,
  }
  adminImportStore.set(importId, progress)
  return progress
}

export function getAdminImport(importId: string): AdminImportProgress | undefined {
  return adminImportStore.get(importId)
}

export function updateAdminImport(importId: string, updates: Partial<AdminImportProgress>): void {
  const current = adminImportStore.get(importId)
  if (!current) return
  Object.assign(current, updates)
  // Throttled notify
  const now = Date.now()
  const t = throttles.get(importId) || { last: 0 }
  if (now - t.last >= THROTTLE_INTERVAL) {
    t.last = now
    throttles.set(importId, t)
    notify(importId, current)
  } else {
    t.pending = current
    throttles.set(importId, t)
    const delay = Math.max(0, THROTTLE_INTERVAL - (now - t.last))
    setTimeout(() => {
      const latest = adminImportStore.get(importId)
      if (!latest) return
      const tt = throttles.get(importId) || { last: 0 }
      tt.last = Date.now()
      throttles.set(importId, tt)
      notify(importId, latest)
    }, delay)
  }
}

export function addAdminImportError(importId: string, message: string): void {
  const current = adminImportStore.get(importId)
  if (!current) return
  current.errors.push(message)
  current.status = 'failed'
  current.completedAt = new Date()
  notify(importId, current)
}

export function addAdminImportWarning(importId: string, message: string): void {
  const current = adminImportStore.get(importId)
  if (!current) return
  current.warnings.push(message)
  notify(importId, current)
}

export function requestCancel(importId: string): void {
  cancelled.add(importId)
  const current = adminImportStore.get(importId)
  if (current && current.status === 'processing') {
    current.status = 'failed'
    current.errors.push('Cancelled by user')
    current.completedAt = new Date()
    notify(importId, current)
  }
}

export function isCancelRequested(importId: string): boolean {
  return cancelled.has(importId)
}

export function clearCancel(importId: string): void {
  cancelled.delete(importId)
}

export function onProgress(importId: string, listener: (progress: AdminImportProgress) => void): () => void {
  const set = listeners.get(importId) || new Set()
  set.add(listener)
  listeners.set(importId, set)
  return () => {
    const s = listeners.get(importId)
    if (!s) return
    s.delete(listener)
    if (s.size === 0) listeners.delete(importId)
  }
}

function notify(importId: string, progress: AdminImportProgress): void {
  const set = listeners.get(importId)
  if (!set) return
  for (const fn of set) {
    try { fn(progress) } catch (e) { console.error('Admin import listener failed:', e) }
  }
}

export function computeDerived(progress: AdminImportProgress) {
  const duration = progress.completedAt
    ? progress.completedAt.getTime() - progress.startedAt.getTime()
    : Date.now() - progress.startedAt.getTime()
  const progressPercentage = progress.totalRecords > 0
    ? Math.round((progress.processedRecords / progress.totalRecords) * 100)
    : 0
  let estimatedTimeRemaining: number | null = null
  if (progress.status === 'processing' && progress.processedRecords > 0) {
    const avg = duration / progress.processedRecords
    const remain = Math.max(0, progress.totalRecords - progress.processedRecords)
    estimatedTimeRemaining = Math.round(avg * remain)
  }
  return { duration, progressPercentage, estimatedTimeRemaining }
}

