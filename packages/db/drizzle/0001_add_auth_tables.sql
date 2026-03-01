-- Migration: Add NextAuth/DrizzleAdapter tables
-- BUG-001 fix: emailVerified on users, accounts, sessions, verificationTokens

-- Add emailVerified to existing users table if not present
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "emailVerified" timestamp;

CREATE TABLE IF NOT EXISTS "accounts" (
  "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "type" text NOT NULL,
  "provider" text NOT NULL,
  "providerAccountId" text NOT NULL,
  "refresh_token" text,
  "access_token" text,
  "expires_at" integer,
  "token_type" text,
  "scope" text,
  "id_token" text,
  "session_state" text,
  PRIMARY KEY ("provider", "providerAccountId")
);

CREATE TABLE IF NOT EXISTS "sessions" (
  "sessionToken" text PRIMARY KEY,
  "userId" text NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "expires" timestamp NOT NULL
);

CREATE TABLE IF NOT EXISTS "verificationTokens" (
  "identifier" text NOT NULL,
  "token" text NOT NULL,
  "expires" timestamp NOT NULL,
  PRIMARY KEY ("identifier", "token")
);
