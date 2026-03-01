import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { Sidebar } from "@/components/sidebar";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-white">
      {/* Desktop sidebar (fixed) */}
      <Sidebar
        user={{
          name: session.user.name,
          email: session.user.email,
          image: session.user.image,
        }}
      />

      {/* Main content — offset by sidebar on lg+ */}
      <div className="lg:pl-60 flex flex-col min-h-screen">
        {/* Top header */}
        <header className="hidden lg:flex h-14 items-center justify-between px-8 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur sticky top-0 z-20">
          <div className="flex items-center gap-2 text-sm text-zinc-400">
            <span>BugKit</span>
            <span>/</span>
            <span className="text-white font-medium">Dashboard</span>
          </div>
          <div className="flex items-center gap-3">
            {session.user.image ? (
              <img
                src={session.user.image}
                alt="Avatar"
                className="w-8 h-8 rounded-full ring-2 ring-zinc-700"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center">
                <span className="text-xs font-bold text-rose-400">
                  {(session.user.name ?? session.user.email ?? "?")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </header>

        {/* Page content with mobile top-padding for sticky header */}
        <main className="flex-1 pt-14 lg:pt-0">
          {children}
        </main>
      </div>
    </div>
  );
}
