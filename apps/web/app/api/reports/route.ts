import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import { db, reports } from "@bugkit/db";
import type { ConsoleLogEntry } from "@bugkit/db";
import { uploadToR2 } from "@/lib/r2";
import { validateProjectAccess } from "@/lib/api-auth";

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
});

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
        { status: 422 }
      );
    }

    const data = parsed.data;

    // ── Auth ─────────────────────────────────────────────────────────────
    const auth = await validateProjectAccess(req, data.project_id);
    if (auth instanceof Response) return auth;

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
        url: data.url,
        userAgent: data.user_agent,
        screenshotUrl,
        consoleLogs: data.console_logs as ConsoleLogEntry[],
        metadata: data.metadata,
        userId: data.user_id ?? null,
        status: "open",
      })
      .returning({ id: reports.id, screenshotUrl: reports.screenshotUrl });

    return NextResponse.json(
      { reportId: report.id, screenshotUrl: report.screenshotUrl },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/reports]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
