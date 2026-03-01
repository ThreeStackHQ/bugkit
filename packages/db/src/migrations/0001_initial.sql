-- BugKit initial schema migration

CREATE TYPE "report_status" AS ENUM ('open', 'in_progress', 'resolved', 'closed');
CREATE TYPE "integration_type" AS ENUM ('slack', 'linear', 'github');
CREATE TYPE "subscription_tier" AS ENUM ('free', 'pro', 'business');

CREATE TABLE IF NOT EXISTS "users" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "email" text NOT NULL UNIQUE,
  "name" text,
  "image" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "projects" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name" text NOT NULL,
  "slug" text NOT NULL UNIQUE,
  "api_key" text NOT NULL UNIQUE,
  "settings" jsonb DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "reports" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "title" text NOT NULL,
  "description" text,
  "screenshot_url" text,
  "console_logs" jsonb DEFAULT '[]',
  "user_agent" text,
  "url" text,
  "status" "report_status" NOT NULL DEFAULT 'open',
  "notes" text,
  "metadata" jsonb DEFAULT '{}',
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "report_attachments" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "report_id" uuid NOT NULL REFERENCES "reports"("id") ON DELETE CASCADE,
  "file_url" text NOT NULL,
  "file_type" text,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "integrations" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "project_id" uuid NOT NULL REFERENCES "projects"("id") ON DELETE CASCADE,
  "type" "integration_type" NOT NULL,
  "config" jsonb DEFAULT '{}',
  "is_active" boolean NOT NULL DEFAULT true,
  "created_at" timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS "subscriptions" (
  "id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
  "user_id" uuid NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "tier" "subscription_tier" NOT NULL DEFAULT 'free',
  "status" text NOT NULL DEFAULT 'active',
  "stripe_customer_id" text,
  "stripe_subscription_id" text,
  "current_period_end" timestamptz,
  "created_at" timestamptz NOT NULL DEFAULT now(),
  "updated_at" timestamptz NOT NULL DEFAULT now()
);
