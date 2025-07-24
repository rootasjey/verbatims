# Database Reset Security Documentation

## Overview

The database reset functionality is a critical administrative feature that completely wipes and recreates the database. Due to its destructive nature, multiple security layers have been implemented to prevent unauthorized access and accidental execution.

## Security Measures Implemented

### 1. Authentication & Authorization

- **Admin-Only Access**: Only users with `role = 'admin'` can access the endpoint
- **Session Validation**: Uses `requireUserSession()` to ensure valid authentication
- **Role Verification**: Explicitly checks for admin role (moderators are excluded)

```typescript
const { user } = await requireUserSession(event)
if (!user || user.role !== 'admin') {
  throw createError({
    statusCode: 403,
    statusMessage: 'Admin access required for database reset operations'
  })
}
```

### 2. Confirmation Token System

- **Required Token**: API requires explicit confirmation token `RESET_DATABASE_CONFIRMED`
- **Client-Side Validation**: User must type "RESET DATABASE" exactly
- **Acknowledgment Checkbox**: User must acknowledge data loss

```typescript
if (!confirmationToken || confirmationToken !== 'RESET_DATABASE_CONFIRMED') {
  throw createError({
    statusCode: 400,
    statusMessage: 'Database reset requires explicit confirmation token'
  })
}
```

### 3. Multi-Step Confirmation Process

1. **Initial Warning**: Clear warning about destructive nature
2. **Confirmation Dialog**: Modal with detailed explanation
3. **Text Confirmation**: Must type exact phrase
4. **Acknowledgment**: Must check understanding checkbox
5. **Final Confirmation**: Button only enabled when all conditions met

### 4. Comprehensive Logging

- **Operation Initiation**: Logs admin user who initiated reset
- **Progress Tracking**: Logs each step of the process
- **Table Operations**: Logs each table drop/create operation
- **Completion Status**: Logs final state and statistics

```typescript
console.log(`🔥 Database reset initiated by admin user: ${user.name} (${user.email})`)
console.log(`🎉 Database reset completed successfully by ${user.name} (${user.email})`)
```

### 5. Error Handling & Recovery

- **Graceful Failures**: Proper error handling at each step
- **Detailed Error Messages**: Specific error information for debugging
- **Partial Recovery**: Admin user reinitialization even if other steps fail
- **State Verification**: Verifies database structure after recreation

## Additional Security Recommendations

### 1. Rate Limiting (Recommended Implementation)

Add rate limiting to prevent abuse:

```typescript
// In server/api/admin/reset-database.post.ts
import { rateLimit } from '@/server/utils/rateLimit'

export default defineEventHandler(async (event) => {
  // Allow only 1 reset per hour per admin user
  await rateLimit(event, {
    key: `reset-db-${user.id}`,
    limit: 1,
    window: 3600000 // 1 hour
  })
  
  // ... rest of implementation
})
```

### 2. Backup Creation (Recommended)

Automatically create backup before reset:

```typescript
// Before dropping tables
console.log('📦 Creating automatic backup before reset...')
const backupManager = getBackupManager()
const backup = await backupManager.createBackup('Pre-reset automatic backup')
console.log(`✅ Backup created: ${backup.id}`)
```

### 3. IP Address Logging

Log IP addresses for audit trail:

```typescript
const clientIP = getClientIP(event)
console.log(`🔥 Database reset initiated by ${user.name} from IP: ${clientIP}`)
```

### 4. Time-Based Restrictions

Restrict operations to business hours:

```typescript
const now = new Date()
const hour = now.getHours()
if (hour < 9 || hour > 17) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Database reset operations are only allowed during business hours (9 AM - 5 PM)'
  })
}
```

### 5. Multi-Admin Approval (Enterprise Feature)

For high-security environments, require multiple admin approvals:

```typescript
// Require 2 admin approvals for reset
const approvals = await getResetApprovals(resetRequestId)
if (approvals.length < 2) {
  throw createError({
    statusCode: 403,
    statusMessage: 'Database reset requires approval from at least 2 admin users'
  })
}
```

## Security Audit Checklist

- [ ] Admin authentication verified
- [ ] Confirmation token system working
- [ ] Multi-step confirmation process complete
- [ ] Comprehensive logging implemented
- [ ] Error handling covers all scenarios
- [ ] Rate limiting configured (optional)
- [ ] Backup creation enabled (optional)
- [ ] IP address logging enabled (optional)
- [ ] Time-based restrictions configured (optional)
- [ ] Multi-admin approval system (enterprise only)

## Monitoring & Alerts

### Recommended Monitoring

1. **Database Reset Events**: Alert on any database reset operation
2. **Failed Attempts**: Monitor failed authentication/authorization attempts
3. **Unusual Activity**: Alert on multiple reset attempts from same user
4. **System Recovery**: Monitor admin user reinitialization success

### Log Analysis

Key log patterns to monitor:

```bash
# Successful resets
grep "Database reset completed successfully" /var/log/app.log

# Failed attempts
grep "Database reset.*failed" /var/log/app.log

# Authentication failures
grep "Admin access required for database reset" /var/log/app.log
```

## Recovery Procedures

### If Reset Fails Mid-Process

1. Check database state: `SELECT name FROM sqlite_master WHERE type='table'`
2. If tables partially exist, manually complete schema recreation
3. Ensure admin user exists: `SELECT * FROM users WHERE role='admin'`
4. If no admin user, run manual initialization script

### If Admin User Lost

```sql
-- Emergency admin user creation
INSERT INTO users (name, email, password, role, is_active, email_verified, created_at, updated_at)
VALUES ('emergency-admin', 'admin@localhost', '[hashed-password]', 'admin', TRUE, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
```

## Compliance Considerations

- **Data Retention**: Ensure compliance with data retention policies before reset
- **User Notification**: Consider notifying users of planned maintenance
- **Audit Trail**: Maintain detailed logs for compliance auditing
- **Backup Requirements**: Ensure backups meet regulatory requirements

## Testing

### Security Testing Checklist

- [ ] Test with non-admin user (should fail)
- [ ] Test with moderator user (should fail)
- [ ] Test without confirmation token (should fail)
- [ ] Test with invalid confirmation token (should fail)
- [ ] Test partial confirmation process (should fail)
- [ ] Test successful reset with admin user
- [ ] Verify logging captures all events
- [ ] Test error handling scenarios
- [ ] Verify admin user reinitialization
- [ ] Test session invalidation after reset
