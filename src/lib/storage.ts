import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabaseAdmin =
  supabaseUrl && supabaseServiceRoleKey
    ? createClient(supabaseUrl, supabaseServiceRoleKey)
    : null;

const GALLERY_BUCKET = "gallery";

function getStoragePathFromUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed || !supabaseUrl) return null;

  const prefix = `${supabaseUrl}/storage/v1/object/public/${GALLERY_BUCKET}/`;
  if (!trimmed.startsWith(prefix)) return null;

  const path = trimmed.slice(prefix.length);
  return path || null;
}

/**
 * Deletes the underlying Supabase Storage file for an uploaded media URL, if any.
 * No-ops silently for empty, external, or legacy URLs and never throws — a failed
 * cleanup should never block the database operation that triggered it.
 */
export async function deleteUploadedMedia(
  url: string | null | undefined
): Promise<void> {
  const path = getStoragePathFromUrl(url);
  if (!path || !supabaseAdmin) return;

  try {
    const { error } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .remove([path]);

    if (error) {
      console.error("Failed to delete storage file:", path, error.message);
    }
  } catch (error) {
    console.error("Failed to delete storage file:", path, error);
  }
}

/** Same as deleteUploadedMedia but for several URLs (e.g. a video + its thumbnail) in one call. */
export async function deleteUploadedMediaBatch(
  urls: Array<string | null | undefined>
): Promise<void> {
  if (!supabaseAdmin) return;

  const paths = urls
    .map((url) => getStoragePathFromUrl(url))
    .filter((path): path is string => Boolean(path));

  if (paths.length === 0) return;

  try {
    const { error } = await supabaseAdmin.storage
      .from(GALLERY_BUCKET)
      .remove(paths);

    if (error) {
      console.error("Failed to delete storage files:", paths, error.message);
    }
  } catch (error) {
    console.error("Failed to delete storage files:", paths, error);
  }
}
