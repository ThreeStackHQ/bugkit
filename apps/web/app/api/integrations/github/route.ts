export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, projects, integrations, eq, and } from "@bugkit/db";

const PostSchema = z.object({
  projectId: z.string().uuid(),
  token: z.string().min(1),
  repo: z
    .string()
    .regex(/^[\w.-]+\/[\w.-]+$/, 'Must be in format owner/repo'),
});

async function getProjectOwnership(
  projectId: string,
  userId: string
): Promise<boolean> {
  const [project] = await db
    .select({ userId: projects.userId })
    .from(projects)
    .where(eq(projects.id, projectId))
    .limit(1);
  return project?.userId === userId;
}

function maskToken(token: string): string {
  if (token.length <= 4) return "****";
  return `****${token.slice(-4)}`;
}

export async function POST(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const parsed = PostSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const { projectId, token, repo } = parsed.data;

  const isOwner = await getProjectOwnership(projectId, session.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .delete(integrations)
    .where(
      and(
        eq(integrations.projectId, projectId),
        eq(integrations.type, "github")
      )
    );

  await db.insert(integrations).values({
    projectId,
    type: "github",
    config: { token, repo },
    isActive: true,
  });

  return NextResponse.json(
    { ok: true, maskedToken: maskToken(token) },
    { status: 200 }
  );
}

export async function GET(req: NextRequest): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = new URL(req.url);
  const projectId = url.searchParams.get("projectId");
  if (!projectId) {
    return NextResponse.json(
      { error: "projectId is required" },
      { status: 422 }
    );
  }

  const isOwner = await getProjectOwnership(projectId, session.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const [integration] = await db
    .select({ config: integrations.config, isActive: integrations.isActive })
    .from(integrations)
    .where(
      and(
        eq(integrations.projectId, projectId),
        eq(integrations.type, "github")
      )
    )
    .limit(1);

  if (!integration) {
    return NextResponse.json({ integration: null }, { status: 200 });
  }

  const cfg = integration.config as { token?: string; repo?: string };
  return NextResponse.json({
    integration: {
      maskedToken: cfg.token ? maskToken(cfg.token) : null,
      repo: cfg.repo ?? null,
      isActive: integration.isActive,
    },
  });
}
