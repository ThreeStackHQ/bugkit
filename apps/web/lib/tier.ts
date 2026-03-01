import { db, subscriptions, projects, eq } from "@bugkit/db";
import { count } from "drizzle-orm";

type Tier = "free" | "pro" | "business";

export async function getUserTier(userId: string): Promise<Tier> {
  const [sub] = await db
    .select({ tier: subscriptions.tier, status: subscriptions.status })
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (!sub || sub.status !== "active") {
    return "free";
  }

  return sub.tier as Tier;
}

export async function canCreateProject(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);

  if (tier === "business") return true;

  const [result] = await db
    .select({ cnt: count() })
    .from(projects)
    .where(eq(projects.userId, userId));

  const projectCount = Number(result?.cnt ?? 0);

  if (tier === "free") return projectCount < 1;
  if (tier === "pro") return projectCount < 5;

  return false;
}

export async function canUseSlack(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "pro" || tier === "business";
}

export async function canUseLinear(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "business";
}

export async function canUseGitHub(userId: string): Promise<boolean> {
  const tier = await getUserTier(userId);
  return tier === "business";
}
