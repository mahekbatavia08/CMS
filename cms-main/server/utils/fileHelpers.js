import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

const UPLOADS_ROOT = path.join(process.cwd(), "uploads");
const TEMP_DIR = path.join(UPLOADS_ROOT, "temp");
const PROJECTS_DIR = path.join(UPLOADS_ROOT, "projects");

/**
 * Generates a unique filename while preserving the original file extension.
 * Combines a timestamp with a random hex string to avoid collisions even
 * when multiple files are uploaded in the same millisecond.
 *
 * @param {string} originalFilename - The original name of the uploaded file
 * @returns {string} A unique filename, e.g. "1720600000000-a1b2c3d4.jpg"
 */
const generateUniqueFilename = (originalFilename) => {
  const extension = path.extname(originalFilename).toLowerCase();
  const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}`;

  return `${uniqueSuffix}${extension}`;
};

/**
 * Ensures a dedicated upload folder exists for a given project, creating it
 * (and any missing parent directories) if it doesn't already exist.
 *
 * @param {string} projectId - The project's unique identifier
 * @returns {Promise<string>} Absolute path to the project's upload folder
 */
const createProjectFolder = async (projectId) => {
  if (!projectId) {
    throw new Error("projectId is required to create a project folder");
  }

  const projectFolderPath = path.join(PROJECTS_DIR, String(projectId));

  await fs.mkdir(projectFolderPath, { recursive: true });

  return projectFolderPath;
};

/**
 * Moves a file that was uploaded to uploads/temp/ into its final destination
 * folder (typically a project's folder), preserving the filename.
 *
 * @param {string} tempFilePath - Absolute path to the file inside uploads/temp/
 * @param {string} destinationFolder - Absolute path to the target folder
 * @returns {Promise<string>} Absolute path to the file at its new location
 */
const moveUploadedFile = async (tempFilePath, destinationFolder) => {
  await fs.mkdir(destinationFolder, { recursive: true });

  const filename = path.basename(tempFilePath);
  const destinationPath = path.join(destinationFolder, filename);

  await fs.rename(tempFilePath, destinationPath);

  return destinationPath;
};

/**
 * Deletes a single file if it exists. Does not throw if the file is
 * already missing, since the desired end state (file gone) is achieved
 * either way.
 *
 * @param {string} filePath - Absolute path to the file to delete
 * @returns {Promise<void>}
 */
const deleteFile = async (filePath) => {
  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

/**
 * Recursively deletes a folder and all of its contents if it exists.
 * Does not throw if the folder is already missing.
 *
 * @param {string} folderPath - Absolute path to the folder to delete
 * @returns {Promise<void>}
 */
const deleteFolder = async (folderPath) => {
  try {
    await fs.rm(folderPath, { recursive: true, force: true });
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

export {
  UPLOADS_ROOT,
  TEMP_DIR,
  PROJECTS_DIR,
  generateUniqueFilename,
  createProjectFolder,
  moveUploadedFile,
  deleteFile,
  deleteFolder,
};