import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { apiToken, teamId } = await req.json();

  if (!apiToken || !teamId) {
    return NextResponse.json({ ok: false, message: "API Token and Team ID required" });
  }

  try {
    const res = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        query: `query { team(id: "${teamId}") { id name } }`,
      }),
    });

    const data = await res.json();

    if (data.errors || !data.data?.team) {
      return NextResponse.json({ ok: false, message: "Invalid token or team ID" });
    }

    return NextResponse.json({ ok: true, message: `Connected to team: ${data.data.team.name}` });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to reach Linear API" });
  }
}
