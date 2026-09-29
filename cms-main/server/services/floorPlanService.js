import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { processPdf } from "../utils/pdfToDzi.js";
import {
  getPublicUrl,
  getStorageKeyFromUrl,
  uploadDirectory,
  deleteStorageFolder,
} from "../utils/storage.js";

// Local scratch folder used only while converting; results go to Supabase Storage.
const WORK_DIR = path.join(process.cwd(), "uploads", "temp-floorplans", "work");

/**
 * Deletes every file of a floor plan (original, thumbnail, DZI tiles).
 * Accepts the stored `originalPdf` value: a Supabase Storage URL (current)
 * or a legacy relative path under uploads/floorplans (pre-migration).
 */
export const deleteFloorPlanFiles = async (originalPdfPath) => {
  try {
    if (!originalPdfPath) return;

    const key = getStorageKeyFromUrl(originalPdfPath);
    if (key) {
      const folder = path.posix.dirname(key);
      // Ensure we only delete inside a floorplans folder
      if (folder.includes("floorplans")) {
        await deleteStorageFolder(folder);
      }
      return;
    }

    // Legacy local files
    const fullPath = path.resolve(process.cwd(), originalPdfPath);
    const dirPath = path.dirname(fullPath);
    if (dirPath.includes("uploads") && dirPath.includes("floorplans")) {
      await fs.rm(dirPath, { recursive: true, force: true });
    }
  } catch (err) {
    console.error("Error deleting floor plan files:", err);
  }
};

class FloorPlanService {
  async processFloorPlan(projectId, tempFilePath, mimetype, originalname) {
    // unique folder for this floorplan
    const floorPlanId = randomUUID();

    const outputDir = path.join(WORK_DIR, floorPlanId);
    const storagePrefix = `projects/${projectId.toString()}/floorplans/${floorPlanId}`;

    await fs.mkdir(outputDir, { recursive: true });

    try {
      const result = await this.processIntoDir(outputDir, floorPlanId, tempFilePath, mimetype, originalname);

      // Upload the whole folder (original + thumbnail + DZI tiles) to storage
      await uploadDirectory(outputDir, storagePrefix);

      const toUrl = (rel) => (rel ? getPublicUrl(`${storagePrefix}/${rel}`) : "");

      return {
        floorPlanId,
        originalPdf: toUrl(result.originalPdf),
        thumbnail: toUrl(result.thumbnail),
        pageCount: result.pageCount,
        pages: result.pages.map((page) => ({
          pageNumber: page.pageNumber,
          dziPath: toUrl(page.dziPath),
          ...(page.url ? { url: toUrl(page.url) } : {}),
        })),
      };
    } catch (err) {
      // Don't leave a half-uploaded floor plan behind.
      await deleteStorageFolder(storagePrefix).catch(() => {});
      throw err;
    } finally {
      // Local scratch + temp upload are never kept.
      await fs.rm(outputDir, { recursive: true, force: true }).catch(() => {});
      await fs.rm(tempFilePath, { force: true }).catch(() => {});
    }
  }

  /**
   * Converts the upload inside outputDir. Returned paths are relative to
   * outputDir (they become storage keys under the floor plan's prefix).
   */
  async processIntoDir(outputDir, floorPlanId, tempFilePath, mimetype, originalname) {
    // Handle images (PNG/JPEG/WEBP)
    if (mimetype === "image/png" || mimetype === "image/jpeg" || mimetype === "image/jpg" || mimetype === "image/webp") {
      const ext = path.extname(originalname) || (mimetype === "image/png" ? ".png" : mimetype === "image/webp" ? ".webp" : ".jpg");
      const fileName = `original${ext.toLowerCase()}`;

      await fs.copyFile(tempFilePath, path.join(outputDir, fileName));

      return {
        floorPlanId,
        originalPdf: fileName,
        thumbnail: fileName,
        pageCount: 1,
        pages: [{
          pageNumber: 1,
          dziPath: fileName,
          url: fileName,
        }],
      };
    }

    // Handle PDF (legacy flow)
    const originalPdf = path.join(outputDir, "original.pdf");

    await fs.copyFile(tempFilePath, originalPdf);

    const result = await processPdf(originalPdf, outputDir);

    return {
      floorPlanId,

      originalPdf: "original.pdf",

      thumbnail: this.normalize(result.thumbnail),

      pageCount: result.pageCount,

      pages: result.pages.map((page) => ({
        pageNumber: page.pageNumber,
        dziPath: this.normalize(page.dziPath),
      })),
    };
  }

  /**
   * Replaces an existing floor plan with a newly uploaded file.
   */
  async replaceFloorPlan(projectId, tempFilePath, oldOriginalPdf, mimetype, originalname) {
    // Generate the new floor plan first.
    const newFloorPlan = await this.processFloorPlan(projectId, tempFilePath, mimetype, originalname);

    // Only delete the old files after successful processing.
    await deleteFloorPlanFiles(oldOriginalPdf);

    return newFloorPlan;
  }

  normalize(filePath) {
    return filePath.replace(/\\/g, "/");
  }
}

export default new FloorPlanService();