import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { token, repository } = await req.json();

  if (!token || !repository) {
    return NextResponse.json({ ok: false, message: "Token and repository required" });
  }

  const [owner, repo] = repository.split("/");
  if (!owner || !repo) {
    return NextResponse.json({ ok: false, message: "Repository must be in format: owner/repo" });
  }

  try {
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (!res.ok) {
      return NextResponse.json({ ok: false, message: "Repository not found or token invalid" });
    }

    const data = await res.json();
    return NextResponse.json({ ok: true, message: `Connected to ${data.full_name}` });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to reach GitHub API" });
  }
}
