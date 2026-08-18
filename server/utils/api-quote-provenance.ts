import { requireApiKeyRole, requireApiPermission } from './api-key'
import type { ApiKeyData } from './api-key'

export function requireApiModerator(api: ApiKeyData) {
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, 'write:quotes')
}
