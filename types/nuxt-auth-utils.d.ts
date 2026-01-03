declare module 'nuxt-auth-utils/dist/runtime/types/session.js' {
  export interface User {
    id: number
    email: string
    name: string
    avatar_url?: string
    role: 'user' | 'moderator' | 'admin'
    is_active?: boolean
    email_verified?: boolean
    language?: string
    created_at?: string
    updated_at?: string
  }

  export interface SecureSessionData {
    [key: string]: unknown
  }
}

declare module 'nuxt-auth-utils/dist/runtime/types/session' {
  export interface User {
    id: number
    email: string
    name: string
    avatar_url?: string
    role: 'user' | 'moderator' | 'admin'
    is_active?: boolean
    email_verified?: boolean
    language?: string
    created_at?: string
    updated_at?: string
  }

  export interface SecureSessionData {
    [key: string]: unknown
  }
}

export {}
