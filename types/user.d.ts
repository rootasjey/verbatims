// Additional user type definitions
// See authenticated user types at types/user.d.ts
// It's defined there for nuxt-auth-utils.

type UserRole = 'user' | 'moderator' | 'admin'
interface AdminUser {
  id: number
  name: string
  email?: string
  avatar_url?: string
  role: UserRole
  is_active: 0 | 1 | boolean
  email_verified: 0 | 1 | boolean
  created_at: string
  updated_at: string
  last_login_at?: string
  quote_count?: number
  approved_quotes?: number
  collection_count?: number
  likes_given?: number
  total_likes_received?: number
}

// Admin Users API response typings
interface AdminUsersPagination {
  page: number
  limit: number
  total: number
  hasMore: boolean
  totalPages: number
}

interface AdminUsersApiResponse {
  success: boolean
  data: AdminUser[]
  pagination: AdminUsersPagination
}
