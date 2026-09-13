/** True when the image was uploaded to remote storage (e.g. Supabase). */
export function isUploadedMediaUrl(imageUrl: string | null | undefined): boolean {
  const url = imageUrl?.trim() ?? "";
  return url.startsWith("http://") || url.startsWith("https://");
}

/** Shared upload rules for squad, management, and gallery media. */
export const MEDIA_UPLOAD_RULES = {
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxFileSizeLabel: "10 MB",
  acceptedTypes: "image/*",
  unlimitedCount: true,
} as const;

/** Team highlight videos uploaded from phone or PC. */
export const VIDEO_UPLOAD_RULES = {
  maxFileSizeBytes: 100 * 1024 * 1024,
  maxFileSizeLabel: "100 MB",
  acceptedTypes: "video/mp4,video/webm,video/quicktime,.mp4,.mov,.webm",
} as const;

export function isVideoMediaUrl(url: string | null | undefined): boolean {
  const value = url?.trim().toLowerCase() ?? "";
  return (
    isUploadedMediaUrl(value) &&
    (value.includes(".mp4") ||
      value.includes(".webm") ||
      value.includes(".mov") ||
      value.includes("/highlights/"))
  );
}
