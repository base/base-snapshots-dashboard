"use client";

import { useState, useEffect, useCallback } from "react";
import type { SnapshotData } from "./api/snapshots/route";

interface ApiResponse {
  snapshots: SnapshotData[];
  fetchedAt: string;
}

type Tab = "mainnet" | "sepolia" | "legacy";

const DOCS_URL = "https://docs.base.org";
const SNAPSHOTS_DOCS_URL = "https://docs.base.org/base-chain/node-operators/snapshots";

function formatBytes(bytes: number | null): string {
  if (bytes === null) return "—";
  if (bytes >= 1e12) return `${(bytes / 1e12).toFixed(2)} TB`;
  if (bytes >= 1e9) return `${(bytes / 1e9).toFixed(1)} GB`;
  return `${bytes} B`;
}

function formatAge(unixSeconds: number | null): string {
  if (!unixSeconds) return "—";
  const days = Math.floor((Date.now() - unixSeconds * 1000) / 86400000);
  const hours = Math.floor((Date.now() - unixSeconds * 1000) / 3600000);
  if (days > 0) return `${days}d ago`;
  if (hours > 0) return `${hours}h ago`;
  return "< 1h ago";
}

function formatDate(unixSeconds: number | null): string {
  if (!unixSeconds) return "—";
  return new Date(unixSeconds * 1000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });
}

function BaseLogo({ size = 20 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none">
      <circle cx="16" cy="16" r="16" fill="#0052FF" />
      <path
        d="M16 6.4C10.698 6.4 6.4 10.698 6.4 16C6.4 21.302 10.698 25.6 16 25.6C21.069 25.6 25.21 21.709 25.573 16.74H16V15.26H25.573C25.21 10.291 21.069 6.4 16 6.4Z"
        fill="white"
      />
    </svg>
  );
}

