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
