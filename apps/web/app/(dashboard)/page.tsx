import { auth } from "@/auth";

export default async function DashboardPage() {
  const session = await auth();

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
          <p className="text-3xl font-bold text-white mt-1">0</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Open Reports</p>
          <p className="text-3xl font-bold text-white mt-1">0</p>
        </div>
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
          <p className="text-zinc-400 text-sm">Projects</p>
          <p className="text-3xl font-bold text-white mt-1">0</p>
        </div>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
        <h2 className="text-white font-semibold mb-4">Recent Reports</h2>
        <p className="text-zinc-500 text-sm">
          No reports yet. Create a project and install the widget to start
          capturing bugs.
        </p>
      </div>
    </div>
  );
}
