import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { webhookUrl, report } = await req.json();

  if (!webhookUrl || !report) {
    return NextResponse.json({ ok: false, message: "Missing required fields" });
  }

  try {
    await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: `🐛 New Bug Report: *${report.title || "Untitled"}*`,
        attachments: [{
          color: "#e11d48",
          title: report.title || "Bug Report",
          title_link: `https://app.bugkit.threestack.io/reports/${report.id}`,
          text: report.description || "No description provided",
          fields: [
            { title: "Reporter", value: report.userEmail || "Anonymous", short: true },
            { title: "Status", value: "Open", short: true },
          ],
          footer: "BugKit",
          ts: Math.floor(Date.now() / 1000),
        }],
      }),
    });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to send notification" });
  }
}
