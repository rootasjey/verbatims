const encoder = new TextEncoder()

export const EMAIL_CHANGE_TOKEN_EXPIRY_MS = 60 * 60 * 1000

export function createEmailChangeToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return Array.from(bytes, byte => byte.toString(16).padStart(2, '0')).join('')
}

export async function hashEmailChangeToken(token: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(token))
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('')
}
