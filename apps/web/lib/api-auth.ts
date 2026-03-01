import { NextRequest } from "next/server";
import { auth } from "@/auth";
import { db, projects, users } from "@bugkit/db";
import { eq } from "drizzle-orm";

export interface AuthResult {
  userId: string;
  projectId: string;
}

/**
 * Validate that the caller owns the given project.
 * Supports two auth methods:
 *  1. Bearer <api_key>  — API key from the project row
 *  2. NextAuth session  — JWT cookie
 *
 * Returns AuthResult on success or a Response on failure.
 */
export async function validateProjectAccess(
  req: NextRequest,
  projectId: string
): Promise<AuthResult | Response> {
  // ── 1. Try API-key auth ───────────────────────────────────────────────
  const authHeader = req.headers.get("authorization") ?? "";
  if (authHeader.startsWith("Bearer ")) {
    const apiKey = authHeader.slice(7).trim();
    const [project] = await db
      .select({ id: projects.id, userId: projects.userId })
      .from(projects)
      .where(eq(projects.apiKey, apiKey))
      .limit(1);

    if (!project) {
      return new Response(
        JSON.stringify({ error: "Invalid API key" }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    if (project.id !== projectId) {
      return new Response(
        JSON.stringify({ error: "API key does not match project" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }

    return { userId: project.userId, projectId: project.id };
  }

  // ── 2. Try session auth ──────────────────────────────────────────────
  const session = await auth();
  if (!session?.user?.id) {
    return new Response(
      JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { "Content-Type": "application/json" } }
    );
  }

  const [project] = await db
    .select({ id: projects.id, userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);

  if (!project) {
    return new Response(
      JSON.stringify({ error: "Project not found" }),
      { status: 404, headers: { "Content-Type": "application/json" } }
    );
  }

  if (project.userId !== session.user.id) {
    return new Response(
      JSON.stringify({ error: "Forbidden" }),
      { status: 403, headers: { "Content-Type": "application/json" } }
    );
  }

  return { userId: session.user.id, projectId: project.id };
}

/**
 * Validate a user owns the project that a report belongs to.
 * Used for report-specific endpoints (annotation, console-logs).
 */
export async function validateReportOwnership(
  req: NextRequest,
  reportProjectId: string
): Promise<AuthResult | Response> {
  return validateProjectAccess(req, reportProjectId);
}
