# Verbatims Onboarding Guide

This guide explains how to set up your Verbatims quotes application from scratch using the manual onboarding system.

## Overview

Verbatims uses a manual onboarding flow to ensure secure setup of your quotes database. The process consists of two main steps:

1. **Admin User Creation** - Set up your administrator account
2. **Database Initialization** - Import data by uploading a dataset (ZIP export or quotes.json)

## Prerequisites

Before starting the onboarding process, ensure you have:

- A running Nuxt 3 application with NuxtHub and Cloudflare D1 configured
- An export ZIP produced by the Admin Export in Verbatims, or a `quotes.json` file if you want to import quotes only
- Environment variables properly configured (see below)

## Environment Variables

### Required for Admin User Creation

The onboarding system requires an admin authorization password for security. Set this environment variable:

```bash
ADMIN_PASSWORD=your-secure-admin-password
```

**Important Security Notes:**
- Choose a strong, unique password for `ADMIN_PASSWORD`
- This password is required during admin user creation to prevent unauthorized access
- If not set, the system will use a default password: `Verbatims@Admin2024!`
- Store this password securely and don't commit it to version control

### Optional User Defaults

You can also set default values for the admin user (these will be used if not provided during onboarding):

```bash
USER_USERNAME=admin
USER_EMAIL=admin@yourdomain.com
USER_PASSWORD=your-admin-user-password
```

## Onboarding Process

### Step 1: Admin User Creation

1. Navigate to your application's home page
2. If the database is empty, you'll see onboarding buttons
3. Click "1. Create Admin User" or go to `/onboarding/admin`
4. Fill in the form:
   - **Username**: Your admin username
   - **Email**: Your admin email address
   - **Password**: Your admin account password
   - **Confirm Password**: Confirm your admin password
   - **Admin Authorization Password**: Enter the `ADMIN_PASSWORD` from your environment variables

5. Click "Create Admin User"
6. Upon success, you'll be redirected to the database initialization step

### Step 2: Database Initialization

1. You'll be automatically redirected to `/onboarding/database` after admin user creation
2. Or navigate there manually if you already have an admin user
3. Upload your dataset using the file input:
   - Option A: Upload the ZIP export produced by the Admin Export feature (recommended)
   - Option B: Upload a single `quotes.json` file (array) to import quotes only
4. Click "Start Import" to begin
5. Monitor the live progress indicators for each step (SSE-driven)
6. Once complete, click "Go to Application" to start using Verbatims

## Dataset formats (uploads)

The onboarding system imports data from uploaded datasets:

### ZIP export (recommended)
- Produced by the Admin Export feature in Verbatims
- Supported filenames inside the ZIP (all are JSON arrays):
   - `users.json`
   - `authors.json`
   - `references.json`
   - `tags.json`
   - `quotes.json`
   - Optional relations/analytics: `quote_tags.json`, `user_collections.json`, `collection_quotes.json`, `user_likes.json`, `user_sessions.json`, `user_messages.json`, `quote_reports.json`, `quote_views.json`, `author_views.json`, `reference_views.json`

### Single-file import
- `quotes.json` (JSON array) — imports quotes only

Notes:
- If you upload only `quotes.json`, an Admin user must already exist in the database.
- If a dataset is not present in the upload, that step is marked completed with 0 items (no attempt to read repo backups).

## Data Import Process

The onboarding system directly imports the uploaded datasets without additional transformation:

### Direct Import
- Reads uploaded ZIP/JSON payload only (does not auto-read repository backups)
- Datasets are expected as JSON arrays with the same shapes as the Admin Export
- Handles optional fields with sensible defaults
- Maintains referential integrity when IDs are provided

### Import Order (when present)
1. `users.json`
2. `authors.json`
3. `references.json`
4. `tags.json`
5. `quotes.json` (and then `quote_tags.json` if present)
6. Optional: collections, likes, sessions/messages, analytics

### Progress Tracking
- Real-time progress updates via Server-Sent Events
- Batch processing for optimal performance
- Error handling with detailed logging
- Rollback capability if import fails

## Troubleshooting

### Common Issues

**"Invalid admin authorization password"**
- Ensure your `ADMIN_PASSWORD` environment variable is set correctly
- Check that you're entering the exact password from your environment

**"Database not available"**
- Verify your Cloudflare D1 database is properly configured
- Check your NuxtHub setup and database bindings

**"Import failed" errors**
- Ensure you uploaded a valid dataset:
   - ZIP produced by Admin Export, or
   - A single `quotes.json` containing a JSON array
- Verify JSON validity and array structure
- Review server logs for detailed error messages

**"Admin user already exists"**
- If you need to reset, you can delete the existing admin user from the database
- Or skip to Step 2 if you already have an admin user

**"Admin required for quotes-only"**
- When uploading only `quotes.json`, the system requires an existing Admin user
- Upload a ZIP that includes `users.json` to create the admin during import if needed

### Manual Reset

If you need to start over:

1. Clear your database tables (or recreate the database)
2. Restart your application
3. Navigate to the home page to begin onboarding again

## Security Considerations

- **Admin Authorization Password**: Keep this secure and don't share it
- **Database Access**: Ensure your Cloudflare D1 database has proper access controls
- **Environment Variables**: Use secure methods to manage environment variables in production
- **First Login**: Change default passwords immediately after first login

## Post-Onboarding

After successful onboarding:

1. Log in with your admin credentials at `/login`
2. Access the admin panel to manage quotes, authors, and references
3. Configure additional settings as needed
4. Set up user registration if you want to allow public submissions

## Support

If you encounter issues during onboarding:

1. Check the browser console for client-side errors
2. Review server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure the uploaded file is valid JSON (or a valid ZIP export)

For additional help, refer to the main project documentation or create an issue in the project repository.
