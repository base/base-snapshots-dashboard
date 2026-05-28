# Base Snapshot Dashboard

A simple dashboard for browsing and downloading the latest Base node snapshots.

**Live endpoints covered:**

| Tab | Type |
|-----|------|
| Mainnet | Pruned, Archive, Proofs |
| Sepolia | Pruned, Archive, Proofs |
| Legacy | Full (mainnet + sepolia) |

All snapshots use [reth](https://reth.rs) and are compressed with zstd (`.tar.zst`).

## Development

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

Deploy to [Vercel](https://vercel.com) or any platform that supports Next.js. No environment variables required — snapshot metadata is fetched live from `*.base.org` on each request.

## Docs

[docs.base.org/base-chain/node-operators/snapshots](https://docs.base.org/base-chain/node-operators/snapshots)
