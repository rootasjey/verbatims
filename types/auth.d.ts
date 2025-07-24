// auth.d.ts
declare module '#auth-utils' {
  interface User {
    biography: string | null
    createdAt: string
    id: number
    job: string | null
    language: 'en' | 'es' | 'fr' | 'de' | 'it' | 'pt' | 'ru' | 'ja' | 'zh'
    location: string | null
    email: string
    name: string
    role: 'admin' | 'moderator' | 'user'
    socials: string | null
    updatedAt: string
  }

  interface UserSession {
    // Add your own fields
  }

  interface SecureSessionData {
    // Add your own fields
  }
}

export {}