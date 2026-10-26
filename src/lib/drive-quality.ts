export const LANDING_IMAGE_MIN_BYTES = 1024 * 1024;
export const LANDING_IMAGE_MIN_WIDTH = 1600;
export const LANDING_IMAGE_MIN_HEIGHT = 900;

export type DriveImageQuality = {
  size?: string;
  imageMediaMetadata?: { width?: number; height?: number; rotation?: number };
};

/** Hero images must remain sharp on both laptop and high-density mobile screens. */
export function meetsLandingImageQuality(file: DriveImageQuality) {
  const bytes = Number(file.size ?? 0);
  const meta = file.imageMediaMetadata;
  const sideways = meta?.rotation === 1 || meta?.rotation === 3;
  const width = (sideways ? meta?.height : meta?.width) ?? 0;
  const height = (sideways ? meta?.width : meta?.height) ?? 0;
  return bytes >= LANDING_IMAGE_MIN_BYTES && width >= LANDING_IMAGE_MIN_WIDTH && height >= LANDING_IMAGE_MIN_HEIGHT;
}
