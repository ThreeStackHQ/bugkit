import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db, reports, projects, integrations, eq, and, desc, inArray, sql } from "@bugkit/db";
import type { ConsoleLogEntry } from "@bugkit/db";
import { uploadToR2 } from "@/lib/r2";
import { validateProjectAccess } from "@/lib/api-auth";
import { auth as getSession } from "@/auth";
import { Octokit } from "@octokit/rest";

// ─── CORS ─────────────────────────────────────────────────────────────────────

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export async function OPTIONS(): Promise<Response> {
  return NextResponse.json({}, { headers: corsHeaders });
}

// ─── Validation ───────────────────────────────────────────────────────────────

const ConsoleLogSchema = z.object({
  level: z.enum(["log", "warn", "error", "info", "debug"]),
  message: z.string(),
  timestamp: z.number(),
});

const ReportBodySchema = z.object({
  project_id: z.string().uuid(),
  screenshot: z.string().min(1), // base64 PNG
  console_logs: z.array(ConsoleLogSchema).default([]),
  url: z.string().url().optional().default(""),
  user_agent: z.string().optional().default(""),
  metadata: z.record(z.string(), z.unknown()).optional().default({}),
  user_id: z.string().optional(),
  title: z.string().optional(),
  description: z.string().optional(),
});

// ─── Integration Types ────────────────────────────────────────────────────────

interface SlackConfig {
  webhookUrl?: string;
  channel?: string;
}

interface LinearConfig {
  apiKey?: string;
  teamId?: string;
}

interface GitHubConfig {
  token?: string;
  repo?: string;
}

// ─── Integration Notifiers ────────────────────────────────────────────────────

async function notifySlack(
  config: SlackConfig,
  report: {
    title: string | null;
    url: string | null;
    description: string | null;
  }
): Promise<void> {
  if (!config.webhookUrl) return;

  const payload = {
    text: "New bug report",
    attachments: [
      {
        color: "danger",
        title: report.title ?? "Untitled",
        text: report.description ?? undefined,
        fields: [
          { title: "Severity", value: "medium", short: true },
          { title: "URL", value: report.url ?? "N/A", short: true },
        ],
      },
    ],
  };

  await fetch(config.webhookUrl, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
}

async function notifyLinear(
  config: LinearConfig,
  report: {
    title: string | null;
    description: string | null;
    url: string | null;
    consoleLogs: ConsoleLogEntry[];
  }
): Promise<void> {
  if (!config.apiKey || !config.teamId) return;

  const descriptionMd = [
    report.description ?? "",
    "",
    `**Page URL:** ${report.url ?? "N/A"}`,
    "",
    report.consoleLogs.length > 0
      ? `**Console Logs:**\n\`\`\`\n${report.consoleLogs
          .map((l) => `[${l.level}] ${l.message}`)
          .join("\n")}\n\`\`\``
      : "",
  ]
    .join("\n")
    .trim();

  const mutation = `
    mutation IssueCreate($input: IssueCreateInput!) {
      issueCreate(input: $input) {
        success
      }
    }
  `;

  const variables = {
    input: {
      title: `Bug: ${report.title ?? "Untitled"}`,
      description: descriptionMd,
      teamId: config.teamId,
    },
  };

  await fetch("https://api.linear.app/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: config.apiKey,
    },
    body: JSON.stringify({ query: mutation, variables }),
  });
}

async function notifyGitHub(
  config: GitHubConfig,
  report: {
    title: string | null;
    description: string | null;
    url: string | null;
    screenshotUrl: string | null;
    consoleLogs: ConsoleLogEntry[];
  }
): Promise<void> {
  if (!config.token || !config.repo) return;

  const [owner, repo] = config.repo.split("/");
  if (!owner || !repo) return;

  const body = [
    report.description ?? "",
    "",
    `**Page URL:** ${report.url ?? "N/A"}`,
    "",
    report.screenshotUrl
      ? `**Screenshot:** ![screenshot](${report.screenshotUrl})`
      : "",
    "",
    report.consoleLogs.length > 0
      ? `**Console Logs:**\n\`\`\`\n${report.consoleLogs
          .map((l) => `[${l.level}] ${l.message}`)
          .join("\n")}\n\`\`\``
      : "",
  ]
    .join("\n")
    .trim();

  const octokit = new Octokit({ auth: config.token });

  await octokit.issues.create({
    owner,
    repo,
    title: report.title ?? "Untitled bug report",
    body,
    labels: ["bug"],
  });
}

async function fireIntegrationNotifications(
  projectId: string,
  report: {
    title: string | null;
    description: string | null;
    url: string | null;
    screenshotUrl: string | null;
    consoleLogs: ConsoleLogEntry[];
  }
): Promise<void> {
  try {
    const projectIntegrations = await db
      .select({ type: integrations.type, config: integrations.config })
      .from(integrations)
      .where(
        and(
          eq(integrations.projectId, projectId),
          eq(integrations.isActive, true)
        )
      );

    for (const integration of projectIntegrations) {
      const cfg = (integration.config ?? {}) as Record<string, unknown>;

      if (integration.type === "slack") {
        notifySlack(cfg as SlackConfig, report).catch(() => {});
      } else if (integration.type === "linear") {
        notifyLinear(cfg as LinearConfig, {
          ...report,
          consoleLogs: report.consoleLogs,
        }).catch(() => {});
      } else if (integration.type === "github") {
        notifyGitHub(cfg as GitHubConfig, report).catch(() => {});
      }
    }
  } catch {
    // Fire-and-forget: never fail the main request
  }
}

