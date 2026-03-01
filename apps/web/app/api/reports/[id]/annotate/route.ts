import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { randomUUID } from "crypto";
import sharp from "sharp";
import { db, reports } from "@bugkit/db";
import { eq } from "drizzle-orm";
import { uploadToR2, downloadFromR2 } from "@/lib/r2";
import { validateReportOwnership } from "@/lib/api-auth";

// ─── Validation ───────────────────────────────────────────────────────────────

const RectangleSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
  color: z.string().default("#ef4444"),
});

const ArrowSchema = z.object({
  x1: z.number(),
  y1: z.number(),
  x2: z.number(),
  y2: z.number(),
  color: z.string().default("#ef4444"),
});

const BlurSchema = z.object({
  x: z.number(),
  y: z.number(),
  w: z.number().positive(),
  h: z.number().positive(),
});

const AnnotationBodySchema = z.object({
  rectangles: z.array(RectangleSchema).default([]),
  arrows: z.array(ArrowSchema).default([]),
  blurs: z.array(BlurSchema).default([]),
});

// ─── Helpers ──────────────────────────────────────────────────────────────────

/**
 * Build an SVG string that overlays rectangles + arrows on an image.
 */
function buildSvgOverlay(
  width: number,
  height: number,
  rectangles: z.infer<typeof RectangleSchema>[],
  arrows: z.infer<typeof ArrowSchema>[]
): Buffer {
  const rectElements = rectangles
    .map(
      (r) =>
        `<rect x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" ` +
        `fill="none" stroke="${r.color}" stroke-width="3" />`
    )
    .join("\n");

  const arrowElements = arrows
    .map((a) => {
      // Draw line + arrowhead marker
      const markerId = `arrow-${randomUUID().slice(0, 8)}`;
      return (
        `<defs>` +
        `<marker id="${markerId}" viewBox="0 0 10 10" refX="10" refY="5" ` +
        `markerUnits="strokeWidth" markerWidth="8" markerHeight="6" orient="auto">` +
        `<path d="M 0 0 L 10 5 L 0 10 z" fill="${a.color}" />` +
        `</marker></defs>` +
        `<line x1="${a.x1}" y1="${a.y1}" x2="${a.x2}" y2="${a.y2}" ` +
        `stroke="${a.color}" stroke-width="3" marker-end="url(#${markerId})" />`
      );
    })
    .join("\n");

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
${rectElements}
${arrowElements}
</svg>`;
  return Buffer.from(svg);
}

// ─── POST /api/reports/[id]/annotate ─────────────────────────────────────────

export async function POST(
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
        screenshotUrl: reports.screenshotUrl,
      })
      .from(reports)
      .where(eq(reports.id, reportId))
      .limit(1);

    if (!report) {
      return NextResponse.json({ error: "Report not found" }, { status: 404 });
    }

    // Auth
    const authResult = await validateReportOwnership(req, report.projectId);
    if (authResult instanceof Response) return authResult;

    if (!report.screenshotUrl) {
      return NextResponse.json(
        { error: "Report has no screenshot to annotate" },
        { status: 400 }
      );
    }

    // Parse body
    const body: unknown = await req.json();
    const parsed = AnnotationBodySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", issues: parsed.error.issues },
        { status: 422 }
      );
    }

    const { rectangles, arrows, blurs } = parsed.data;

    // Download original screenshot
    const originalBuffer = await downloadFromR2(report.screenshotUrl);
    const image = sharp(originalBuffer);
    const { width = 1280, height = 800 } = await image.metadata();

    // ── Step 1: Apply blur regions ──────────────────────────────────────
    let processedBuffer = originalBuffer;

    for (const blur of blurs) {
      // Clamp coordinates to image bounds
      const bx = Math.max(0, Math.round(blur.x));
      const by = Math.max(0, Math.round(blur.y));
      const bw = Math.min(Math.round(blur.w), width - bx);
      const bh = Math.min(Math.round(blur.h), height - by);

      if (bw <= 0 || bh <= 0) continue;

      // Extract, blur, and composite back
      const blurredRegion = await sharp(processedBuffer)
        .extract({ left: bx, top: by, width: bw, height: bh })
        .blur(20)
        .toBuffer();

      processedBuffer = await sharp(processedBuffer)
        .composite([{ input: blurredRegion, left: bx, top: by }])
        .toBuffer();
    }

    // ── Step 2: Composite SVG overlay (rectangles + arrows) ─────────────
    if (rectangles.length > 0 || arrows.length > 0) {
      const svgOverlay = buildSvgOverlay(width, height, rectangles, arrows);
      processedBuffer = await sharp(processedBuffer)
        .composite([{ input: svgOverlay, blend: "over" }])
        .png()
        .toBuffer();
    }

    // ── Step 3: Upload annotated image ───────────────────────────────────
    const annotatedKey = `screenshots/${report.projectId}/annotated-${reportId}.png`;
    const annotatedUrl = await uploadToR2(
      annotatedKey,
      processedBuffer,
      "image/png"
    );

    // ── Step 4: Update report ────────────────────────────────────────────
    await db
      .update(reports)
      .set({ annotatedScreenshotUrl: annotatedUrl })
      .where(eq(reports.id, reportId));

    return NextResponse.json({ annotatedScreenshotUrl: annotatedUrl });
  } catch (err) {
    console.error("[POST /api/reports/[id]/annotate]", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
