/**
 * Thin wrapper around `@vercel/blob/client.upload()` so the student and
 * faculty portals share one upload path.
 *
 * Returns the public Vercel Blob URL the caller should persist to the
 * backend (e.g. POST to /assignments/.../submit with { fileUrl, fileName }).
 *
 * Forwards the user's access token from localStorage as a Bearer header so
 * `/api/upload` (our Next.js route) can reject anonymous calls.
 */
import { upload } from "@vercel/blob/client";

export interface BlobUploadResult {
  url: string;
  pathname: string;
  contentType: string;
  fileName: string;
  size: number;
}

export interface BlobUploadOptions {
  /** Optional folder prefix, e.g. "submissions" or "materials/<courseId>" */
  folder?: string;
  /** Progress callback in 0..1 */
  onProgress?: (fraction: number) => void;
}

function getAccessToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem("glimmora_access_token");
}

export async function uploadFileToBlob(
  file: File,
  options: BlobUploadOptions = {},
): Promise<BlobUploadResult> {
  const token = getAccessToken();
  if (!token) {
    throw new Error("You need to be signed in to upload files.");
  }

  // Build the storage pathname. Vercel auto-adds a random suffix so two
  // students uploading "homework.pdf" don't collide.
  const folder = options.folder?.replace(/^\/+|\/+$/g, "") || "uploads";
  const safeName = file.name.replace(/[^\w.\- ]+/g, "_").slice(0, 200);
  const pathname = `${folder}/${safeName}`;

  const blob = await upload(pathname, file, {
    access: "public",
    handleUploadUrl: "/api/upload",
    contentType: file.type || "application/octet-stream",
    // Forward our access token via clientPayload so the route can authorize
    // the upload. We can't set custom request headers from the client SDK.
    clientPayload: JSON.stringify({ originalName: file.name, token }),
    onUploadProgress: options.onProgress
      ? (e) => options.onProgress!(e.percentage / 100)
      : undefined,
  });

  return {
    url: blob.url,
    pathname: blob.pathname,
    contentType: file.type || "application/octet-stream",
    fileName: file.name,
    size: file.size,
  };
}
