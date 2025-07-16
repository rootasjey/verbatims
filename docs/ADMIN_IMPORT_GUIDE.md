# Admin Import System Documentation

This guide covers the comprehensive data import system for migrating reference data from Firebase backups or other sources into the Verbatims database.

## Overview

The import system provides:
- **Data Transformation**: Convert Firebase JSON to SQL-compatible format
- **Validation**: Comprehensive data validation before import
- **Progress Tracking**: Real-time import progress monitoring
- **Backup & Rollback**: Automatic backups with rollback capabilities
- **Error Handling**: Detailed error reporting and recovery options
- **Performance Optimization**: Batch processing optimized for Cloudflare D1

## Getting Started

### Prerequisites
- Admin role access
- Firebase JSON backup file or transformed data
- Understanding of the reference data structure

### Access the Import Interface
1. Navigate to `/admin/import` in your browser
2. Ensure you're logged in with admin privileges
3. The interface provides three main tabs:
   - **Upload**: File upload and validation
   - **Progress**: Real-time import monitoring
   - **History**: Import history and management

## Data Formats Supported

### 1. Firebase JSON Backup
```json
{
  "meta": {
    "format": "JSON",
    "version": "1.1.0",
    "projectId": "your-project-id"
  },
  "data": {
    "reference-id-1": {
      "name": "Reference Name",
      "type": {
        "primary": "film",
        "secondary": "Drama"
      },
      "language": "en",
      "summary": "Description...",
      "urls": { ... },
      "created_at": { "__time__": "2023-01-01T00:00:00.000Z" }
    }
  }
}
```

### 2. Transformed JSON
```json
[
  {
    "name": "Reference Name",
    "primary_type": "film",
    "secondary_type": "Drama",
    "original_language": "en",
    "description": "Description...",
    "image_url": "https://...",
    "urls": "{\"imdb\":\"...\"}",
    "created_at": "2023-01-01",
    "updated_at": "2023-01-01"
  }
]
```

### 3. CSV Format
```csv
name,primary_type,secondary_type,original_language,description,image_url,urls,created_at,updated_at
"Reference Name","film","Drama","en","Description...","https://...","{}","2023-01-01","2023-01-01"
```

## Step-by-Step Import Process

### Step 1: Upload and Validate Data

1. **Select File**: Choose your data file (.json or .csv)
2. **Choose Format**: Select the appropriate data format
3. **Configure Options**:
   - ✅ **Create backup before import** (recommended)
   - ⚠️ **Ignore validation errors** (use with caution)
   - **Batch size**: 50 (default, adjust based on file size)

4. **Validate Data**: Click "Validate Data" to check for issues
   - Review validation results
   - Check data preview
   - Address any critical errors

### Step 2: Start Import

1. **Review Validation**: Ensure data passes validation
2. **Start Import**: Click "Start Import" to begin
3. **Monitor Progress**: Switch to Progress tab automatically

### Step 3: Monitor Progress

The progress view shows:
- **Real-time statistics**: Total, processed, successful, failed records
- **Progress bar**: Visual progress indicator
- **Time estimates**: Duration and estimated completion time
- **Recent errors/warnings**: Latest issues encountered

### Step 4: Handle Results

**Successful Import**:
- Review final statistics
- Check for any warnings
- Verify data in the application

**Failed Import**:
- Review error details
- Fix data issues if possible
- Retry import or rollback if needed

## Data Validation

### Validation Rules

#### Required Fields
- **name**: 2-200 characters, non-empty
- **primary_type**: Must be valid enum value

#### Field Constraints
- **original_language**: Must be supported language code
- **release_date**: Valid date format, not in future
- **urls**: Valid JSON object with proper URL formats
- **imdb_id**: Format: tt followed by 7+ digits
- **isbn**: Valid ISBN-10 or ISBN-13 format

#### Data Quality Checks
- Duplicate detection (by name and image URL)
- Content consistency validation
- Business logic validation (e.g., books should have ISBN)

### Handling Validation Errors

**Critical Errors** (block import):
- Invalid required fields
- Data type mismatches
- Constraint violations