function CopyButton({ url }: { url: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };
  return (
    <button
      onClick={copy}
      title="Copy download URL"
      className="text-gray-300 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
    >
      {copied ? (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline points="20 6 9 17 4 12" />
        </svg>
      ) : (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="9" y="9" width="13" height="13" rx="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  );
}

const BASESCAN: Record<string, string> = {
  mainnet: "https://basescan.org",
  sepolia: "https://sepolia.basescan.org",
};

function formatBlock(n: number | null): string {
  if (!n) return "—";
  return n.toLocaleString("en-US");
}

// Fixed column widths to prevent layout shift between tabs
const COL_WIDTHS = "grid-cols-[100px_90px_100px_80px_120px_140px_1fr]";

function TableHeader() {
  return (
    <div className={`grid ${COL_WIDTHS} gap-x-4 px-5 py-3 border-b border-gray-200 dark:border-gray-700`}>
      {["Network", "Type", "Size", "Age", "Date (UTC)", "Block", ""].map((h, i) => (
        <div
          key={i}
          className={`text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 ${i === 6 ? "text-right" : ""}`}
        >
          {h}
        </div>
      ))}
    </div>
  );
}

function TableRow({ snapshot }: { snapshot: SnapshotData }) {
  const ok = snapshot.status === "available";
  return (
    <div
      className={`grid ${COL_WIDTHS} gap-x-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors`}
    >
      {/* Network */}
      <div className="text-sm text-gray-700 dark:text-gray-300 capitalize self-center">
        {snapshot.network}
      </div>

      {/* Type */}
      <div className="text-sm font-medium text-gray-900 dark:text-gray-100 capitalize self-center">
        {snapshot.type}
      </div>

      {/* Size */}
      <div className="text-sm font-mono text-gray-700 dark:text-gray-300 self-center">
        {ok ? formatBytes(snapshot.sizeBytes) : <span className="text-gray-400 text-xs">{snapshot.status}</span>}
      </div>

      {/* Age */}
      <div className="text-sm text-gray-500 dark:text-gray-400 self-center">
        {formatAge(snapshot.unixTimestamp)}
      </div>

      {/* Date */}
      <div className="text-sm text-gray-500 dark:text-gray-400 font-mono self-center">
        {formatDate(snapshot.unixTimestamp)}
      </div>

      {/* Block */}
      <div className="text-sm font-mono text-gray-500 dark:text-gray-400 self-center">
        {snapshot.blockNumber ? (
          <a
            href={`${BASESCAN[snapshot.network]}/block/${snapshot.blockNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-[#0052FF] transition-colors"
          >
            {formatBlock(snapshot.blockNumber)}
          </a>
        ) : "—"}
      </div>

      {/* Download */}
      <div className="flex items-center justify-end gap-2 self-center">
        {ok && snapshot.downloadUrl ? (
          <>
            <CopyButton url={snapshot.downloadUrl} />
            <a
              href={snapshot.downloadUrl}
              className="text-sm text-[#0052FF] hover:underline font-medium whitespace-nowrap"
            >
              Download
            </a>
          </>
        ) : (
          <span className="text-xs text-gray-400">—</span>
        )}
      </div>
    </div>
  );
}

function SkeletonRow() {
  return (
    <div className={`grid ${COL_WIDTHS} gap-x-4 px-5 py-4 border-b border-gray-100 dark:border-gray-800 last:border-b-0`}>
      {[80, 60, 72, 48, 96, 88, 64].map((w, i) => (
        <div key={i} className={`flex items-center ${i === 6 ? "justify-end" : ""}`}>
          <div
            className="h-4 bg-gray-100 dark:bg-gray-800 rounded animate-pulse"
            style={{ width: w }}
          />
        </div>
      ))}
    </div>
  );
}

export default function Home() {
  const [activeTab, setActiveTab] = useState<Tab>("mainnet");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dark, setDark] = useState(false);

  // Apply stored theme on mount
  useEffect(() => {
    const stored = localStorage.getItem("theme");
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const useDark = stored === "dark" || (!stored && prefersDark);
    if (useDark) {
      document.documentElement.classList.add("dark");
      setDark(true);
    }
  }, []);

  const toggleDark = () => {
    const next = !dark;
    setDark(next);
    if (next) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/snapshots");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setData(await res.json());
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const tabSnapshots = data?.snapshots.filter((s) => s.tab === activeTab) ?? [];
  const skeletonCount = activeTab === "legacy" ? 2 : 3;

  const TABS: { id: Tab; label: string }[] = [
    { id: "mainnet", label: "Mainnet" },
    { id: "sepolia", label: "Sepolia" },
    { id: "legacy", label: "Legacy" },
  ];

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100">
      {/* Header */}
      <header className="border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BaseLogo size={20} />
            <span className="font-semibold text-gray-900 dark:text-white tracking-tight">
              Base Snapshots
            </span>
          </div>
          <div className="flex items-center gap-3">
            <a
              href={DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-[#0052FF] dark:hover:text-[#4d8ef0] transition-colors hidden sm:block"
            >
              Docs ↗
            </a>

            <div className="w-px h-4 bg-gray-200 dark:bg-gray-700 hidden sm:block" />
            <button
              onClick={toggleDark}
              title={dark ? "Switch to light mode" : "Switch to dark mode"}
              className="p-1.5 rounded text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            >
              {dark ? (
                /* Sun */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
                  <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
                  <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
                  <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
                </svg>
              ) : (
                /* Moon */
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
                </svg>
              )}
            </button>
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 text-sm border border-gray-200 dark:border-gray-700 rounded-md text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600 disabled:opacity-40 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={loading ? "animate-spin" : ""}>
                <polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Page title + description */}
        <div className="mb-6">
          <h1 className="text-xl font-semibold text-gray-900 dark:text-white mb-1">
            Node Snapshots
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Pre-built snapshots for faster node sync. All snapshots use reth and are
            compressed with zstd (<code className="font-mono text-xs">.tar.zst</code>).{" "}
            <a
              href={SNAPSHOTS_DOCS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#0052FF] hover:underline"
            >
              View setup instructions →
            </a>
          </p>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-[#0052FF] text-[#0052FF]"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="border border-gray-200 dark:border-gray-700 border-t-0 rounded-b-lg overflow-hidden bg-white dark:bg-gray-900">
          <TableHeader />

          {error ? (
            <div className="py-10 text-center">
              <p className="text-sm text-gray-500 mb-3">{error}</p>
              <button onClick={fetchData} className="text-sm text-[#0052FF] hover:underline">
                Retry
              </button>
            </div>
          ) : loading ? (
            Array.from({ length: skeletonCount }).map((_, i) => <SkeletonRow key={i} />)
          ) : tabSnapshots.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">
              No snapshots available
            </div>
          ) : (
            tabSnapshots.map((s) => <TableRow key={s.id} snapshot={s} />)
          )}
        </div>

        {/* Footer note */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Extract with{" "}
            <code className="font-mono bg-gray-50 dark:bg-gray-800 px-1 rounded">
              tar -I zstd -xf &lt;file&gt;
            </code>
            . The numeric suffix in each filename is a Unix timestamp.
          </p>
          <a
            href={SNAPSHOTS_DOCS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[#0052FF] hover:underline whitespace-nowrap"
          >
            Full documentation →
          </a>
        </div>
      </main>
    </div>
  );
}
