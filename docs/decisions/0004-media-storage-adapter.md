# ADR 0004 — Media storage adapter: Vercel Blob

**Date:** 2026-06-08
**Status:** Accepted

## Context

The Media collection ([added in Stage 2](../changelog.md)) configures Payload's `upload` field, which by default writes files to the local filesystem. On Vercel that doesn't work: the filesystem is ephemeral and resets on every deploy and on every cold start. Any image uploaded through `/admin` in production would survive only until the next deploy — minutes to hours.

Payload solves this with **storage adapters** — pluggable modules that intercept uploads and store the bytes in a remote object store, while keeping the file metadata (filename, sizes, alt text) in Postgres alongside the rest of the Media row.

The project is small in scope: a marketing site + blog hosted on Vercel free tier, with a Bulgarian audience. Realistic media volume over the project's lifetime is on the order of **a few hundred images** — blog post hero images, service illustrations, optional apartment thumbnails. Sharp generates 3 size variants per upload (thumbnail/card/hero), so the multiplier is roughly 4× per original file.

Four realistic options were considered:

1. **Vercel Blob** — Vercel's own object store, accessed via `@payloadcms/storage-vercel-blob`.
2. **Cloudflare R2** — S3-compatible object store with no egress fees, accessed via `@payloadcms/storage-s3`.
3. **AWS S3** — the industry-standard object store, same `@payloadcms/storage-s3` package.
4. **UploadThing** — newer developer-experience-focused upload service, `@payloadcms/storage-uploadthing`.

## Decision

We go with **Vercel Blob**.

## Reasoning

### In favor of Vercel Blob

- **Native to the host.** Provisioning happens in the same Vercel dashboard as the rest of the project. Environment variables (`BLOB_READ_WRITE_TOKEN`) are auto-injected into Production, Preview, and Development just like the Neon credentials. Zero additional accounts, credentials, or dashboards for a one-person team to juggle.
- **Pattern match with ADR 0002.** Neon was chosen partly for being Vercel-native and avoiding cognitive overhead. Picking R2 or S3 for storage would re-introduce that overhead for a different layer — a separate account, separate billing, separate API keys to rotate. Consistency wins for a team of one.
- **Free tier covers the realistic workload.** Vercel Blob's free tier (1 GB stored, generous bandwidth) is well above what a marketing site with a few hundred images plus their sharp-generated variants will consume.
- **Payload integration is first-class.** `@payloadcms/storage-vercel-blob` is maintained by Payload, follows the same plugin pattern as the other adapters, and is documented alongside them. Wiring it up is one import + one config block.
- **Exit cost is bounded.** Files are addressed by HTTPS URLs; metadata stays in Postgres. If we ever outgrow Vercel Blob, migration is: copy bucket contents to a new provider, swap the adapter config (`storage-vercel-blob` → `storage-s3`), and update the URLs in the Media table. A one-afternoon job, not a rewrite.

### Against Cloudflare R2 (rejected, but the strongest runner-up)

- **Cheaper at scale.** R2 has no egress fees, which would matter for an image-heavy site with significant traffic. For a Bulgarian property-management marketing site, that's not the scale we're at.
- **More portable.** S3-compatible API means migration to AWS, Backblaze, MinIO, etc. is trivial.

**Why rejected for now:** the cost saving is theoretical at our volume (Vercel Blob's free tier covers us comfortably), and the operational cost of an additional Cloudflare account, API token management, and CORS configuration outweighs the future savings. If the site grows past Vercel Blob's free tier, switching to R2 is a low-effort change later — exactly the bounded-exit point above.

### Against AWS S3 (rejected)

- Lowest cost per byte at large scale, but everything that makes R2 better also makes S3 worse: a separate AWS account, IAM users, bucket policies, lifecycle rules, and the eternal AWS dashboard. None of that complexity is justified by our actual storage needs.
- Egress is billed at ~$0.09/GB after the free tier — actively *worse* than R2 if traffic ever grows.

### Against UploadThing (rejected)

- Solid developer experience and a Payload adapter exists, but it's a fourth vendor in the dependency graph (after Vercel, Neon, GitHub). The marginal DX gain over Vercel Blob doesn't justify expanding the surface area we maintain.
- Less mature than the alternatives; smaller community.

### Against doing nothing / local disk (the current state)

- Files vanish on every Vercel deploy. The Media collection is unusable in production without an adapter. This is the problem we're solving.

## Consequences

- A `@payloadcms/storage-vercel-blob` dependency is added to `package.json`.
- A Vercel Blob store is provisioned through the Vercel dashboard (Storage → Blob). The `BLOB_READ_WRITE_TOKEN` env var is auto-injected into Production, Preview, and Development environments. Pulled to `.env.local` via `vercel env pull` for local dev — same pattern as Neon.
- `src/payload.config.ts` gains a `plugins: [vercelBlobStorage({...})]` block configuring which collections use Blob (currently only `media`).
- Uploads in the admin store the bytes in Vercel Blob; the public URL is written back into the Media row's `url` field. The frontend consumes that URL directly — no proxying through the app.
- Sharp-generated size variants (thumbnail/card/hero) each become separate objects in Blob, addressed by their own URLs.
- Local dev hits the same Blob store as production until per-environment Blob stores are configured. Same trade-off as the shared Neon DB on free tier; deliberate.

## Notes on tradeoffs we accept

- **Vendor lock-in to Vercel.** Already accepted at the hosting and database layers; extending it to storage is consistent. The exit path is real: copy bucket contents + swap adapter + update URLs.
- **Free-tier ceiling.** 1 GB is comfortable for a few hundred images plus variants. If a future stage introduces video, owned high-resolution photography, or downloadable PDFs (e.g. owner guides), revisit — this might be the trigger to move to R2.
- **No per-environment isolation initially.** Dev uploads land in the same Blob store as production, mirroring the dev/prod Neon situation. When we enable Neon DB branching (Stage 5 or 6 per ADR 0002), set up a separate Blob store for preview/dev at the same time.
- **CDN caching.** Vercel Blob serves files through Vercel's edge network with sensible cache headers by default; no additional CDN configuration needed for the marketing-site use case.
