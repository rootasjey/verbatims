// auth.d.ts
declare module '#auth-utils' {
  interface User {
    biography: string
    createdAt: string;
    id: number
    job: string
    language: string
    location: string
    email: string
    name: string
    role: string
    socials: string
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