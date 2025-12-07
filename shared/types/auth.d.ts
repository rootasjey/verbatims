// Shared auth types (moved from types/auth.d.ts)
declare module '#auth-utils' {
  interface User {
    avatar_url?: string
    biography?: string
    created_at: string
    id: number
    job?: string
    language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh'
    location?: string
    email?: string
    name: string
    role: 'admin' | 'moderator' | 'user'
    socials?: string
    updated_at: string
  }

  interface UserSession {
    // Add your own fields
  }

  interface SecureSessionData {
    // Add your own fields
  }
}

export {}
