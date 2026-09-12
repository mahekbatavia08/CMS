import fs from "fs/promises";
import path from "path";
import { pdfToPng } from "pdf-to-png-converter";
import sharp from "sharp";

/**
 * Converts a PDF to a Deep Zoom Image (.dzi + tiles) per page.
 *
 * @param {string} inputPdf - The path to the input PDF file.
 * @param {string} outputDir - The directory where outputs should be saved.
 * @returns {Promise<Object>} An object containing the success status and metadata.
 */
export async function processPdf(inputPdf, outputDir) {
  // Ensure the output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  // Convert PDF pages to PNG buffers.
  // We use viewportScale: 4.0 to achieve high resolution.
  const pngPages = await pdfToPng(inputPdf, {
    viewportScale: 4.0,
  });

  const pageCount = pngPages.length;
  if (pageCount === 0) {
    throw new Error("PDF contains no pages.");
  }

  const pages = [];

  // Generate a smaller thumbnail preview from the first page
  const thumbnailPath = path.join(outputDir, "thumbnail.png");
  await sharp(pngPages[0].content)
    .resize(500) // resizes maintaining aspect ratio
    .toFile(thumbnailPath);

  for (let i = 0; i < pageCount; i++) {
    // pdf-to-png-converter objects contain a 1-indexed pageNumber
    const pageNumber = pngPages[i].pageNumber || i + 1;
    
    // Format the page number with leading zeros (e.g., "001", "002")
    const pageNumberStr = pageNumber.toString().padStart(3, "0");
    const dziName = `page_${pageNumberStr}`;
    const dziPath = path.join(outputDir, dziName);

    // Using sharp's `.tile()` method natively produces Deep Zoom Image (DZI) outputs.
    // It creates a `page_XXX.dzi` file and a `page_XXX_files` folder with the image tiles.
    await sharp(pngPages[i].content)
      .png()
      .tile({
        size: 256,
        overlap: 1,
      })
      .toFile(dziPath + ".dzi");

    pages.push({
      pageNumber: pageNumber,
      dziPath: `${dziName}.dzi`,
    });
  }

  return {
    success: true,
    thumbnail: "thumbnail.png",
    pageCount,
    pages,
  };
}
