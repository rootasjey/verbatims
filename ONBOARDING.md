# Verbatims Onboarding Guide

This guide explains how to set up your Verbatims quotes application from scratch using the manual onboarding system.

## Overview

Verbatims uses a manual onboarding flow to ensure secure setup of your quotes database. The process consists of two main steps:

1. **Admin User Creation** - Set up your administrator account
2. **Database Initialization** - Import quotes, authors, and references from backup files

## Prerequisites

Before starting the onboarding process, ensure you have:

- A running Nuxt 3 application with NuxtHub and Cloudflare D1 configured
- Access to the backup data files in `/server/database/backups/`
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
3. Click "Start Import" to begin the database population process
4. The system will import data in this order:
   - **Authors** from `authors-1752638847.json`
   - **References** from `references-1752639132.json`
   - **Quotes** from `quotes_part_*.json` files (10 files total)

5. Monitor the progress indicators for each import step
6. Once complete, click "Go to Application" to start using Verbatims

## Backup Data Structure

The onboarding system imports data from Firebase backup files located in `/server/database/backups/`:

### Authors
- **File**: `authors-1752638847.json`
- **Format**: Firebase export with nested author objects
- **Fields**: name, bio, birth/death dates, nationality, job, URLs, etc.

### References
- **File**: `references-1752639132.json`
- **Format**: Firebase export with nested reference objects
- **Fields**: name, type, release date, description, URLs, etc.

### Quotes
- **Files**: `quotes_part_1.json` through `quotes_part_10.json`
- **Format**: Firebase export with nested quote objects
- **Fields**: text, language, author reference, metrics, topics, etc.

## Troubleshooting

### Common Issues

**"Invalid admin authorization password"**
- Ensure your `ADMIN_PASSWORD` environment variable is set correctly
- Check that you're entering the exact password from your environment

**"Database not available"**
- Verify your Cloudflare D1 database is properly configured
- Check your NuxtHub setup and database bindings

**"Import failed" errors**
- Ensure backup files exist in `/server/database/backups/`
- Check file permissions and JSON format validity
- Review server logs for detailed error messages

**"Admin user already exists"**
- If you need to reset, you can delete the existing admin user from the database
- Or skip to Step 2 if you already have an admin user

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

1. Log in with your admin credentials at `/auth/signin`
2. Access the admin panel to manage quotes, authors, and references
3. Configure additional settings as needed
4. Set up user registration if you want to allow public submissions

## Support

If you encounter issues during onboarding:

1. Check the browser console for client-side errors
2. Review server logs for detailed error messages
3. Verify all environment variables are set correctly
4. Ensure backup files are present and valid JSON

For additional help, refer to the main project documentation or create an issue in the project repository.
