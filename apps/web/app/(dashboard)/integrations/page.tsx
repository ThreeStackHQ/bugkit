"use client";
import { useState } from "react";

interface SlackConfig {
  webhookUrl: string;
  enabled: boolean;
}

interface LinearConfig {
  apiToken: string;
  teamId: string;
  defaultStatus: string;
  enabled: boolean;
}

interface GitHubConfig {
  token: string;
  repository: string;
  defaultAssignee: string;
  enabled: boolean;
}

type TestResult = { status: "success" | "error" | "idle"; message: string };

export default function IntegrationsPage() {
  const [slack, setSlack] = useState<SlackConfig>({
    webhookUrl: "",
    enabled: false,
  });
  const [linear, setLinear] = useState<LinearConfig>({
    apiToken: "",
    teamId: "",
    defaultStatus: "Todo",
    enabled: false,
  });
  const [github, setGitHub] = useState<GitHubConfig>({
    token: "",
    repository: "",
    defaultAssignee: "",
    enabled: false,
  });

  const [slackTest, setSlackTest] = useState<TestResult>({ status: "idle", message: "" });
  const [linearTest, setLinearTest] = useState<TestResult>({ status: "idle", message: "" });
  const [githubTest, setGithubTest] = useState<TestResult>({ status: "idle", message: "" });
  const [saving, setSaving] = useState<{ slack: boolean; linear: boolean; github: boolean }>({
    slack: false, linear: false, github: false,
  });

  const connectedCount = [slack.enabled, linear.enabled, github.enabled].filter(Boolean).length;

  async function testSlack() {
    setSlackTest({ status: "idle", message: "Testing..." });
    try {
      const res = await fetch("/api/integrations/slack/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ webhookUrl: slack.webhookUrl }),
      });
      const data = await res.json();
      setSlackTest({ status: data.ok ? "success" : "error", message: data.message || (data.ok ? "Test sent!" : "Failed") });
    } catch {
      setSlackTest({ status: "error", message: "Connection failed" });
    }
  }

  async function testLinear() {
    setLinearTest({ status: "idle", message: "Testing..." });
    try {
      const res = await fetch("/api/integrations/linear/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiToken: linear.apiToken, teamId: linear.teamId }),
      });
      const data = await res.json();
      setLinearTest({ status: data.ok ? "success" : "error", message: data.message || (data.ok ? "Connected!" : "Failed") });
    } catch {
      setLinearTest({ status: "error", message: "Connection failed" });
    }
  }

  async function testGitHub() {
    setGithubTest({ status: "idle", message: "Testing..." });
    try {
      const res = await fetch("/api/integrations/github/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: github.token, repository: github.repository }),
      });
      const data = await res.json();
      setGithubTest({ status: data.ok ? "success" : "error", message: data.message || (data.ok ? "Connected!" : "Failed") });
    } catch {
      setGithubTest({ status: "error", message: "Connection failed" });
    }
  }

  async function saveSlack() {
    setSaving(s => ({ ...s, slack: true }));
    await new Promise(r => setTimeout(r, 600));
    setSaving(s => ({ ...s, slack: false }));
  }
  async function saveLinear() {
    setSaving(s => ({ ...s, linear: true }));
    await new Promise(r => setTimeout(r, 600));
    setSaving(s => ({ ...s, linear: false }));
  }
  async function saveGitHub() {
    setSaving(s => ({ ...s, github: true }));
    await new Promise(r => setTimeout(r, 600));
    setSaving(s => ({ ...s, github: false }));
  }

  return (
    <div className="p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">Integrations</h1>
            <p className="text-slate-400 mt-1">Connect BugKit with your team&apos;s tools</p>
          </div>
          <span className="text-sm text-slate-400 bg-slate-800 px-3 py-1 rounded-full">
            {connectedCount} of 3 connected
          </span>
        </div>
      </div>

      <div className="space-y-6">
        {/* Slack Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#4A154B] rounded-lg flex items-center justify-center text-xl">
                💬
              </div>
              <div>
                <h3 className="text-white font-semibold">Slack</h3>
                <p className="text-slate-400 text-sm">Get notified for every new bug report</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {slack.enabled && (
                <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              )}
              <button
                onClick={() => setSlack(s => ({ ...s, enabled: !s.enabled }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  slack.enabled ? "bg-rose-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    slack.enabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Webhook URL</label>
              <input
                type="url"
                value={slack.webhookUrl}
                onChange={e => setSlack(s => ({ ...s, webhookUrl: e.target.value }))}
                placeholder="https://hooks.slack.com/services/..."
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            {slackTest.message && (
              <p className={`text-xs ${slackTest.status === "success" ? "text-green-400" : slackTest.status === "error" ? "text-red-400" : "text-slate-400"}`}>
                {slackTest.message}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={testSlack}
                disabled={!slack.webhookUrl}
                className="px-3 py-1.5 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-40"
              >
                Test Notification
              </button>
              <button
                onClick={saveSlack}
                disabled={saving.slack}
                className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-500 disabled:opacity-60"
              >
                {saving.slack ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* Linear Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#5E6AD2]/20 rounded-lg flex items-center justify-center text-xl">
                📋
              </div>
              <div>
                <h3 className="text-white font-semibold">Linear</h3>
                <p className="text-slate-400 text-sm">Auto-create Linear issues from bug reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {linear.enabled && (
                <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              )}
              <button
                onClick={() => setLinear(s => ({ ...s, enabled: !s.enabled }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  linear.enabled ? "bg-rose-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    linear.enabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">API Token</label>
                <input
                  type="password"
                  value={linear.apiToken}
                  onChange={e => setLinear(s => ({ ...s, apiToken: e.target.value }))}
                  placeholder="lin_api_..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Team ID</label>
                <input
                  type="text"
                  value={linear.teamId}
                  onChange={e => setLinear(s => ({ ...s, teamId: e.target.value }))}
                  placeholder="TEAM-ID"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Default Issue Status</label>
              <select
                value={linear.defaultStatus}
                onChange={e => setLinear(s => ({ ...s, defaultStatus: e.target.value }))}
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-rose-500"
              >
                <option>Todo</option>
                <option>In Progress</option>
                <option>Backlog</option>
              </select>
            </div>
            {linearTest.message && (
              <p className={`text-xs ${linearTest.status === "success" ? "text-green-400" : linearTest.status === "error" ? "text-red-400" : "text-slate-400"}`}>
                {linearTest.message}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={testLinear}
                disabled={!linear.apiToken}
                className="px-3 py-1.5 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-40"
              >
                Test Connection
              </button>
              <button
                onClick={saveLinear}
                disabled={saving.linear}
                className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-500 disabled:opacity-60"
              >
                {saving.linear ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>

        {/* GitHub Card */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-slate-700 rounded-lg flex items-center justify-center text-xl">
                🐙
              </div>
              <div>
                <h3 className="text-white font-semibold">GitHub</h3>
                <p className="text-slate-400 text-sm">Create GitHub issues from bug reports</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {github.enabled && (
                <span className="text-xs bg-green-900/50 text-green-400 border border-green-800 px-2 py-0.5 rounded-full">
                  Connected
                </span>
              )}
              <button
                onClick={() => setGitHub(s => ({ ...s, enabled: !s.enabled }))}
                className={`relative w-10 h-6 rounded-full transition-colors ${
                  github.enabled ? "bg-rose-600" : "bg-slate-700"
                }`}
              >
                <span
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${
                    github.enabled ? "left-5" : "left-1"
                  }`}
                />
              </button>
            </div>
          </div>
          <div className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Personal Access Token</label>
                <input
                  type="password"
                  value={github.token}
                  onChange={e => setGitHub(s => ({ ...s, token: e.target.value }))}
                  placeholder="ghp_..."
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
              <div>
                <label className="text-sm text-slate-300 mb-1 block">Repository</label>
                <input
                  type="text"
                  value={github.repository}
                  onChange={e => setGitHub(s => ({ ...s, repository: e.target.value }))}
                  placeholder="owner/repo"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
                />
              </div>
            </div>
            <div>
              <label className="text-sm text-slate-300 mb-1 block">Default Assignee (optional)</label>
              <input
                type="text"
                value={github.defaultAssignee}
                onChange={e => setGitHub(s => ({ ...s, defaultAssignee: e.target.value }))}
                placeholder="github-username"
                className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white text-sm placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>
            {githubTest.message && (
              <p className={`text-xs ${githubTest.status === "success" ? "text-green-400" : githubTest.status === "error" ? "text-red-400" : "text-slate-400"}`}>
                {githubTest.message}
              </p>
            )}
            <div className="flex gap-2 pt-1">
              <button
                onClick={testGitHub}
                disabled={!github.token || !github.repository}
                className="px-3 py-1.5 text-sm border border-slate-600 text-slate-300 rounded-lg hover:bg-slate-800 disabled:opacity-40"
              >
                Test Connection
              </button>
              <button
                onClick={saveGitHub}
                disabled={saving.github}
                className="px-3 py-1.5 text-sm bg-rose-600 text-white rounded-lg hover:bg-rose-500 disabled:opacity-60"
              >
                {saving.github ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
