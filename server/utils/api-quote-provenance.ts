import { requireApiKeyRole, requireApiPermission } from './api-key'
import type { ApiKeyData } from './api-key'

export function requireApiModerator(api: ApiKeyData, permission = 'write:quotes') {
  requireApiKeyRole(api, 'moderator', 'admin')
  requireApiPermission(api, permission)
}
