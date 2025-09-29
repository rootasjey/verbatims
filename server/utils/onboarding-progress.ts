/**
 * Onboarding Progress Tracking Utilities
 * Manages real-time progress tracking for database import operations
 */

export interface OnboardingProgress {
  id: string
  status: 'pending' | 'processing' | 'completed' | 'failed'
  currentStep: 'users' | 'authors' | 'references' | 'tags' | 'quotes' | null
  steps: {
    users: {
      status: 'pending' | 'processing' | 'completed' | 'failed'
      message: string
      current: number
      total: number
      imported: number
    }
    authors: {
      status: 'pending' | 'processing' | 'completed' | 'failed'
      message: string
      current: number
      total: number
      imported: number
    }
    references: {
      status: 'pending' | 'processing' | 'completed' | 'failed'
      message: string
      current: number
      total: number
      imported: number
    }
    tags: {
      status: 'pending' | 'processing' | 'completed' | 'failed'
      message: string
      current: number
      total: number
      imported: number
    }
    quotes: {
      status: 'pending' | 'processing' | 'completed' | 'failed'
      message: string
      current: number
      total: number
      imported: number
    }
  }
  // Aggregated counts for optional datasets imported alongside main steps
  extras: {
    user_collections: number
    collection_quotes: number
    user_likes: number
    user_sessions: number
    user_messages: number
    quote_reports: number
    quote_views: number
    author_views: number
    reference_views: number
  }
  errors: string[]
  warnings: string[]
  startedAt: Date
  completedAt?: Date
  totalImported: number
}

export interface ProgressCallback {
  (progress: OnboardingProgress): void
}

// In-memory store for onboarding progress (in production, consider using Redis or database)
const onboardingProgressStore = new Map<string, OnboardingProgress>()

// Store for SSE connections
const sseConnections = new Map<string, Response>()

/**
 * Generate a unique import ID
 */
