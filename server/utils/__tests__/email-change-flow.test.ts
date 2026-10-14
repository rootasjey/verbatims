import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { and, eq, isNull } from 'drizzle-orm'
import { createTestDb, type TestDb } from './test-db'
import { hashEmailChangeToken } from '../email-change'

const { sendEmailChangeVerificationEmail } = vi.hoisted(() => ({
  sendEmailChangeVerificationEmail: vi.fn(),
}))

let currentDb: TestDb
let currentSession: { user: { id: number; email: string } } | null

vi.mock('hub:db', () => ({
  get db() { return currentDb.db },
  get schema() { return currentDb.schema },
}))

vi.mock('../email', () => ({ sendEmailChangeVerificationEmail }))

async function seedUser(id: number, email: string) {
  await currentDb.db.insert(currentDb.schema.users).values({
    id,
    email,
    name: `Test User ${id}`,
    password: 'test-password-hash',
    role: 'user',
  }).run()
}

function makeEvent(body: unknown = {}) {
  return { body } as any
}

beforeEach(() => {
  currentDb = createTestDb()
  currentSession = { user: { id: 1, email: 'old@example.test' } }
  sendEmailChangeVerificationEmail.mockReset().mockResolvedValue(undefined)

  vi.stubGlobal('defineEventHandler', (handler: (event: unknown) => unknown) => handler)
  vi.stubGlobal('requireAuth', vi.fn(async () => ({ user: { id: 1 } })))
  vi.stubGlobal('requireRateLimit', vi.fn(async () => undefined))
  vi.stubGlobal('getRequestIP', vi.fn(() => '127.0.0.1'))
  vi.stubGlobal('readValidatedBody', vi.fn(async (event: any, parse: (body: unknown) => unknown) => parse(event.body)))
  vi.stubGlobal('throwServer', vi.fn((statusCode: number, message: string) => {
    throw Object.assign(new Error(message), { statusCode })
  }))
  vi.stubGlobal('getUserSession', vi.fn(async () => currentSession))
  vi.stubGlobal('setUserSession', vi.fn(async (_event: unknown, session: typeof currentSession) => {
    currentSession = session
  }))
})

afterEach(() => {
  vi.unstubAllGlobals()
})

describe('email change API flow', () => {
  it('keeps the current address until one valid confirmation, then consumes the token', async () => {
    await seedUser(1, 'old@example.test')
    const { default: requestEmailChange } = await import('../../api/user/email-change.post')
    const { default: verifyEmailChange } = await import('../../api/auth/verify-email-change.post')

    const requestResult = await requestEmailChange(makeEvent({ email: 'New@example.test' }))
    expect(requestResult.pendingEmail).toBe('new@example.test')
    expect(sendEmailChangeVerificationEmail).toHaveBeenCalledOnce()

    const [, sentAddress, token] = sendEmailChangeVerificationEmail.mock.calls[0] as [unknown, string, string]
    expect(sentAddress).toBe('new@example.test')

    const [beforeConfirmation] = await currentDb.db.select().from(currentDb.schema.users)
      .where(eq(currentDb.schema.users.id, 1)).all()
    expect(beforeConfirmation?.email).toBe('old@example.test')

    const [storedToken] = await currentDb.db.select().from(currentDb.schema.emailChangeTokens).all()
    expect(storedToken?.tokenHash).toBe(await hashEmailChangeToken(token))
    expect(storedToken?.tokenHash).not.toBe(token)

    const result = await verifyEmailChange(makeEvent({ token }))
    expect(result).toEqual({ success: true, email: 'new@example.test' })
    expect(currentSession?.user.email).toBe('new@example.test')

    const [updatedUser] = await currentDb.db.select().from(currentDb.schema.users)
      .where(eq(currentDb.schema.users.id, 1)).all()
    const [usedToken] = await currentDb.db.select().from(currentDb.schema.emailChangeTokens)
      .where(eq(currentDb.schema.emailChangeTokens.id, storedToken!.id)).all()
    expect(updatedUser?.email).toBe('new@example.test')
    expect(updatedUser?.emailVerified).toBe(true)
    expect(usedToken?.usedAt).toBeInstanceOf(Date)

    await expect(verifyEmailChange(makeEvent({ token })))
      .rejects.toMatchObject({ statusCode: 400 })
  })

  it('rejects an address already assigned to another account', async () => {
    await seedUser(1, 'old@example.test')
    await seedUser(2, 'taken@example.test')
    const { default: requestEmailChange } = await import('../../api/user/email-change.post')

    await expect(requestEmailChange(makeEvent({ email: 'Taken@example.test' })))
      .rejects.toMatchObject({ statusCode: 409 })
    expect(sendEmailChangeVerificationEmail).not.toHaveBeenCalled()
  })

  it('invalidates the pending link when sending the confirmation email fails', async () => {
    await seedUser(1, 'old@example.test')
    sendEmailChangeVerificationEmail.mockRejectedValueOnce(new Error('mail service unavailable'))
    const { default: requestEmailChange } = await import('../../api/user/email-change.post')

    await expect(requestEmailChange(makeEvent({ email: 'new@example.test' })))
      .rejects.toThrow('mail service unavailable')

    const [user] = await currentDb.db.select().from(currentDb.schema.users)
      .where(eq(currentDb.schema.users.id, 1)).all()
    const [token] = await currentDb.db.select().from(currentDb.schema.emailChangeTokens).all()
    expect(user?.email).toBe('old@example.test')
    expect(token?.usedAt).toBeInstanceOf(Date)
  })

  it('rejects expired confirmation tokens without changing the account', async () => {
    await seedUser(1, 'old@example.test')
    const token = crypto.randomUUID().replaceAll('-', '').padEnd(64, '0').slice(0, 64)
    const tokenHash = await hashEmailChangeToken(token)
    await currentDb.db.insert(currentDb.schema.emailChangeTokens).values({
      userId: 1,
      newEmail: 'new@example.test',
      tokenHash,
      expiresAt: new Date(Date.now() - 1000),
    }).run()
    const { default: verifyEmailChange } = await import('../../api/auth/verify-email-change.post')

    await expect(verifyEmailChange(makeEvent({ token })))
      .rejects.toMatchObject({ statusCode: 400 })

    const [user] = await currentDb.db.select().from(currentDb.schema.users)
      .where(eq(currentDb.schema.users.id, 1)).all()
    const [expiredToken] = await currentDb.db.select().from(currentDb.schema.emailChangeTokens)
      .where(and(eq(currentDb.schema.emailChangeTokens.tokenHash, tokenHash), isNull(currentDb.schema.emailChangeTokens.usedAt))).all()
    expect(user?.email).toBe('old@example.test')
    expect(expiredToken).toBeDefined()
  })
})
