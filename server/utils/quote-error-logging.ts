type SerializedError = {
  name?: string
  message: string
  stack?: string
  code?: string | number
  statusCode?: number
  cause?: SerializedError
}

const MAX_CAUSE_DEPTH = 3
const MAX_MESSAGE_LENGTH = 4_000
const MAX_STACK_LENGTH = 8_000

export function collectQuoteSubmissionStrings(value: unknown): string[] {
  const strings: string[] = []

  function visit(current: unknown, depth: number) {
    if (depth > 6 || strings.length >= 100) return

    if (typeof current === 'string') {
      if (current.length >= 3) strings.push(current)
      return
    }

    if (Array.isArray(current)) {
      for (const item of current) visit(item, depth + 1)
      return
    }

    if (current && typeof current === 'object') {
      for (const item of Object.values(current)) visit(item, depth + 1)
    }
  }

  visit(value, 0)
  return [...new Set(strings)]
}

export function serializeQuoteCreationError(
  error: unknown,
  sensitiveValues: string[] = [],
): SerializedError {
  return serializeError(error, sensitiveValues, 0, new Set())
}

function serializeError(
  error: unknown,
  sensitiveValues: string[],
  depth: number,
  seen: Set<unknown>,
): SerializedError {
  if (depth > MAX_CAUSE_DEPTH || seen.has(error)) {
    return { message: '[cause omitted]' }
  }

  if (!error || typeof error !== 'object') {
    return { message: redact(String(error), sensitiveValues).slice(0, MAX_MESSAGE_LENGTH) }
  }

  seen.add(error)
  const candidate = error as Record<string, unknown>
  const message = typeof candidate.message === 'string'
    ? candidate.message
    : String(error)
  const stack = typeof candidate.stack === 'string' ? candidate.stack : undefined
  const cause = candidate.cause
  const code = typeof candidate.code === 'string' || typeof candidate.code === 'number'
    ? candidate.code
    : undefined
  const statusCode = typeof candidate.statusCode === 'number' ? candidate.statusCode : undefined

  return {
    name: typeof candidate.name === 'string' ? candidate.name : undefined,
    message: redact(message, sensitiveValues).slice(0, MAX_MESSAGE_LENGTH),
    stack: stack ? redact(stack, sensitiveValues).slice(0, MAX_STACK_LENGTH) : undefined,
    code,
    statusCode,
    cause: cause === undefined
      ? undefined
      : serializeError(cause, sensitiveValues, depth + 1, seen),
  }
}

function redact(value: string, sensitiveValues: string[]) {
  let result = value
  for (const sensitiveValue of sensitiveValues) {
    result = result.split(sensitiveValue).join('[redacted]')
  }
  return result
}
