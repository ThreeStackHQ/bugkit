"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { useState } from "react";
import { signOut } from "next-auth/react";
import {
  Bug,
  FileText,
  FolderOpen,
  Puzzle,
  Settings,
  Menu,
  X,
  ChevronRight,
  LogOut,
} from "lucide-react";

const navItems = [
  {
    href: "/reports",
    label: "Reports",
    icon: FileText,
    badge: "12",
  },
  {
    href: "/projects",
    label: "Projects",
    icon: FolderOpen,
  },
  {
    href: "/integrations",
    label: "Integrations",
    icon: Puzzle,
  },
  {
    href: "/settings",
    label: "Settings",
    icon: Settings,
  },
];

interface SidebarProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
  };
  breadcrumb?: string;
}

export function Sidebar({ user, breadcrumb }: SidebarProps) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  const initials = user.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : (user.email?.[0] ?? "?").toUpperCase();

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 py-5 border-b border-zinc-800">
        <div className="w-8 h-8 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center flex-shrink-0">
          <Bug className="w-4 h-4 text-rose-500" />
        </div>
        <span className="font-bold text-white tracking-tight">BugKit</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 flex flex-col gap-0.5">
        {navItems.map(({ href, label, icon: Icon, badge }) => {
          const active =
            pathname === href || pathname.startsWith(href + "/");
          return (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-rose-500/10 text-rose-400 border border-rose-500/20"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
              }`}
            >
              <Icon className="w-4 h-4 flex-shrink-0" />
              <span className="flex-1">{label}</span>
              {badge && (
                <span
                  className={`text-xs font-semibold px-1.5 py-0.5 rounded-full ${
                    active
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-zinc-700 text-zinc-300"
                  }`}
                >
                  {badge}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      {/* User */}
      <div className="px-3 pb-4 border-t border-zinc-800 pt-4">
        <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-zinc-900">
          {user.image ? (
            <img
              src={user.image}
              alt="Avatar"
              className="w-8 h-8 rounded-full ring-2 ring-zinc-700 flex-shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-rose-500/20 border border-rose-500/30 flex items-center justify-center flex-shrink-0">
              <span className="text-xs font-bold text-rose-400">{initials}</span>
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white truncate">
              {user.name ?? user.email}
            </p>
            {user.name && (
              <p className="text-xs text-zinc-500 truncate">{user.email}</p>
            )}
          </div>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="p-1.5 rounded-md text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 transition-colors"
            title="Sign out"
          >
            <LogOut className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex w-60 flex-col bg-[#0f172a] border-r border-zinc-800 fixed inset-y-0 left-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 inset-x-0 z-40 flex items-center justify-between px-4 h-14 bg-[#0f172a] border-b border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
            <Bug className="w-3.5 h-3.5 text-rose-500" />
          </div>
          <span className="font-bold text-white text-sm">BugKit</span>
        </div>
        <div className="flex items-center gap-2">
          {breadcrumb && (
            <span className="text-xs text-zinc-400">{breadcrumb}</span>
          )}
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </header>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative w-64 bg-[#0f172a] border-r border-zinc-800 flex flex-col">
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800"
            >
              <X className="w-4 h-4" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}
    </>
  );
}
