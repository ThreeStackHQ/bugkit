// Client
export { db } from "./client";
export type { Database } from "./client";

// Schema
export {
  // Tables
  users,
  projects,
  reports,
  reportAttachments,
  integrations,
  subscriptions,
  // Enums
  reportStatusEnum,
  integrationTypeEnum,
  subscriptionTierEnum,
  // Relations
  usersRelations,
  projectsRelations,
  reportsRelations,
  reportAttachmentsRelations,
  integrationsRelations,
  subscriptionsRelations,
} from "./schema";

// Types
export type { ConsoleLogEntry } from "./schema";

// Drizzle helpers re-exported
export { eq, and, or, desc, asc, sql, inArray, isNull, isNotNull } from "drizzle-orm";
