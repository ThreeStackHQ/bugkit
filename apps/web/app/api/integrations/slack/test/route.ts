import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { webhookUrl } = await req.json();

  if (!webhookUrl || !webhookUrl.startsWith("https://hooks.slack.com/")) {
    return NextResponse.json({ ok: false, message: "Invalid Slack webhook URL" });
  }

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "✅ BugKit test notification — your Slack integration is working!",
        attachments: [{
          color: "#e11d48",
          title: "Test Report",
          text: "This is a test notification from BugKit to verify your webhook configuration.",
        }],
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, message: "Slack returned an error" });
    }

    return NextResponse.json({ ok: true, message: "Test notification sent to Slack!" });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to reach Slack" });
  }
}
