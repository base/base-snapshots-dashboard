import { NextResponse } from "next/server";

export interface SnapshotData {
  id: string;
  network: "mainnet" | "sepolia";
  client: string;
  type: "pruned" | "archive" | "proofs" | "full";
  filename: string | null;
  downloadUrl: string | null;
  sizeBytes: number | null;
  lastModified: string | null;
  unixTimestamp: number | null;
  tab: "mainnet" | "sepolia" | "legacy";
  status: "available" | "unavailable" | "error";
}

interface SnapshotConfig {
  id: string;
  network: "mainnet" | "sepolia";
  client: string;
  type: "pruned" | "archive" | "proofs" | "full";
  baseUrl: string;
  tab: "mainnet" | "sepolia" | "legacy";
}

const SNAPSHOT_CONFIGS: SnapshotConfig[] = [
  // Mainnet
  {
    id: "mainnet-reth-pruned",
    network: "mainnet",
    client: "reth",
    type: "pruned",
    baseUrl: "https://mainnet-reth-pruned-snapshots.base.org",
    tab: "mainnet",
  },
  {
    id: "mainnet-reth-archive",
    network: "mainnet",
    client: "reth",
    type: "archive",
    baseUrl: "https://mainnet-reth-archive-snapshots.base.org",
    tab: "mainnet",
  },
  {
    id: "mainnet-reth-proofs",
    network: "mainnet",
    client: "reth",
    type: "proofs",
    baseUrl: "https://mainnet-reth-proofs-snapshots.base.org",
    tab: "mainnet",
  },
  // Sepolia
  {
    id: "sepolia-reth-pruned",
    network: "sepolia",
    client: "reth",
    type: "pruned",
    baseUrl: "https://sepolia-reth-pruned-snapshots.base.org",
    tab: "sepolia",
  },
  {
    id: "sepolia-reth-archive",
    network: "sepolia",
    client: "reth",
    type: "archive",
    baseUrl: "https://sepolia-reth-archive-snapshots.base.org",
    tab: "sepolia",
  },
  {
    id: "sepolia-reth-proofs",
    network: "sepolia",
    client: "reth",
    type: "proofs",
    baseUrl: "https://sepolia-reth-proofs-snapshots.base.org",
    tab: "sepolia",
  },
  // Legacy
  {
    id: "mainnet-full",
    network: "mainnet",
    client: "reth",
    type: "full",
    baseUrl: "https://mainnet-full-snapshots.base.org",
    tab: "legacy",
  },
  {
    id: "sepolia-full",
    network: "sepolia",
    client: "reth",
    type: "full",
    baseUrl: "https://sepolia-full-snapshots.base.org",
    tab: "legacy",
  },
];

async function fetchSnapshotData(config: SnapshotConfig): Promise<SnapshotData> {
  try {
    const latestRes = await fetch(`${config.baseUrl}/latest`, {
      cache: "no-store",
    });

    if (!latestRes.ok) {
      return { ...config, filename: null, downloadUrl: null, sizeBytes: null, lastModified: null, unixTimestamp: null, status: "unavailable" };
    }

    const filename = (await latestRes.text()).trim();
    const downloadUrl = `${config.baseUrl}/${filename}`;

    const headRes = await fetch(downloadUrl, { method: "HEAD", cache: "no-store" });

    const contentLength = headRes.headers.get("content-length");
    const sizeBytes = contentLength ? parseInt(contentLength) : null;
    const lastModified = headRes.headers.get("last-modified");

    const match = filename.match(/(\d{10})\.tar\.zst$/);
    const unixTimestamp = match ? parseInt(match[1]) : null;

    return { ...config, filename, downloadUrl, sizeBytes, lastModified, unixTimestamp, status: "available" };
  } catch {
    return { ...config, filename: null, downloadUrl: null, sizeBytes: null, lastModified: null, unixTimestamp: null, status: "error" };
  }
}

export async function GET() {
  const snapshots = await Promise.all(SNAPSHOT_CONFIGS.map(fetchSnapshotData));
  return NextResponse.json({ snapshots, fetchedAt: new Date().toISOString() });
}