export function generateImportId(): string {
  return `onboarding_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Initialize progress tracking for a new import
 */
export function initializeProgress(importId: string): OnboardingProgress {
  const progress: OnboardingProgress = {
    id: importId,
    status: 'pending',
    currentStep: null,
    steps: {
      users: {
        status: 'pending',
        message: 'Ready to import users from backup',
        current: 0,
        total: 0,
        imported: 0
      },
      authors: {
        status: 'pending',
        message: 'Ready to import authors from backup files',
        current: 0,
        total: 0,
        imported: 0
      },
      references: {
        status: 'pending',
        message: 'Ready to import references from backup files',
        current: 0,
        total: 0,
        imported: 0
      },
      tags: {
        status: 'pending',
        message: 'Ready to import tags from backup',
        current: 0,
        total: 0,
        imported: 0
      },
      quotes: {
        status: 'pending',
        message: 'Ready to import quotes from backup files',
        current: 0,
        total: 0,
        imported: 0
      }
    },
    extras: {
      user_collections: 0,
      collection_quotes: 0,
      user_likes: 0,
      user_sessions: 0,
      user_messages: 0,
      quote_reports: 0,
      quote_views: 0,
      author_views: 0,
      reference_views: 0
    },
    errors: [],
    warnings: [],
    startedAt: new Date(),
    totalImported: 0
  }

  onboardingProgressStore.set(importId, progress)
  return progress
}

/**
 * Get progress by import ID
 */
export function getProgress(importId: string): OnboardingProgress | undefined {
  return onboardingProgressStore.get(importId)
}

/**
 * Update progress and notify SSE connections
 */
export function updateProgress(importId: string, updates: Partial<OnboardingProgress>): void {
  const progress = onboardingProgressStore.get(importId)
  if (!progress) return

  // Apply updates
  Object.assign(progress, updates)

  // Calculate total imported
  progress.totalImported = progress.steps.users.imported +
                          progress.steps.authors.imported +
                          progress.steps.references.imported +
                          progress.steps.tags.imported +
                          progress.steps.quotes.imported +
                          // sum of optional datasets
                          progress.extras.user_collections +
                          progress.extras.collection_quotes +
                          progress.extras.user_likes +
                          progress.extras.user_sessions +
                          progress.extras.user_messages +
                          progress.extras.quote_reports +
                          progress.extras.quote_views +
                          progress.extras.author_views +
                          progress.extras.reference_views

  // Update store
  onboardingProgressStore.set(importId, progress)

  // Throttle notifications to avoid overwhelming clients
  throttledNotify(importId, progress)
}

// Throttle notifications to reduce load
const notificationThrottles = new Map<string, { lastNotified: number, pending: boolean }>()
const THROTTLE_INTERVAL = 500 // 500ms minimum between notifications

function throttledNotify(importId: string, progress: OnboardingProgress): void {
  const now = Date.now()
  const throttle = notificationThrottles.get(importId) || { lastNotified: 0, pending: false }

  // If enough time has passed, notify immediately
  if (now - throttle.lastNotified >= THROTTLE_INTERVAL) {
    throttle.lastNotified = now
    throttle.pending = false
    notificationThrottles.set(importId, throttle)
    notifySSEConnections(importId, progress)
    return
  }

  // If notification is already pending, skip
  if (throttle.pending) return

  // Schedule a delayed notification
  throttle.pending = true
  notificationThrottles.set(importId, throttle)

  setTimeout(() => {
    const currentProgress = onboardingProgressStore.get(importId)
    if (currentProgress) {
      const currentThrottle = notificationThrottles.get(importId)
      if (currentThrottle) {
        currentThrottle.lastNotified = Date.now()
        currentThrottle.pending = false
        notificationThrottles.set(importId, currentThrottle)
      }
      notifySSEConnections(importId, currentProgress)
    }
  }, THROTTLE_INTERVAL - (now - throttle.lastNotified))
}

/**
 * Update a specific step's progress
 */
export function updateStepProgress(
  importId: string, 
  step: 'users' | 'authors' | 'references' | 'tags' | 'quotes',
  stepUpdates: Partial<OnboardingProgress['steps']['authors']>
): void {
  const progress = onboardingProgressStore.get(importId)
  if (!progress) return

  // Update the specific step
  Object.assign(progress.steps[step], stepUpdates)

  // Update current step if this step is processing
  if (stepUpdates.status === 'processing') {
    progress.currentStep = step
  }

  // Update overall status
  if (stepUpdates.status === 'failed') {
    progress.status = 'failed'
  } else if (stepUpdates.status === 'completed') {
    // Check if all steps are completed
    const allCompleted = Object.values(progress.steps).every(s => s.status === 'completed')
    if (allCompleted) {
      progress.status = 'completed'
      progress.completedAt = new Date()
      progress.currentStep = null
    }
  }

  // Calculate total imported
  progress.totalImported = progress.steps.users.imported +
                          progress.steps.authors.imported + 
                          progress.steps.references.imported + 
                          progress.steps.tags.imported +
                          progress.steps.quotes.imported +
                          progress.extras.user_collections +
                          progress.extras.collection_quotes +
                          progress.extras.user_likes +
                          progress.extras.user_sessions +
                          progress.extras.user_messages +
                          progress.extras.quote_reports +
                          progress.extras.quote_views +
                          progress.extras.author_views +
                          progress.extras.reference_views

  // Update store
  onboardingProgressStore.set(importId, progress)

  // Notify SSE connections
  notifySSEConnections(importId, progress)
}

/**
 * Incrementally add counts for optional datasets and recompute totals
 */
export function addExtras(importId: string, extras: Partial<OnboardingProgress['extras']>): void {
  const progress = onboardingProgressStore.get(importId)
  if (!progress) return

  // Increment extras
  for (const key of Object.keys(extras) as (keyof OnboardingProgress['extras'])[]) {
    const value = extras[key] || 0
    if (typeof value === 'number' && value > 0) {
      progress.extras[key] += value
    }
  }

  // Recompute totalImported
  progress.totalImported = progress.steps.users.imported +
                          progress.steps.authors.imported +
                          progress.steps.references.imported +
                          progress.steps.tags.imported +
                          progress.steps.quotes.imported +
                          progress.extras.user_collections +
                          progress.extras.collection_quotes +
                          progress.extras.user_likes +
                          progress.extras.user_sessions +
                          progress.extras.user_messages +
                          progress.extras.quote_reports +
                          progress.extras.quote_views +
                          progress.extras.author_views +
                          progress.extras.reference_views

  onboardingProgressStore.set(importId, progress)
  notifySSEConnections(importId, progress)
}

/**
 * Add error to progress
 */
export function addError(importId: string, error: string): void {
  const progress = onboardingProgressStore.get(importId)
  if (!progress) return

  progress.errors.push(error)
  progress.status = 'failed'
  progress.completedAt = new Date()

  onboardingProgressStore.set(importId, progress)
  notifySSEConnections(importId, progress)
}

/**
 * Add warning to progress
 */
export function addWarning(importId: string, warning: string): void {
  const progress = onboardingProgressStore.get(importId)
  if (!progress) return

  progress.warnings.push(warning)
  onboardingProgressStore.set(importId, progress)
  notifySSEConnections(importId, progress)
}

/**
 * Register SSE connection for progress updates
 */
export function registerSSEConnection(importId: string, response: Response): void {
  sseConnections.set(importId, response)
}

/**
 * Unregister SSE connection
 */
export function unregisterSSEConnection(importId: string): void {
  sseConnections.delete(importId)
}

/**
 * Notify all SSE connections for a specific import
 */
function notifySSEConnections(importId: string, progress: OnboardingProgress): void {
  // Import the notification function dynamically to avoid circular imports
  try {
    // Use dynamic import to get the notification function
    import('~/server/api/onboarding/progress/[id].get').then(module => {
      if (module.notifyProgressHandlers) {
        module.notifyProgressHandlers(importId, progress)
      }
    }).catch(error => {
      console.error('Failed to notify progress handlers:', error)
    })
  } catch (error) {
    console.error('Failed to send SSE update:', error)
  }
}

/**
 * Clean up completed or failed imports (call periodically)
 */
export function cleanupOldProgress(maxAgeMs: number = 24 * 60 * 60 * 1000): void {
  const now = Date.now()

  for (const [importId, progress] of onboardingProgressStore.entries()) {
    const age = now - progress.startedAt.getTime()

    if (age > maxAgeMs && (progress.status === 'completed' || progress.status === 'failed')) {
      onboardingProgressStore.delete(importId)
      sseConnections.delete(importId)
    }
  }
}

/**
 * Check for stuck imports and mark them as failed
 */
export function checkForStuckImports(timeoutMs: number = 30 * 60 * 1000): void {
  const now = Date.now()

  for (const [importId, progress] of onboardingProgressStore.entries()) {
    if (progress.status === 'processing') {
      const age = now - progress.startedAt.getTime()

      if (age > timeoutMs) {
        console.warn(`Import ${importId} has been stuck for ${age}ms, marking as failed`)
        addError(importId, 'Import timed out - process took too long to complete')
      }
    }
  }
}

/**
 * Get import statistics
 */
export function getImportStats(): {
  total: number
  pending: number
  processing: number
  completed: number
  failed: number
} {
  const stats = {
    total: 0,
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  }

  for (const progress of onboardingProgressStore.values()) {
    stats.total++
    stats[progress.status]++
  }

  return stats
}
