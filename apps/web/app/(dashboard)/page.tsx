import { auth } from "@/auth";
import { db, projects, reports, eq, and, sql, inArray } from "@bugkit/db";

async function getDashboardStats(userId: string) {
  // Get all projects for this user
  const userProjects = await db
    .select({ id: projects.id })
    .from(projects)
    .where(eq(projects.userId, userId));

  const projectCount = userProjects.length;

  if (projectCount === 0) {
    return { totalReports: 0, openReports: 0, projectCount: 0, recentReports: [] };
  }

  const projectIds = userProjects.map((p) => p.id);

  // Count all reports and open reports in one query
  const [counts, recentReports] = await Promise.all([
    db
      .select({
        total: sql<number>`count(*)::int`,
        open: sql<number>`count(*) filter (where ${reports.status} = 'open')::int`,
      })
      .from(reports)
      .where(inArray(reports.projectId, projectIds)),
    db
      .select({
        id: reports.id,
        title: reports.title,
        url: reports.url,
        status: reports.status,
        createdAt: reports.createdAt,
      })
      .from(reports)
      .where(inArray(reports.projectId, projectIds))
      .orderBy(sql`${reports.createdAt} desc`)
      .limit(5),
  ]);

  return {
    totalReports: counts[0]?.total ?? 0,
    openReports: counts[0]?.open ?? 0,
    projectCount,
    recentReports,
  };
}

export default async function DashboardPage() {
  const session = await auth();
  const userId = session?.user?.id;

  const stats = userId
    ? await getDashboardStats(userId)
    : { totalReports: 0, openReports: 0, projectCount: 0, recentReports: [] };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 mt-1">
          Welcome back, {session?.user?.name ?? session?.user?.email}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Total Reports</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.totalReports}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Open Reports</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.openReports}</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Projects</p>
          <p className="text-3xl font-bold text-white mt-1">{stats.projectCount}</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Recent Reports</h2>
        {stats.recentReports.length === 0 ? (
          <p className="text-zinc-500 text-sm">
            No reports yet. Create a project and install the widget to start
            capturing bugs.
          </p>
        ) : (
          <ul className="divide-y divide-zinc-800">
            {stats.recentReports.map((report) => (
              <li key={report.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm text-white font-medium truncate">
                    {report.title ?? "Untitled report"}
                  </p>
                  {report.url && (
                    <p className="text-xs text-zinc-500 truncate font-mono mt-0.5">
                      {report.url}
                    </p>
                  )}
                </div>
                <span
                  className={`flex-shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                    report.status === "open"
                      ? "bg-rose-500/10 text-rose-400"
                      : report.status === "in_progress"
                      ? "bg-amber-500/10 text-amber-400"
                      : "bg-emerald-500/10 text-emerald-400"
                  }`}
                >
                  {report.status}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
