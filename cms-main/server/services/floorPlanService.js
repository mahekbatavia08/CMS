import fs from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { processPdf } from "../utils/pdfToDzi.js";

const ROOT_UPLOAD_DIR = path.join(process.cwd(), "uploads", "floorplans");

export const deleteFloorPlanFiles = async (originalPdfPath) => {
  try {
    if (originalPdfPath) {
      const fullPath = path.resolve(process.cwd(), originalPdfPath);
      const dirPath = path.dirname(fullPath);
      // Ensure we are only deleting within the floorplans directory
      if (dirPath.includes("uploads") && dirPath.includes("floorplans")) {
        await fs.rm(dirPath, { recursive: true, force: true });
      }
    }
  } catch (err) {
    console.error("Error deleting floor plan files:", err);
  }
};

class FloorPlanService {
  async processFloorPlan(projectId, tempFilePath, mimetype, originalname) {
    // unique folder for this floorplan
    const floorPlanId = randomUUID();

    const outputDir = path.join(
      ROOT_UPLOAD_DIR,
      projectId.toString(),
      floorPlanId,
    );

    await fs.mkdir(outputDir, { recursive: true });

    // Handle images (PNG/JPEG)
    if (mimetype === "image/png" || mimetype === "image/jpeg" || mimetype === "image/jpg") {
      const ext = path.extname(originalname) || (mimetype === "image/png" ? ".png" : ".jpg");
      const originalFile = path.join(outputDir, `original${ext}`);

      await fs.rename(tempFilePath, originalFile);

      const relPath = this.normalize(originalFile);

      return {
        floorPlanId,
        originalPdf: relPath,
        thumbnail: relPath,
        pageCount: 1,
        pages: [{
          pageNumber: 1,
          dziPath: relPath,
          url: relPath,
        }],
      };
    }

    // Handle PDF (legacy flow)
    const originalPdf = path.join(outputDir, "original.pdf");

    await fs.rename(tempFilePath, originalPdf);

    const result = await processPdf(originalPdf, outputDir);

    return {
      floorPlanId,

      originalPdf: this.normalize(originalPdf),

      thumbnail: this.normalize(path.join(outputDir, result.thumbnail)),

      pageCount: result.pageCount,

      pages: result.pages.map((page) => ({
        pageNumber: page.pageNumber,
        dziPath: this.normalize(path.join(outputDir, page.dziPath)),
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