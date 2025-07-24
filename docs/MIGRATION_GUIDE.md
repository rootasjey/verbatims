# Migration System Guide

This guide covers the modular migration system for migrating Firebase data to SQLite using the new architecture.

## Overview

The migration system has been refactored to support multiple migration types with a unified, extensible architecture. This allows for easy addition of new migration types while maintaining consistency and reliability.

## Migration Types

### 1. References Migration
Migrates quote references (books, films, TV series, etc.) from Firebase to SQLite.

**Command:**
```bash
node scripts/migrate-data.js references [options]
```

**Data Structure:**
- Firebase: `references-1752639132.json`
- SQL Table: `quote_references`
- Fields: name, primary_type, description, image_url, urls, etc.

### 2. Authors Migration
Migrates author information and biographies from Firebase to SQLite.

**Command:**
```bash
node scripts/migrate-data.js authors [options]
```

**Data Structure:**
- Firebase: `authors-1752638847.json`
- SQL Table: `authors`
- Fields: name, bio, birth_date, death_date, nationality, etc.

### 3. Quotes Migration
Migrates individual quotes linking authors and references from Firebase to SQLite.

**Command:**
```bash
node scripts/migrate-data.js quotes [options]
```

**Data Structure:**
- Firebase: `quotes_part_*.json` (10 files with ~1,901 total quotes)
- SQL Table: `quotes`
- Fields: name, language, author_id, reference_id, user_id, status, metrics, etc.
- Topics: Converted to tags system with quote_tags relationships

## Command Line Options

### Global Options
- `--help, -h` - Show help message
- `--list, -l` - List available migration types
- `--dry-run` - Validate data without importing
- `--verbose, -v` - Enable detailed output
- `--batch-size=N` - Set import batch size (default: 50)
- `--backup-path=PATH` - Custom backup file path

### Examples

```bash
# List available migrations
node scripts/migrate-data.js --list

# Dry run with verbose output
node scripts/migrate-data.js references --dry-run --verbose

# Custom batch size and backup path
node scripts/migrate-data.js authors --batch-size=25 --backup-path=custom/authors.json

# Full migration with progress tracking
node scripts/migrate-data.js references --verbose
```

## Migration Process

Each migration follows a standardized 5-step process:

### Step 1: Load Source Data
- Reads Firebase backup file
- Validates file format and structure
- Counts total records

### Step 2: Transform Data
- Converts Firebase format to SQL format
- Applies field mappings and transformations
- Handles data type conversions

### Step 3: Validate Data
- Runs type-specific validation rules
- Checks required fields and data integrity
- Generates validation warnings and errors

### Step 4: Import Data (if not dry run)
- Imports data in configurable batches
- Uses database transactions for safety
- Tracks import progress and errors

### Step 5: Generate Reports
- Creates validation reports
- Generates migration summaries
- Exports data in multiple formats (JSON, CSV, SQL)

## File Organization

The new system organizes files by migration type:

```
server/database/backups/
├── references/
│   ├── references-validation-report-2024-01-15T10-30-00-000Z.md
│   ├── references-migration-report-2024-01-15T10-30-00-000Z.md
│   ├── references-test-results-2024-01-15T10-30-00-000Z.json
│   ├── transformed-references-2024-01-15T10-30-00-000Z.json
│   ├── transformed-references-2024-01-15T10-30-00-000Z.csv
│   ├── transformed-references-2024-01-15T10-30-00-000Z.sql
│   └── archives/ (old files)
├── authors/
│   ├── authors-validation-report-2024-01-15T10-35-00-000Z.md
│   ├── authors-migration-report-2024-01-15T10-35-00-000Z.md
│   └── ... (similar structure)
└── file-organization-report-2024-01-15T10-25-00-000Z.md
```

## Legacy File Migration

The system automatically migrates legacy files to the new structure:

- `test-results.json` → `server/database/backups/references/references-test-results-{timestamp}.json`
- `validation-report.md` → `server/database/backups/references/references-validation-report-{timestamp}.md`

## Validation and Quality Metrics

### References Validation
- Primary type validation (film, book, tv_series, etc.)
- URL format validation (IMDB, Spotify, image URLs)
- Date validation (release dates)
- Duplicate detection

### Authors Validation
- Birth/death date consistency
- URL format validation (Wikipedia, website)
- Biography completeness
- Fictional vs real person validation

### Quality Metrics
Each migration generates detailed quality metrics:
- Completeness scores
- Field-by-field analysis
- Distribution analysis
- Error and warning rates

## Error Handling

### Validation Errors
- **Critical Errors**: Block migration, must be fixed
- **Warnings**: Non-blocking, logged for review
- **Transformation Errors**: Skip individual records, continue migration

### Recovery
- All operations create backups
- Dry run mode for safe testing
- Detailed error logging
- Rollback capabilities (via admin interface)

## Extending the System

### Adding a New Migration Type

1. **Create Configuration** in `MigrationConfig.js`:
```javascript
newtype: {
  tableName: 'new_table',
  requiredFields: ['field1', 'field2'],
  validationRules: { /* rules */ },
  transformationMappings: { /* mappings */ }
}
```

2. **Create Validator** (`validators/NewTypeValidator.js`):
```javascript
export class NewTypeValidator extends BaseValidator {
  validateRecordCustom(record, index) {
    // Custom validation logic
  }
}
```

3. **Create Transformer** (`transformers/NewTypeTransformer.js`):
```javascript
export class NewTypeTransformer extends BaseTransformer {
  async transformRecordCustom(firebaseId, firebaseRecord, sqlRecord) {
    // Custom transformation logic
  }
}
```

4. **Create Migration** (`types/NewTypeMigration.js`):
```javascript
export class NewTypeMigration extends BaseMigrator {
  constructor(options = {}) {
    super('newtype', options)
    this.validator = new NewTypeValidator()
    this.transformer = new NewTypeTransformer()
  }
  
  getTableName() {
    return 'new_table'
  }
}
```

5. **Register in Registry** (`MigrationRegistry.js`):
```javascript
const { NewTypeMigration } = await import('../types/NewTypeMigration.js')
this.register('newtype', NewTypeMigration)
```

## Best Practices

### Before Migration
1. Always run with `--dry-run` first
2. Review validation reports carefully
3. Check file organization and paths
4. Ensure database backups exist

### During Migration
1. Use `--verbose` for detailed progress
2. Monitor batch processing
3. Watch for error patterns
4. Keep terminal output for debugging

### After Migration
1. Review migration reports
2. Verify data integrity
3. Check quality metrics
4. Archive old files
5. Update documentation

## Troubleshooting

### Common Issues

**Migration Registry Errors**
- Ensure all migration files are properly imported
- Check for syntax errors in migration classes
- Verify inheritance from base classes

**File Path Issues**
- Use absolute paths for custom backup files
- Check file permissions
- Ensure backup directories exist

**Database Connection Issues**
- Verify NuxtHub configuration
- Check Cloudflare D1 connection
- Ensure proper database schema

**Validation Failures**
- Review validation reports for specific errors
- Check data format consistency
- Verify required fields are present

### Getting Help

1. Check migration reports in `server/database/backups/`
2. Run with `--verbose` for detailed output
3. Review error logs and stack traces
4. Use `--dry-run` to test without side effects
5. Check the admin interface for additional tools

## Migration Checklist

- [ ] Run `node scripts/migrate-data.js --list` to verify system
- [ ] Test with `--dry-run` first
- [ ] Review validation reports
- [ ] Check file organization
- [ ] Run actual migration with `--verbose`
- [ ] Verify data in database
- [ ] Review quality metrics
- [ ] Archive old files
- [ ] Update documentation