// ─── POST /api/reports ────────────────────────────────────────────────────────

export async function POST(req: NextRequest): Promise<Response> {
  try {
    // Parse body — accept both JSON and multipart/form-data
    let body: Record<string, unknown>;

    const contentType = req.headers.get("content-type") ?? "";
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      body = Object.fromEntries(form.entries()) as Record<string, unknown>;
      // FormData values are strings; parse JSON fields
      if (typeof body.console_logs === "string") {
        body.console_logs = JSON.parse(body.console_logs) as unknown[];
      }
      if (typeof body.metadata === "string") {
        body.metadata = JSON.parse(body.metadata) as Record<string, unknown>;
      }
    } else {
      body = (await req.json()) as Record<string, unknown>;
    }

    // Also check query param for project_id
    const url = new URL(req.url);
    if (!body.project_id && url.searchParams.has("project_id")) {
      body.project_id = url.searchParams.get("project_id");
    }

    const parsed = ReportBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422, headers: corsHeaders }
      );
    }

    const data = parsed.data;

    // ── Auth ─────────────────────────────────────────────────────────────
    const projectAccess = await validateProjectAccess(req, data.project_id);
    if (projectAccess instanceof Response) return projectAccess;

    // ── Upload screenshot to R2 ──────────────────────────────────────────
    // Strip data-URL prefix if present
    const base64Data = data.screenshot.replace(
      /^data:image\/\w+;base64,/,
      ""
    );
    const screenshotBuffer = Buffer.from(base64Data, "base64");
    const screenshotKey = `screenshots/${data.project_id}/${randomUUID()}.png`;
    const screenshotUrl = await uploadToR2(
      screenshotKey,
      screenshotBuffer,
      "image/png"
    );

    // ── Persist report ───────────────────────────────────────────────────
    const [report] = await db
      .insert(reports)
      .values({
        projectId: data.project_id,
        title: data.title ?? null,
        description: data.description ?? null,
        url: data.url,
        userAgent: data.user_agent,
        screenshotUrl,
        consoleLogs: data.console_logs as ConsoleLogEntry[],
        metadata: data.metadata,
        userId: data.user_id ?? null,
        status: "open",
      })
      .returning({
        id: reports.id,
        screenshotUrl: reports.screenshotUrl,
        title: reports.title,
        description: reports.description,
        url: reports.url,
        consoleLogs: reports.consoleLogs,
      });

    // ── Fire integration notifications (non-blocking) ────────────────────
    void fireIntegrationNotifications(data.project_id, {
      title: report.title,
      description: report.description,
      url: report.url,
      screenshotUrl: report.screenshotUrl,
      consoleLogs: (report.consoleLogs ?? []) as ConsoleLogEntry[],
    });

    return NextResponse.json(
      { reportId: report.id, screenshotUrl: report.screenshotUrl },
      { status: 201, headers: corsHeaders }
    );
  } catch (err) {
    console.error("[POST /api/reports]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}

// ─── GET /api/reports ─────────────────────────────────────────────────────────

export async function GET(req: NextRequest): Promise<Response> {
  try {
    const session = await getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: corsHeaders });
    }

    const url = new URL(req.url);
    const page = Math.max(1, parseInt(url.searchParams.get("page") ?? "1", 10));
    const limit = Math.min(100, Math.max(1, parseInt(url.searchParams.get("limit") ?? "20", 10)));
    const offset = (page - 1) * limit;
    const projectId = url.searchParams.get("project_id");
    const status = url.searchParams.get("status");

    // Get all project IDs belonging to the user
    const userProjects = await db
      .select({ id: projects.id })
      .from(projects)
      .where(eq(projects.userId, session.user.id));

    if (userProjects.length === 0) {
      return NextResponse.json({ reports: [], total: 0, page, limit }, { headers: corsHeaders });
    }

    const projectIds = userProjects.map((p) => p.id);

    // Build where conditions dynamically
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const conditions: any[] = [inArray(reports.projectId, projectIds)];

    if (projectId) {
      conditions.push(eq(reports.projectId, projectId));
    }

    if (status && ["open", "in_progress", "resolved", "closed"].includes(status)) {
      conditions.push(eq(reports.status, status as "open" | "in_progress" | "resolved" | "closed"));
    }

    const whereClause = and(...conditions);

    const [rows, countRows] = await Promise.all([
      db
        .select({
          id: reports.id,
          projectId: reports.projectId,
          title: reports.title,
          description: reports.description,
          url: reports.url,
          userAgent: reports.userAgent,
          userId: reports.userId,
          status: reports.status,
          screenshotUrl: reports.screenshotUrl,
          annotatedScreenshotUrl: reports.annotatedScreenshotUrl,
          createdAt: reports.createdAt,
          updatedAt: reports.updatedAt,
        })
        .from(reports)
        .where(whereClause)
        .orderBy(desc(reports.createdAt))
        .limit(limit)
        .offset(offset),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(reports)
        .where(whereClause),
    ]);

    const total = countRows[0]?.count ?? 0;

    return NextResponse.json(
      { reports: rows, total, page, limit, pages: Math.ceil(total / limit) },
      { headers: corsHeaders }
    );
  } catch (err) {
    console.error("[GET /api/reports]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500, headers: corsHeaders });
  }
}
