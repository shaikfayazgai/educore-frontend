# Vercel Blob — file upload setup

File uploads (student assignment submissions, faculty course materials) go
**directly from the browser to Vercel Blob**, not through our FastAPI
backends on Render. Only the resulting public URL is sent to FastAPI and
stored in Postgres (`assignment_submissions.file_url` / `course_materials.file_url`).

## One-time setup

1. **Create a Blob store**
   - Vercel dashboard → your project → **Storage** → **Create** → **Blob**
   - Pick a name (e.g. `glimmora-blob`) → **Create**

2. **Get the token (local dev)**
   - Inside the store, click the **`.env.local`** tab
   - Copy the `BLOB_READ_WRITE_TOKEN=...` line
   - Paste it into `educore-frontend/.env.local`
   - Restart `npm run dev`

3. **Wire up production**
   - Still on the store page → **Connect Project** → select your Vercel
     project → Vercel auto-injects `BLOB_READ_WRITE_TOKEN` into every
     deployment. No manual env var copy needed.

## How it works

```
 Browser                Next.js route         Vercel Blob              FastAPI
   │                     /api/upload                                   (Render)
   │                                                                       │
   │── upload(file) ────────►│                                              │
   │  (via @vercel/blob/     │                                              │
   │   client)               │── handleUpload() ──►│                       │
   │                         │◄── signed PUT URL ──│                       │
   │◄────── signed URL ──────│                                              │
   │                                                                       │
   │────── PUT bytes (direct) ─────────────────────►│                       │
   │◄────── { url } ────────────────────────────────│                       │
   │                                                                       │
   │── POST /submit { fileUrl, fileName } ──────────────────────────────►  │
   │                                                                       │  ──► Postgres
   │◄── 200 ─────────────────────────────────────────────────────────────  │
```

## Limits & cost

| Tier   | Storage | Bandwidth/mo | Cost           |
|--------|---------|--------------|----------------|
| Hobby  | 1 GB    | 10 GB        | Free           |
| Pro    | 5 GB    | 100 GB       | $20/mo base    |
| After  | -       | -            | $0.023/GB extra|

`/api/upload` caps individual uploads at **25 MB** and to an allowlist of
content types (PDF, Office, images, video, archive, code) — see
[src/app/api/upload/route.ts](src/app/api/upload/route.ts).

## Migrating to R2 later

Files are just URLs in Postgres. To migrate:
1. Re-upload existing blobs to R2 (use `aws s3 sync` against the Blob URL list)
2. Run `UPDATE assignment_submissions SET file_url = REPLACE(file_url, 'blob.vercel-storage.com', 'r2.your-domain.com')`
3. Swap the storage provider in [src/lib/blob-upload.ts](src/lib/blob-upload.ts) (only the `upload()` call changes)

## Troubleshooting

- **"Sign in required to upload files."** — student/faculty isn't logged in.
  The route requires a Glimmora access token in `localStorage`.
- **"No token found"** — `BLOB_READ_WRITE_TOKEN` missing/empty in `.env.local`.
- **413 on upload** — file > 25 MB. Bump `MAX_BYTES` in the route, or split
  the file.
- **CORS error** — only happens if you renamed the route. The SDK assumes
  `/api/upload` by default; we pass `handleUploadUrl: "/api/upload"`.
