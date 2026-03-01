"use client";

import { useState } from "react";
import {
  X,
  Filter,
  ChevronDown,
  ChevronUp,
  CheckSquare,
  Square,
  ExternalLink,
  Clock,
  Send,
  AlertCircle,
  Circle,
  CheckCircle2,
  Bug,
  Terminal,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type Status = "open" | "in_progress" | "resolved";

interface Report {
  id: string;
  title: string;
  url: string;
  reporter: string;
  timestamp: string;
  status: Status;
  thumbnail: string;
}

// ─── Mock data ────────────────────────────────────────────────────────────────

const mockReports: Report[] = [
  {
    id: "1",
    title: "Button click on checkout page throws 500",
    url: "https://app.example.com/checkout",
    reporter: "alice@example.com",
    timestamp: "2026-03-01T14:22:00Z",
    status: "open",
    thumbnail: "https://placehold.co/80x50/1e293b/475569?text=🖥️",
  },
  {
    id: "2",
    title: "Dashboard charts not loading on Firefox",
    url: "https://app.example.com/dashboard",
    reporter: "bob@example.com",
    timestamp: "2026-03-01T13:10:00Z",
    status: "in_progress",
    thumbnail: "https://placehold.co/80x50/1e293b/475569?text=📊",
  },
  {
    id: "3",
    title: "Settings page crashes on mobile",
    url: "https://app.example.com/settings",
    reporter: "carol@example.com",
    timestamp: "2026-03-01T11:55:00Z",
    status: "open",
    thumbnail: "https://placehold.co/80x50/1e293b/475569?text=⚙️",
  },
  {
    id: "4",
    title: "Profile photo upload fails silently",
    url: "https://app.example.com/profile",
    reporter: "dave@example.com",
    timestamp: "2026-02-29T17:30:00Z",
    status: "resolved",
    thumbnail: "https://placehold.co/80x50/1e293b/475569?text=👤",
  },
  {
    id: "5",
    title: "Search returns wrong results for special chars",
    url: "https://app.example.com/search",
    reporter: "eve@example.com",
    timestamp: "2026-02-29T09:15:00Z",
    status: "open",
    thumbnail: "https://placehold.co/80x50/1e293b/475569?text=🔍",
  },
  {
    id: "6",
    title: "Email notifications not sent after signup",
    url: "https://app.example.com/signup",
    reporter: "frank@example.com",
    timestamp: "2026-02-28T22:45:00Z",
    status: "in_progress",
    thumbnail: "https://placehold.co/80x50/1e293b/475569?text=📧",
  },
  {
    id: "7",
    title: "CSV export includes deleted rows",
    url: "https://app.example.com/export",
    reporter: "grace@example.com",
    timestamp: "2026-02-28T14:00:00Z",
    status: "resolved",
    thumbnail: "https://placehold.co/80x50/1e293b/475569?text=📄",
  },
];

const mockConsoleLogs = [
  {
    level: "error",
    time: "14:22:01",
    message: "TypeError: Cannot read properties of null (reading 'id')",
    file: "checkout.js:142",
  },
  {
    level: "warn",
    time: "14:22:00",
    message: "Slow network detected, falling back to cached data",
    file: "api-client.js:89",
  },
  {
    level: "log",
    time: "14:21:58",
    message: "User initiated checkout flow",
    file: "checkout.js:45",
  },
  {
    level: "error",
    time: "14:21:57",
    message: "Failed to load resource: 404 /api/user/cart",
    file: "network.js:201",
  },
  {
    level: "log",
    time: "14:21:55",
    message: "Component mounted: <CheckoutPage>",
    file: "checkout.js:12",
  },
];

// ─── Status helpers ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Status }) {
  const map: Record<Status, { label: string; classes: string; icon: React.ReactNode }> = {
    open: {
      label: "Open",
      classes: "bg-rose-500/10 text-rose-400 border border-rose-500/20",
      icon: <AlertCircle className="w-3 h-3" />,
    },
    in_progress: {
      label: "In Progress",
      classes: "bg-amber-500/10 text-amber-400 border border-amber-500/20",
      icon: <Circle className="w-3 h-3" />,
    },
    resolved: {
      label: "Resolved",
      classes: "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20",
      icon: <CheckCircle2 className="w-3 h-3" />,
    },
  };
  const { label, classes, icon } = map[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${classes}`}>
      {icon} {label}
    </span>
  );
}

function formatDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
}

// ─── Slide-over detail panel ──────────────────────────────────────────────────

function ReportSlideOver({
  report,
  onClose,
}: {
  report: Report;
  onClose: () => void;
}) {
  const [status, setStatus] = useState<Status>(report.status);
  const [logsOpen, setLogsOpen] = useState(true);
  const [notes, setNotes] = useState("");
  const [integrationOpen, setIntegrationOpen] = useState(false);

  const levelColors: Record<string, string> = {
    error: "text-rose-400 bg-rose-500/10",
    warn: "text-amber-400 bg-amber-500/10",
    log: "text-zinc-400 bg-zinc-800",
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="fixed right-0 top-0 h-full w-full max-w-2xl bg-zinc-900 border-l border-zinc-700 z-50 flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-start justify-between p-6 border-b border-zinc-800">
          <div className="flex-1 min-w-0 pr-4">
            <div className="flex items-center gap-2 mb-1">
              <StatusBadge status={status} />
            </div>
            <h2 className="text-lg font-semibold text-white leading-tight">
              {report.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors flex-shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Screenshot */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Screenshot</h3>
            <div className="rounded-xl overflow-hidden border border-zinc-700 bg-zinc-800 aspect-video flex items-center justify-center">
              <div className="text-center">
                <Bug className="w-12 h-12 text-zinc-600 mx-auto mb-2" />
                <p className="text-zinc-500 text-sm">Annotated screenshot</p>
                <p className="text-zinc-600 text-xs mt-1">1440 × 900</p>
              </div>
            </div>
          </div>

          {/* Metadata */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Metadata</h3>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "URL", value: report.url },
                { label: "Browser", value: "Chrome 120" },
                { label: "Viewport", value: "1440 × 900" },
                { label: "Reporter", value: report.reporter },
              ].map(({ label, value }) => (
                <div key={label} className="bg-zinc-800/60 rounded-lg px-3 py-2.5">
                  <p className="text-xs text-zinc-500 mb-0.5">{label}</p>
                  <p className="text-sm text-zinc-200 truncate font-mono">{value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Console logs */}
          <div>
            <button
              className="flex items-center justify-between w-full text-sm font-medium text-zinc-300 mb-3"
              onClick={() => setLogsOpen((v) => !v)}
            >
              <span className="flex items-center gap-2">
                <Terminal className="w-4 h-4 text-zinc-500" />
                Console Logs
                <span className="text-xs bg-zinc-700 text-zinc-400 px-1.5 py-0.5 rounded-full">
                  {mockConsoleLogs.length}
                </span>
              </span>
              {logsOpen ? (
                <ChevronUp className="w-4 h-4 text-zinc-500" />
              ) : (
                <ChevronDown className="w-4 h-4 text-zinc-500" />
              )}
            </button>
            {logsOpen && (
              <div className="rounded-xl border border-zinc-700 bg-zinc-950 overflow-hidden font-mono text-xs">
                {mockConsoleLogs.map((log, i) => (
                  <div
                    key={i}
                    className={`flex gap-3 px-4 py-2.5 border-b border-zinc-800/60 last:border-0 ${
                      levelColors[log.level] ?? "text-zinc-400"
                    }`}
                  >
                    <span className="text-zinc-600 flex-shrink-0">{log.time}</span>
                    <span
                      className={`w-10 flex-shrink-0 font-bold uppercase text-[10px] ${
                        log.level === "error"
                          ? "text-rose-500"
                          : log.level === "warn"
                          ? "text-amber-400"
                          : "text-zinc-500"
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="flex-1 break-all text-zinc-300">{log.message}</span>
                    <span className="text-zinc-600 flex-shrink-0">{log.file}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Status */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Status</h3>
            <div className="flex gap-2">
              {(["open", "in_progress", "resolved"] as Status[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatus(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    status === s
                      ? s === "open"
                        ? "bg-rose-500/15 border-rose-500/30 text-rose-400"
                        : s === "in_progress"
                        ? "bg-amber-500/15 border-amber-500/30 text-amber-400"
                        : "bg-emerald-500/15 border-emerald-500/30 text-emerald-400"
                      : "bg-zinc-800 border-zinc-700 text-zinc-400 hover:border-zinc-600"
                  }`}
                >
                  {s === "open" ? "Open" : s === "in_progress" ? "In Progress" : "Resolved"}
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <h3 className="text-sm font-medium text-zinc-300 mb-3">Notes</h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add internal notes about this bug…"
              rows={3}
              className="w-full bg-zinc-800/60 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-rose-500/50 focus:ring-1 focus:ring-rose-500/20 resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-zinc-800 flex items-center justify-between gap-3">
          <button
            onClick={() => setIntegrationOpen((v) => !v)}
            className="relative flex items-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-sm text-zinc-200 font-medium border border-zinc-700 transition-colors"
          >
            <Send className="w-4 h-4" />
            Send to Integration
            <ChevronDown className="w-3.5 h-3.5" />
            {integrationOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-44 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden z-10">
                {["Slack", "Linear", "GitHub"].map((int) => (
                  <button
                    key={int}
                    className="w-full text-left px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-700 hover:text-white transition-colors"
                    onClick={() => setIntegrationOpen(false)}
                  >
                    {int}
                  </button>
                ))}
              </div>
            )}
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white text-sm font-medium transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

type FilterTab = "all" | Status;

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [activeReport, setActiveReport] = useState<Report | null>(null);
  const [dateRange, setDateRange] = useState("all");

  const counts = {
    open: mockReports.filter((r) => r.status === "open").length,
    in_progress: mockReports.filter((r) => r.status === "in_progress").length,
    resolved: mockReports.filter((r) => r.status === "resolved").length,
  };

  const filtered = mockReports.filter((r) => {
    if (activeTab === "all") return true;
    return r.status === activeTab;
  });

  const allChecked =
    filtered.length > 0 && filtered.every((r) => selected.has(r.id));

  function toggleAll() {
    if (allChecked) {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.delete(r.id));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filtered.forEach((r) => next.add(r.id));
        return next;
      });
    }
  }

  function markResolved() {
    setSelected(new Set());
  }

  const tabs: { key: FilterTab; label: string; count?: number }[] = [
    { key: "all", label: "All", count: mockReports.length },
    { key: "open", label: "Open", count: counts.open },
    { key: "in_progress", label: "In Progress", count: counts.in_progress },
    { key: "resolved", label: "Resolved", count: counts.resolved },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      {/* Summary stats */}
      <div className="flex items-center gap-6 mb-6 py-4 px-5 rounded-xl bg-zinc-900 border border-zinc-800">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="text-sm text-zinc-400">
            <span className="font-bold text-rose-400">{counts.open}</span> Open
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-500" />
          <span className="text-sm text-zinc-400">
            <span className="font-bold text-amber-400">{counts.in_progress}</span> In Progress
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-sm text-zinc-400">
            <span className="font-bold text-emerald-400">{counts.resolved}</span> Resolved
          </span>
        </div>
      </div>

      {/* Tabs + filters row */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        {/* Tabs */}
        <div className="flex items-center gap-1 p-1 bg-zinc-900 rounded-xl border border-zinc-800">
          {tabs.map(({ key, label, count }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === key
                  ? "bg-zinc-800 text-white shadow-sm"
                  : "text-zinc-500 hover:text-zinc-300"
              }`}
            >
              {label}
              {count !== undefined && (
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                    activeTab === key
                      ? "bg-rose-500/20 text-rose-400"
                      : "bg-zinc-700 text-zinc-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 border border-zinc-800 rounded-lg text-sm text-zinc-400">
            <Filter className="w-3.5 h-3.5" />
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="bg-transparent text-zinc-400 text-sm focus:outline-none"
            >
              <option value="all">All time</option>
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
            </select>
          </div>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="flex items-center gap-3 mb-4 px-4 py-3 bg-rose-500/10 border border-rose-500/20 rounded-xl">
          <span className="text-sm text-rose-300 font-medium">
            {selected.size} selected
          </span>
          <button
            onClick={markResolved}
            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-xs font-medium border border-rose-500/30 transition-colors"
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Resolved
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl border border-zinc-800 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/50">
              <th className="w-10 px-4 py-3">
                <button onClick={toggleAll} className="text-zinc-500 hover:text-zinc-300">
                  {allChecked ? (
                    <CheckSquare className="w-4 h-4 text-rose-400" />
                  ) : (
                    <Square className="w-4 h-4" />
                  )}
                </button>
              </th>
              <th className="w-20 px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Preview
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Bug
              </th>
              <th className="hidden md:table-cell px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Reporter
              </th>
              <th className="hidden lg:table-cell px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Time
              </th>
              <th className="px-3 py-3 text-left text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Status
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-800/60">
            {filtered.map((report) => (
              <tr
                key={report.id}
                onClick={() => setActiveReport(report)}
                className="hover:bg-zinc-800/30 transition-colors cursor-pointer group"
              >
                <td
                  className="px-4 py-4"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected((prev) => {
                        const next = new Set(prev);
                        if (next.has(report.id)) next.delete(report.id);
                        else next.add(report.id);
                        return next;
                      });
                    }}
                    className="text-zinc-500 hover:text-zinc-300"
                  >
                    {selected.has(report.id) ? (
                      <CheckSquare className="w-4 h-4 text-rose-400" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>
                </td>
                <td className="px-3 py-4">
                  <div className="w-16 h-10 rounded-md overflow-hidden bg-zinc-800 border border-zinc-700">
                    <div className="w-full h-full flex items-center justify-center text-zinc-600 text-xs">
                      🖥️
                    </div>
                  </div>
                </td>
                <td className="px-3 py-4">
                  <div>
                    <p className="text-sm text-white font-medium group-hover:text-rose-300 transition-colors line-clamp-1">
                      {report.title}
                    </p>
                    <a
                      href={report.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-zinc-500 hover:text-zinc-300 mt-0.5 font-mono truncate max-w-xs"
                    >
                      <ExternalLink className="w-3 h-3 flex-shrink-0" />
                      {report.url}
                    </a>
                  </div>
                </td>
                <td className="hidden md:table-cell px-3 py-4 text-sm text-zinc-400">
                  {report.reporter}
                </td>
                <td className="hidden lg:table-cell px-3 py-4">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Clock className="w-3.5 h-3.5" />
                    {formatDate(report.timestamp)}
                  </div>
                </td>
                <td className="px-3 py-4">
                  <StatusBadge status={report.status} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="py-16 text-center">
            <Bug className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
            <p className="text-zinc-500 text-sm">No reports in this category</p>
          </div>
        )}
      </div>

      {/* Slide-over */}
      {activeReport && (
        <ReportSlideOver
          report={activeReport}
          onClose={() => setActiveReport(null)}
        />
      )}
    </div>
  );
}
