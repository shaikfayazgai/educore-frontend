/**
 * Vercel Blob client-upload token endpoint.
 *
 * Flow:
 *   1. Browser calls `upload()` from `@vercel/blob/client` with the file
 *   2. The SDK POSTs to this route to mint a short-lived signed upload URL
 *   3. Browser uploads bytes DIRECTLY to Vercel Blob — never through our
 *      backend (so no Render/Vercel bandwidth tax)
 *   4. Vercel pings this route again `onUploadCompleted` with the final URL,
 *      so we could persist it server-side here if we wanted; we don't — the
 *      browser already has the URL and posts it to our FastAPI backend to be
 *      stored in `assignment_submissions.file_url` or `course_materials.file_url`
 *
 * Auth: we trust the caller's Glimmora access token, forwarded via the
 * `Authorization` header. If absent, deny the upload. This is enough to stop
 * anonymous users from burning our 1GB free tier — it isn't a full RBAC check
 * because the heavy lifting (which student is allowed to submit which
 * assignment) happens in the FastAPI backend when the URL is recorded.
 */
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

const ALLOWED_CONTENT_TYPES = [
  // Documents
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-powerpoint",
  // Spreadsheets
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  // Plain text / code
  "text/plain",
  "text/csv",
  "text/markdown",
  // Archives
  "application/zip",
  "application/x-zip-compressed",
  // Images (avatars, faculty media)
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  // Video (course material)
  "video/mp4",
  "video/quicktime",
];

const MAX_BYTES = 25 * 1024 * 1024; // 25 MB per file — keep us comfortably under the 1GB free tier

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const jsonResponse = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        // Block anonymous callers. The client wrapper puts our access token
        // into the clientPayload JSON; we don't decode/verify the JWT here
        // (the FastAPI backend already does that when the upload URL is
        // recorded), we just require *some* token to keep the public route
        // from being abused to burn through the 1GB free tier.
        let token = "";
        try {
          const parsed = clientPayload ? JSON.parse(clientPayload) : null;
          if (parsed && typeof parsed.token === "string") {
            token = parsed.token;
          }
        } catch {
          // ignored
        }
        if (!token) {
          throw new Error("Sign in required to upload files.");
        }

        return {
          allowedContentTypes: ALLOWED_CONTENT_TYPES,
          maximumSizeInBytes: MAX_BYTES,
          // `addRandomSuffix: true` is the default — Vercel appends 8 random
          // chars so two students uploading "homework.pdf" don't collide.
          tokenPayload: JSON.stringify({ pathname }),
        };
      },
      onUploadCompleted: async ({ blob }) => {
        // Vercel pings this URL when the upload finishes. We don't persist
        // here — the browser sends the URL to our FastAPI backend in the
        // submit/upload request that follows. This is just a no-op hook.
        // Useful later if we want server-side audit logging.
        console.log("[blob upload] completed", blob.url);
      },
    });

    return NextResponse.json(jsonResponse);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
