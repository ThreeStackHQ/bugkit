export const dynamic = "force-dynamic";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { db, projects, integrations, eq, and } from "@bugkit/db";

const PostSchema = z.object({
  projectId: z.string().uuid(),
  apiKey: z.string().min(1),
  teamId: z.string().min(1),
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

function maskKey(key: string): string {
  if (key.length <= 4) return "****";
  return `****${key.slice(-4)}`;
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

  const { projectId, apiKey, teamId } = parsed.data;

  const isOwner = await getProjectOwnership(projectId, session.user.id);
  if (!isOwner) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await db
    .delete(integrations)
    .where(
      and(
        eq(integrations.projectId, projectId),
        eq(integrations.type, "linear")
      )
    );

  await db.insert(integrations).values({
    projectId,
    type: "linear",
    config: { apiKey, teamId },
    isActive: true,
  });

  return NextResponse.json(
    { ok: true, maskedApiKey: maskKey(apiKey) },
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
        eq(integrations.type, "linear")
      )
    )
    .limit(1);

  if (!integration) {
    return NextResponse.json({ integration: null }, { status: 200 });
  }

  const cfg = integration.config as { apiKey?: string; teamId?: string };
  return NextResponse.json({
    integration: {
      maskedApiKey: cfg.apiKey ? maskKey(cfg.apiKey) : null,
      teamId: cfg.teamId ?? null,
      isActive: integration.isActive,
    },
  });
}
