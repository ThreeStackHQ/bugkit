import { NextRequest, NextResponse } from "next/server";
import { db, reports } from "@bugkit/db";
import type { ConsoleLogEntry } from "@bugkit/db";
import { eq } from "drizzle-orm";
import { validateReportOwnership } from "@/lib/api-auth";

// ─── GET /api/reports/[id]/console-logs ──────────────────────────────────────

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
): Promise<Response> {
  try {
    const reportId = params.id;

    // Fetch report
    const [report] = await db
      .select({
        id: reports.id,
        projectId: reports.projectId,
        consoleLogs: reports.consoleLogs,
      })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Auth — user must own the project
    const authResult = await validateReportOwnership(req, report.projectId);
    if (authResult instanceof Response) return authResult;

    const logs = (report.consoleLogs ?? []) as ConsoleLogEntry[];

    return NextResponse.json({
      reportId,
      count: logs.length,
      consoleLogs: logs,
    });
  } catch (err) {
    console.error("[GET /api/reports/[id]/console-logs]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
