-- Add password field to users table for email/password authentication
-- This field is optional to support both OAuth and email/password users
ALTER TABLE users ADD COLUMN password TEXT;
