import fs from "fs/promises";
import path from "path";
import supabase, { SUPABASE_URL, STORAGE_BUCKET } from "../config/supabase.js";

/**
 * ==========================================
 * Supabase Storage helpers (replaces utils/cloudinary.js)
 * ==========================================
 * Every file lives in the public bucket STORAGE_BUCKET ("cms-media").
 * The database stores the full public URL, e.g.
 *   https://<ref>.supabase.co/storage/v1/object/public/cms-media/projects/<id>/cover/<file>.jpg
 * so the client / map skins can use it directly (same as Cloudinary URLs).
 */

const MIME_BY_EXT = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".avif": "image/avif",
  ".gif": "image/gif",
  ".bmp": "image/bmp",
  ".svg": "image/svg+xml",
  ".heic": "image/heic",
  ".heif": "image/heif",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".mov": "video/quicktime",
  ".pdf": "application/pdf",
  ".dzi": "application/xml",
  ".xml": "application/xml",
  ".json": "application/json",
};

const guessContentType = (filePath, fallback = "application/octet-stream") =>
  MIME_BY_EXT[path.extname(filePath || "").toLowerCase()] || fallback;

const bucket = () => supabase.storage.from(STORAGE_BUCKET);

const PUBLIC_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${STORAGE_BUCKET}/`;

/** Public URL for a storage key. */
const getPublicUrl = (key) => bucket().getPublicUrl(key).data.publicUrl;

/** Storage key from one of our public URLs, or null if it isn't ours. */
const getStorageKeyFromUrl = (url) => {
  if (!url || typeof url !== "string" || !url.startsWith(PUBLIC_PREFIX)) return null;
  return decodeURIComponent(url.slice(PUBLIC_PREFIX.length).split("?")[0]);
};

const isStorageUrl = (url) => !!getStorageKeyFromUrl(url);

/** Uploads a buffer to a storage key and returns its public URL. */
const uploadBuffer = async (key, buffer, contentType) => {
  const { error } = await bucket().upload(key, buffer, {
    contentType: contentType || guessContentType(key),
    cacheControl: "31536000",
    upsert: true,
  });
  if (error) throw error;
  return getPublicUrl(key);
};

/**
 * Uploads a local (Multer temp) file to Supabase Storage and deletes the
 * local copy. Drop-in replacement for uploadOnCloudinary().
 *
 * @param {string} localFilePath - Path to the temporary file
 * @param {string} folderName - Folder inside the bucket, e.g. "projects/<id>/cover"
 * @param {string} [contentType] - MIME type (defaults to extension lookup)
 * @returns {Promise<{secure_url: string, path: string}|null>}
 */
const uploadOnStorage = async (localFilePath, folderName, contentType) => {
  if (!localFilePath) return null;
  try {
    const buffer = await fs.readFile(localFilePath);
    const key = `${folderName.replace(/^\/+|\/+$/g, "")}/${path.basename(localFilePath)}`;
    const type =
      contentType && contentType !== "application/octet-stream"
        ? contentType
        : guessContentType(localFilePath);
    const url = await uploadBuffer(key, buffer, type);
    return { secure_url: url, path: key };
  } catch (error) {
    console.error("Error uploading to Supabase Storage:", error);
    return null;
  } finally {
    await fs.rm(localFilePath, { force: true }).catch(() => {});
  }
};

/**
 * Deletes one file by its public URL. Drop-in replacement for
 * deleteFromCloudinary(). Non-storage URLs are ignored.
 */
const deleteFromStorage = async (url) => {
  try {
    const key = getStorageKeyFromUrl(url);
    if (!key) return null;
    const { data, error } = await bucket().remove([key]);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error deleting from Supabase Storage:", error);
    return null;
  }
};

/** Runs async tasks with a concurrency limit. */
const runLimited = async (items, limit, worker) => {
  let index = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const current = items[index++];
      await worker(current);
    }
  });
  await Promise.all(runners);
};

const listLocalFiles = async (dir) => {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...(await listLocalFiles(full)));
    else files.push(full);
  }
  return files;
};

/**
 * Uploads a whole local directory (e.g. a DZI floor plan: .dzi + tile folders)
 * to `prefix/`, preserving relative paths.
 */
const uploadDirectory = async (localDir, prefix, concurrency = 8) => {
  const files = await listLocalFiles(localDir);
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  await runLimited(files, concurrency, async (file) => {
    const rel = path.relative(localDir, file).split(path.sep).join("/");
    const buffer = await fs.readFile(file);
    await uploadBuffer(`${cleanPrefix}/${rel}`, buffer, guessContentType(file));
  });
  return files.length;
};

/** Recursively lists every object key under a storage prefix. */
const listStorageKeys = async (prefix) => {
  const keys = [];
  const cleanPrefix = prefix.replace(/^\/+|\/+$/g, "");
  for (let offset = 0; ; offset += 1000) {
    const { data, error } = await bucket().list(cleanPrefix, { limit: 1000, offset });
    if (error) throw error;
    for (const item of data) {
      const key = `${cleanPrefix}/${item.name}`;
      if (item.id === null) keys.push(...(await listStorageKeys(key))); // folder
      else keys.push(key);
    }
    if (data.length < 1000) break;
  }
  return keys;
};

/** Deletes every object under a storage prefix ("folder"). */
const deleteStorageFolder = async (prefix) => {
  try {
    const keys = await listStorageKeys(prefix);
    for (let i = 0; i < keys.length; i += 1000) {
      const { error } = await bucket().remove(keys.slice(i, i + 1000));
      if (error) throw error;
    }
    return keys.length;
  } catch (error) {
    console.error("Error deleting folder from Supabase Storage:", error);
    return 0;
  }
};

export {
  guessContentType,
  getPublicUrl,
  getStorageKeyFromUrl,
  isStorageUrl,
  uploadBuffer,
  uploadOnStorage,
  deleteFromStorage,
  uploadDirectory,
  deleteStorageFolder,
};
