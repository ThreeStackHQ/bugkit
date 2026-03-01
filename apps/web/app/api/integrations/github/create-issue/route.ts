import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { reportId, title, description, screenshotUrl, consoleLogsUrl, token, repository, assignee } = await req.json();

  if (!token || !repository || !title) {
    return NextResponse.json({ ok: false, message: "Missing required fields" });
  }

  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    return NextResponse.json({ ok: false, message: "Invalid repository format" });
  }

  try {
    const body = [
      "## Bug Report",
      "",
      description || "No description provided.",
      "",
      "---",
      "",
      `**BugKit Report ID:** \`${reportId}\``,
      `**View in BugKit:** https://app.bugkit.threestack.io/reports/${reportId}`,
      screenshotUrl ? `\n**Screenshot:**\n![Screenshot](${screenshotUrl})` : "",
      consoleLogsUrl ? `\n**Console Logs:** [View logs](${consoleLogsUrl})` : "",
    ].filter(Boolean).join("\n");

    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}/issues`, {
      method: "POST",
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        title: `🐛 ${title}`,
        body,
        labels: ["bug", "bugkit"],
        assignees: assignee ? [assignee] : undefined,
      }),
    });

    if (!res.ok) {
      const err = await res.json();
      return NextResponse.json({ ok: false, message: err.message || "Failed to create issue" });
    }

    const issue = await res.json();
    return NextResponse.json({ ok: true, issue: { id: issue.id, number: issue.number, url: issue.html_url } });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to reach GitHub API" });
  }
}
