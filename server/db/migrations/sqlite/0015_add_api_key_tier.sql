-- Migration: Add tier column to api_keys for plan differentiation
-- Also increases the default rate limit for new free-tier keys

ALTER TABLE api_keys ADD COLUMN tier TEXT NOT NULL DEFAULT 'free' CHECK (tier IN ('free', 'pro', 'enterprise'));
