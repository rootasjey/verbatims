# Database Reset Functionality Guide

## Overview

The database reset functionality provides a complete database wipe and recreation capability for the Verbatims quotes application. This feature is designed for development, testing, and emergency recovery scenarios.

## ⚠️ Important Warnings

**THIS IS A DESTRUCTIVE OPERATION**
- All data will be permanently deleted
- This includes quotes, authors, references, users, collections, and all interaction data
- The operation cannot be undone
- Always ensure you have backups if needed

## Features

### 🔒 Security Features

- **Admin-only access**: Only users with admin role can perform resets
- **Multi-step confirmation**: Requires explicit confirmation at multiple levels
- **Rate limiting**: Limited to 1 reset per hour per admin user
- **Comprehensive logging**: Full audit trail of all operations
- **Session invalidation**: User sessions are invalidated after reset
- **IP address tracking**: Logs IP addresses for security auditing

### 🛠️ Technical Features

- **Complete table dropping**: Removes all existing database tables
- **Schema recreation**: Rebuilds database from `schema.sql`
- **Admin user reinitialization**: Creates new admin user after reset
- **Error handling**: Graceful error handling with detailed logging
- **Progress tracking**: Logs each step of the operation

## How to Use

### 1. Access the Feature

1. Log in as an admin user
2. Navigate to **Admin Panel** → **Data Management**
3. Locate the "Database Reset" section

### 2. Initiate Reset

1. Click the **"Reset Entire Database"** button
2. Read the warning message carefully
3. Click **"Reset Entire Database"** in the confirmation dialog

### 3. Confirm Operation

1. Type **"RESET DATABASE"** exactly in the confirmation field
2. Check the acknowledgment checkbox
3. Click **"Reset Database"** to proceed

### 4. Wait for Completion

- The operation will show a loading state
- Monitor the browser console for detailed progress logs
- Wait for the success message or error notification

### 5. Re-authenticate

- After successful reset, you'll be redirected to the login page
- Log in with the reinitialized admin credentials

## API Endpoint

### `POST /api/admin/reset-database`

**Authentication**: Admin role required

**Request Body**:
```json
{
  "confirmationToken": "RESET_DATABASE_CONFIRMED"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Database reset completed successfully",
  "data": {
    "droppedTables": 12,
    "createdTables": 12,
    "executedStatements": 45,
    "tableNames": ["users", "quotes", "authors", "..."],
    "adminUserReinitialized": true,
    "timestamp": "2025-07-24T10:30:00.000Z"
  }
}
```

## Security Considerations

### Rate Limiting

- **Limit**: 1 reset per hour per admin user
- **Scope**: Per user + IP address combination
- **Storage**: Uses Cloudflare KV for rate limit tracking

### Logging

All operations are logged with:
- Admin user details (name, email)
- IP address
- Timestamp
- Operation progress
- Success/failure status

### Optional Security Enhancements

The following features can be enabled by uncommenting code:

1. **Business Hours Restriction**: Limit resets to 9 AM - 5 PM
2. **Automatic Backups**: Create backup before reset
3. **Multi-Admin Approval**: Require multiple admin approvals

## Troubleshooting

### Common Issues

#### 1. "Admin access required" Error
- **Cause**: User doesn't have admin role
- **Solution**: Ensure you're logged in as an admin user

#### 2. "Rate limit exceeded" Error
- **Cause**: Too many reset attempts
- **Solution**: Wait for the rate limit window to expire (1 hour)

#### 3. "Database reset requires explicit confirmation token" Error
- **Cause**: Missing or incorrect confirmation token
- **Solution**: Ensure the client sends the correct confirmation token

#### 4. Schema Recreation Fails
- **Cause**: Invalid SQL in schema.sql file
- **Solution**: Check schema.sql for syntax errors

### Recovery Procedures

#### If Reset Fails Mid-Process

1. Check database state:
   ```sql
   SELECT name FROM sqlite_master WHERE type='table';
   ```

2. If tables are partially created, manually complete the schema:
   ```bash
   # Run the schema file manually
   sqlite3 database.db < server/database/migrations/schema.sql
   ```

3. Verify admin user exists:
   ```sql
   SELECT * FROM users WHERE role='admin';
   ```

#### Emergency Admin User Creation

If no admin user exists after a failed reset:

```sql
INSERT INTO users (
  name, email, password, role, is_active, email_verified, 
  created_at, updated_at
) VALUES (
  'emergency-admin', 
  'admin@localhost', 
  '[hashed-password]', 
  'admin', 
  TRUE, 
  TRUE, 
  CURRENT_TIMESTAMP, 
  CURRENT_TIMESTAMP
);
```

## Development & Testing

### Testing the Feature

1. **Unit Tests**: Test API endpoint with various scenarios
2. **Integration Tests**: Test full reset workflow
3. **Security Tests**: Test authentication and authorization
4. **Error Handling Tests**: Test failure scenarios

### Development Setup

1. Ensure you have admin user credentials
2. Test in development environment first
3. Monitor logs during testing
4. Verify schema recreation works correctly

## Monitoring & Alerts

### Recommended Monitoring

Set up alerts for:
- Database reset operations
- Failed reset attempts
- Rate limit violations
- Authentication failures

### Log Analysis

Monitor these log patterns:
```bash
# Successful resets
grep "Database reset completed successfully" logs/

# Failed attempts
grep "Database reset.*failed" logs/

# Rate limit hits
grep "Rate limit exceeded" logs/
```

## Configuration

### Environment Variables

The following environment variables affect the reset functionality:

- `USER_USERNAME`: Default admin username (default: 'root')
- `USER_EMAIL`: Default admin email (default: 'admin@localhost')
- `USER_PASSWORD`: Default admin password (default: generated)

### Rate Limit Configuration

Rate limits can be adjusted in `server/utils/rateLimit.ts`:

```typescript
DATABASE_RESET: {
  limit: 1,           // Number of attempts
  window: 3600000,    // Time window in milliseconds (1 hour)
  message: 'Database reset operations are limited to once per hour'
}
```

## Best Practices

1. **Always backup before reset** (if data is important)
2. **Test in development first**
3. **Notify users of planned maintenance**
4. **Monitor logs during operation**
5. **Verify system state after reset**
6. **Document any custom configurations**

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review the security documentation
3. Check application logs for detailed error information
4. Ensure all prerequisites are met (admin access, rate limits, etc.)
