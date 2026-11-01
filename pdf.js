/* Vercel Edge Function — /api/pdf?id=<GoogleDriveFileId>
   Google Drive PDF ን በ CORS እና Range ድጋፍ ያስተላልፋል (Netlify _redirects ተመሳሳይ ሥራ) */
export const config = { runtime: "edge" };

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
  "Access-Control-Allow-Headers": "Range",
  "Access-Control-Expose-Headers": "Content-Range, Accept-Ranges, Content-Length",
};

export default async function handler(req) {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });
  const id = new URL(req.url).searchParams.get("id") || "";
  if (!/^[\w-]{10,}$/.test(id)) return new Response("bad id", { status: 400, headers: CORS });

  const headers = {};
  const range = req.headers.get("range");
  if (range) headers.Range = range;

  const up = await fetch(
    `https://drive.usercontent.google.com/download?id=${id}&export=download&confirm=t`,
    { method: req.method === "HEAD" ? "HEAD" : "GET", headers, redirect: "follow" }
  );

  const out = new Headers(CORS);
  for (const h of ["content-length", "content-range", "accept-ranges", "etag", "last-modified"]) {
    const v = up.headers.get(h);
    if (v) out.set(h, v);
  }
  out.set("Content-Type", up.ok ? "application/pdf" : up.headers.get("content-type") || "text/plain");
  out.set("Cache-Control", "public, max-age=3600, s-maxage=86400");
  return new Response(up.body, { status: up.status, headers: out });
}