**Warnings** (don't block import):
- Missing optional fields
- Data quality issues
- Potential duplicates

## Backup and Rollback

### Automatic Backups
- Created before each import (unless disabled)
- Include full table snapshot
- Stored with metadata and timestamps

### Manual Backups
```javascript
// Create backup via API
POST /api/admin/backups/create
{
  "description": "Pre-migration backup"
}
```

### Rollback Process
1. Navigate to Import History
2. Find the import to rollback
3. Click "Rollback" and confirm
4. System restores from pre-import backup

### Backup Management
- View all backups: `/api/admin/backups`
- Verify backup integrity
- Clean up old backups automatically

## Error Handling

### Error Categories

#### Import Errors
- **Validation Errors**: Data doesn't meet requirements
- **Database Errors**: Constraint violations, connection issues
- **System Errors**: Timeouts, memory limits

#### Recovery Options
- **Retry**: For transient errors
- **Skip**: For individual record errors
- **Rollback**: For complete import failure

### Common Issues and Solutions

#### "Validation failed: Missing primary type"
**Solution**: Ensure all records have a valid `primary_type` field

#### "Database timeout during import"
**Solution**: Reduce batch size, check system load

#### "Memory limit exceeded"
**Solution**: Process file in smaller chunks

## Performance Optimization

### File Size Guidelines
- **< 1MB**: Single batch processing
- **1-10MB**: Standard batch processing
- **> 10MB**: Consider splitting file

### Optimal Settings
```javascript
// Recommended configurations
const settings = {
  small: { batchSize: 25, records: '<100' },
  medium: { batchSize: 50, records: '100-1000' },
  large: { batchSize: 100, records: '1000-5000' },
  xlarge: { batchSize: 200, records: '>5000' }
}
```

### Monitoring Performance
- Track records per second
- Monitor memory usage
- Watch for timeout patterns

## API Reference

### Import Endpoints
```javascript
// Start import
POST /api/admin/import/references
{
  "data": [...],
  "format": "firebase|json|csv",
  "options": {
    "createBackup": true,
    "batchSize": 50,
    "ignoreValidationErrors": false
  }
}

// Get progress
GET /api/admin/import/progress/{importId}

// List imports
GET /api/admin/import/list?status=completed&limit=20
```

### Backup Endpoints
```javascript
// List backups
GET /api/admin/backups

// Create backup
POST /api/admin/backups/create

// Restore backup
POST /api/admin/backups/{id}/restore

// Verify backup
GET /api/admin/backups/{id}/verify
```

## Security Considerations

### Access Control
- Admin role required for all import operations
- Session validation on all endpoints
- Audit logging for import activities

### Data Protection
- Automatic backups before destructive operations
- Validation prevents malicious data injection
- Transaction rollback on failures

### File Upload Security
- File type validation
- Size limits enforced
- Content scanning for malicious patterns

## Troubleshooting

### Common Problems

#### Import Stuck in "Processing"
1. Check server logs for errors
2. Verify database connectivity
3. Consider timeout issues

#### High Memory Usage
1. Reduce batch size
2. Process file in chunks
3. Clear browser cache

#### Validation Taking Too Long
1. Check file size and format
2. Verify data structure
3. Consider server performance

### Getting Help

1. **Check Logs**: Review import logs in the History tab
2. **Validation Report**: Download detailed validation report
3. **System Status**: Check database and server status
4. **Contact Support**: Provide import ID and error details

## Best Practices

### Before Import
- ✅ Always create backups
- ✅ Validate data thoroughly
- ✅ Test with small sample first
- ✅ Review data transformation

### During Import
- ✅ Monitor progress actively
- ✅ Don't close browser window
- ✅ Watch for error patterns
- ✅ Be patient with large files

### After Import
- ✅ Verify data integrity
- ✅ Test application functionality
- ✅ Clean up old backups
- ✅ Document any issues

### Production Imports
- ✅ Schedule during low-traffic periods
- ✅ Notify team members
- ✅ Have rollback plan ready
- ✅ Monitor system performance

## Testing

### Manual Testing Checklist
- [ ] Upload and validate Firebase JSON backup
- [ ] Upload and validate transformed JSON
- [ ] Upload and validate CSV file
- [ ] Test validation error handling
- [ ] Test import progress tracking
- [ ] Test backup creation and restoration
- [ ] Test rollback functionality
- [ ] Test large file handling
- [ ] Test error recovery

### Automated Testing
Run the test suite:
```bash
npm run test:import
```

## Maintenance

### Regular Tasks
- Clean up old import logs
- Verify backup integrity
- Monitor disk usage
- Update validation rules

### Performance Monitoring
- Track import success rates
- Monitor average import times
- Identify performance bottlenecks
- Optimize based on usage patterns
