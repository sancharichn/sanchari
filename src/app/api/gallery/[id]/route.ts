import { DRIVE_READONLY_SCOPE, getGoogleAccessToken, verifyFileId } from "@/lib/google";

export const dynamic = "force-dynamic";

const DRIVE = "https://www.googleapis.com/drive/v3/files";
const ALLOWED_WIDTHS = [480, 960, 1600];
const DRIVE_ID = /^[A-Za-z0-9_-]{10,200}$/;

/**
 * Serves gallery photos without making the Drive folder public. Only signed
 * file IDs (from the gallery listing) are served. Responses are cached hard at
 * the CDN, so Drive is asked once per photo and size.
 */
export async function GET(request: Request, { params }: { params: { id: string } }) {
  const url = new URL(request.url);
  const id = params.id;
  const notFound = () => new Response("Not found", { status: 404, headers: { "Cache-Control": "no-store" } });

  if (!DRIVE_ID.test(id) || !verifyFileId(id, url.searchParams.get("sig"))) return notFound();

  const requested = Number(url.searchParams.get("w"));
  const width = ALLOWED_WIDTHS.includes(requested) ? requested : 960;

  const token = await getGoogleAccessToken(DRIVE_READONLY_SCOPE);
  if (!token) return notFound();
  const auth = { Authorization: `Bearer ${token}` };

  // Drive's thumbnails are JPEGs at any size we ask for, including for HEIC
  // photos browsers can't show, and already rotated the right way up.
  const meta = await fetch(`${DRIVE}/${id}?fields=thumbnailLink,mimeType&supportsAllDrives=true`, {
    headers: auth,
    cache: "no-store",
  });
  if (!meta.ok) return notFound();
  const { thumbnailLink, mimeType } = (await meta.json()) as { thumbnailLink?: string; mimeType?: string };

  let image: Response | null = null;
  if (thumbnailLink) {
    const sized = thumbnailLink.replace(/=s\d+(-[a-z0-9-]+)?$/i, `=w${width}`);
    image = await fetch(sized, { headers: auth, cache: "no-store" });
    if (!image.ok) image = null;
  }
  if (!image && mimeType?.startsWith("image/") && mimeType !== "image/heic" && mimeType !== "image/heif") {
    image = await fetch(`${DRIVE}/${id}?alt=media&supportsAllDrives=true`, { headers: auth, cache: "no-store" });
    if (!image.ok) image = null;
  }
  if (!image?.body) return notFound();

  return new Response(image.body, {
    headers: {
      "Content-Type": image.headers.get("Content-Type") ?? "image/jpeg",
      "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
