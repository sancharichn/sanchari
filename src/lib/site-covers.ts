/**
 * Cover photos kept in the site itself (public/covers), for trips whose photos
 * aren't in the Drive gallery yet. Stored on a trip as "site:<file name>".
 */
export const SITE_COVERS = [{ file: "jawadhu-hills-camp.jpg", alt: "Tents lit up under a starry sky, Jawadhu Hills" }] as const;

export const SITE_COVER_PREFIX = "site:";

export function siteCover(id: string) {
  if (!id.startsWith(SITE_COVER_PREFIX)) return null;
  const file = id.slice(SITE_COVER_PREFIX.length);
  const cover = SITE_COVERS.find((c) => c.file === file);
  return cover ? { id, path: `/covers/${cover.file}`, alt: cover.alt } : null;
}
