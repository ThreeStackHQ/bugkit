import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const { reportId, title, description, apiToken, teamId, status } = await req.json();

  if (!apiToken || !teamId || !title) {
    return NextResponse.json({ ok: false, message: "Missing required fields" });
  }

  try {
    // Get workflow states for the team
    const statesRes = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        query: `query { workflowStates(filter: { team: { id: { eq: "${teamId}" } } }) { nodes { id name } } }`,
      }),
    });

    const statesData = await statesRes.json();
    const states = statesData.data?.workflowStates?.nodes || [];
    const targetState = states.find((s: { name: string }) =>
      s.name.toLowerCase().includes((status || "todo").toLowerCase())
    );

    // Create the issue
    const createRes = await fetch("https://api.linear.app/graphql", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiToken}`,
      },
      body: JSON.stringify({
        query: `mutation IssueCreate($input: IssueCreateInput!) { issueCreate(input: $input) { success issue { id identifier url } } }`,
        variables: {
          input: {
            teamId,
            title: `🐛 ${title}`,
            description: `${description}\n\n---\n**BugKit Report ID:** ${reportId}\n**View in BugKit:** https://app.bugkit.threestack.io/reports/${reportId}`,
            stateId: targetState?.id,
          },
        },
      }),
    });

    const createData = await createRes.json();

    if (!createData.data?.issueCreate?.success) {
      return NextResponse.json({ ok: false, message: "Failed to create Linear issue" });
    }

    return NextResponse.json({
      ok: true,
      issue: createData.data.issueCreate.issue,
    });
  } catch {
    return NextResponse.json({ ok: false, message: "Failed to reach Linear API" });
  }
}
