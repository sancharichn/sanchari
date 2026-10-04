import "server-only";
import { unstable_cache } from "next/cache";
import { DRIVE_READONLY_SCOPE, getGoogleAccessToken, signFileId } from "@/lib/google";
import { SITE_COVERS, SITE_COVER_PREFIX, siteCover } from "@/lib/site-covers";

/*
 * The gallery is a Google Drive folder shared (Viewer) with the service
 * account. Photos directly in it are the "Latest" set; each subfolder is an
 * album named after the folder.
 */

const DRIVE = "https://www.googleapis.com/drive/v3/files";
const FOLDER_MIME = "application/vnd.google-apps.folder";
const DRIVE_ID = /^[A-Za-z0-9_-]{10,200}$/;

export const GALLERY_WIDTHS = [480, 960, 1600] as const;

export type GalleryImage = {
  id: string;
  alt: string;
  /** Proxied, signed URLs at each width. */
  src: Record<(typeof GALLERY_WIDTHS)[number], string>;
  width: number | null;
  height: number | null;
};

export type GalleryAlbum = { id: string; name: string; images: GalleryImage[] };

type DriveFile = {
  id: string;
  name: string;
  mimeType: string;
  imageMediaMetadata?: { width?: number; height?: number; rotation?: number };
};

export function galleryFolderId(): string | null {
  const id = process.env.GOOGLE_DRIVE_FOLDER_ID?.trim();
  return id && DRIVE_ID.test(id) ? id : null;
}

export function isGalleryConfigured() {
  return Boolean(galleryFolderId() && process.env.GOOGLE_SERVICE_ACCOUNT_JSON);
}

async function listChildren(folderId: string, token: string, limit: number): Promise<DriveFile[]> {
  const files: DriveFile[] = [];
  let pageToken: string | undefined;
  do {
    const params = new URLSearchParams({
      q: `'${folderId}' in parents and trashed = false and (mimeType contains 'image/' or mimeType = '${FOLDER_MIME}')`,
      fields: "nextPageToken, files(id, name, mimeType, imageMediaMetadata(width, height, rotation))",
      orderBy: "createdTime desc",
      pageSize: "200",
      supportsAllDrives: "true",
      includeItemsFromAllDrives: "true",
    });
    if (pageToken) params.set("pageToken", pageToken);
    const response = await fetch(`${DRIVE}?${params}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });
    if (!response.ok) {
      console.error(`[gallery] Drive list failed with ${response.status} for folder ${folderId}.`);
      break;
    }
    const data = (await response.json()) as { files?: DriveFile[]; nextPageToken?: string };
    files.push(...(data.files ?? []));
    pageToken = data.nextPageToken;
  } while (pageToken && files.length < limit);
  return files.slice(0, limit);
}

/** Signed proxy URLs for a Drive photo, at each width. */
function photoSrc(fileId: string): GalleryImage["src"] {
  const sig = signFileId(fileId);
  return Object.fromEntries(
    GALLERY_WIDTHS.map((w) => [w, `/api/gallery/${fileId}?w=${w}&sig=${sig}`]),
  ) as GalleryImage["src"];
}

function toImage(file: DriveFile, albumName: string, index: number): GalleryImage {
  const meta = file.imageMediaMetadata;
  // Drive reports the stored size; thumbnails come out already rotated.
  const sideways = meta?.rotation === 1 || meta?.rotation === 3;
  const width = (sideways ? meta?.height : meta?.width) ?? null;
  const height = (sideways ? meta?.width : meta?.height) ?? null;
  return { id: file.id, alt: `Photo ${index + 1} from ${albumName}`, src: photoSrc(file.id), width, height };
}

/** A trip's cover photo from its Drive file id, or null when it has none (or the id is malformed). */
export function coverPhoto(fileId: string | null | undefined, alt: string): GalleryImage | null {
  if (!fileId) return null;
  const site = siteCover(fileId);
  if (site) return { id: fileId, alt: site.alt, src: { 480: site.path, 960: site.path, 1600: site.path }, width: null, height: null };
  if (!DRIVE_ID.test(fileId)) return null;
  return { id: fileId, alt, src: photoSrc(fileId), width: null, height: null };
}

export type CoverChoice = { id: string; thumb: string; album: string };

/** Gallery photos organisers can pick a trip cover from, newest albums first. */
export async function getCoverChoices(limit = 80): Promise<CoverChoice[]> {
  const albums = await getGallery();
  const site = SITE_COVERS.map((c) => ({ id: `${SITE_COVER_PREFIX}${c.file}`, thumb: `/covers/${c.file}`, album: "the site" }));
  return [
    ...site,
    ...albums.flatMap((album) => album.images.map((image) => ({ id: image.id, thumb: image.src[480], album: album.name }))),
  ].slice(0, limit);
}

async function loadGallery(folderId: string): Promise<GalleryAlbum[]> {
  const token = await getGoogleAccessToken(DRIVE_READONLY_SCOPE);
  if (!token) return [];

  const top = await listChildren(folderId, token, 400);
  const folders = top.filter((f) => f.mimeType === FOLDER_MIME).slice(0, 24);
  const looseImages = top.filter((f) => f.mimeType !== FOLDER_MIME);

  const albums: GalleryAlbum[] = [];
  if (looseImages.length) {
    albums.push({ id: "latest", name: "Latest", images: looseImages.map((f, i) => toImage(f, "the group", i)) });
  }

  const nested = await Promise.all(
    folders.map(async (folder) => {
      const files = await listChildren(folder.id, token, 300);
      const images = files.filter((f) => f.mimeType !== FOLDER_MIME).map((f, i) => toImage(f, folder.name, i));
      return { id: folder.id, name: folder.name, images };
    }),
  );
  albums.push(...nested.filter((a) => a.images.length > 0));
  return albums;
}

/** All albums, cached for ten minutes. Empty when the gallery isn't configured or Drive is unreachable. */
export async function getGallery(): Promise<GalleryAlbum[]> {
  const folderId = galleryFolderId();
  if (!folderId || !process.env.GOOGLE_SERVICE_ACCOUNT_JSON) return [];
  try {
    return await unstable_cache(() => loadGallery(folderId), ["gallery", folderId], { revalidate: 600 })();
  } catch (error) {
    console.error("[gallery] Could not load the gallery", error);
    return [];
  }
}

/** The newest photos across all albums, for the home page. */
export async function getLatestPhotos(limit: number): Promise<GalleryImage[]> {
  const albums = await getGallery();
  const seen = new Set<string>();
  const photos: GalleryImage[] = [];
  for (const album of albums) {
    for (const image of album.images.slice(0, limit)) {
      if (!seen.has(image.id)) {
        seen.add(image.id);
        photos.push(image);
      }
    }
  }
  return photos.slice(0, limit);
}
