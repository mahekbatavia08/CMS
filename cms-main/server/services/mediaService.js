import { findProjectById, saveProject } from "../models/Project.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnStorage, deleteFromStorage, isStorageUrl } from "../utils/storage.js";
import { deleteFile } from "../utils/fileHelpers.js";

/**
 * Fetches a project by id, excluding soft-deleted projects.
 * Shared by every media upload operation to confirm the project exists
 * before touching the filesystem or database.
 *
 * If the project cannot be found, the given temp file (already saved to
 * disk by Multer before this check runs) is deleted so it doesn't linger
 * as an orphaned file in uploads/temp/.
 *
 * @param {string} projectId
 * @param {object} [file] - Multer file object to clean up on failure
 * @returns {Promise<object>} The project document
 */
const getProjectOrThrow = async (projectId, file) => {
  const project = await findProjectById(projectId, { excludeDeleted: true });

  if (!project) {
    if (file?.path) {
      await deleteFile(file.path);
    }
    throw new ApiError(404, "Project not found");
  }

  return project;
};

/**
 * Uploads (and replaces) a project's cover image.
 * The previous cover image file, if any, is deleted from storage.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object (from uploads/temp/)
 * @param {string} [alt] - Optional alt text for the cover image
 * @returns {Promise<object>} The updated project document
 */
const uploadCoverImage = async (projectId, file, alt) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/cover`, file.mimetype);
  
  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload image to storage");
  }

  const previousCoverUrl = project.media?.coverImage?.url;

  if (!project.media) project.media = {};
  project.media.coverImage = { url: storageResponse.secure_url, alt: alt || "" };
  project = await saveProject(project);

  if (previousCoverUrl && isStorageUrl(previousCoverUrl)) {
    await deleteFromStorage(previousCoverUrl);
  }

  return project;
};

/**
 * Uploads (and replaces) a project's thumbnail image.
 * If an old thumbnail image exists, it is deleted from storage.
 *
 * @param {string} projectId - _id of the project
 * @param {object} file - Multer file object
 * @param {string} [alt] - Optional alt text
 * @returns {Promise<object>} The updated project document
 */
const uploadThumbnailImage = async (projectId, file, alt) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/thumbnail`, file.mimetype);
  
  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload image to storage");
  }

  const previousThumbnailUrl = project.media?.thumbnailImage?.url;

  if (!project.media) project.media = {};
  project.media.thumbnailImage = { url: storageResponse.secure_url, alt: alt || "" };
  project = await saveProject(project);

  if (previousThumbnailUrl && isStorageUrl(previousThumbnailUrl)) {
    await deleteFromStorage(previousThumbnailUrl);
  }

  return project;
};

/**
 * Uploads (and replaces) a project's logo image.
 * The previous logo, if any, is deleted from storage.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object
 * @param {string} [alt] - Optional alt text
 * @returns {Promise<object>} The updated project document
 */
const uploadLogoImage = async (projectId, file, alt) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/logo`, file.mimetype);

  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload image to storage");
  }

  const previousLogoUrl = project.media?.logoImage?.url;

  if (!project.media) project.media = {};
  project.media.logoImage = { url: storageResponse.secure_url, alt: alt || "" };
  project = await saveProject(project);

  if (previousLogoUrl && isStorageUrl(previousLogoUrl)) {
    await deleteFromStorage(previousLogoUrl);
  }

  return project;
};

/**
 * Uploads a new gallery image and appends it to the project's existing
 * gallery array. Existing gallery images are never overwritten or removed.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object (from uploads/temp/)
 * @param {object} [meta] - Optional { alt, caption, displayOrder }
 * @returns {Promise<object>} The updated project document
 */
const uploadGalleryImage = async (projectId, file, meta = {}) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/gallery`, file.mimetype);
  
  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload image to storage");
  }

  // Find existing album
  let album = project.media.gallery.find(
    (a) => a.albumName === meta.albumName
  );

  // Create album if it doesn't exist
  if (!album) {
    album = {
      albumName: meta.albumName,
      displayOrder: project.media.gallery.length,
      images: [],
    };

    project.media.gallery.push(album);

  }

  album.images.push({
    url: storageResponse.secure_url,
    alt: meta.alt || "",
    caption: meta.caption || "",
    displayOrder:
      meta.displayOrder !== undefined
        ? Number(meta.displayOrder)
        : album.images.length,
  });

  project = await saveProject(project);

  return project;
};

/**
 * Uploads a new video and appends it to the project's existing videos
 * array. Existing videos are never overwritten or removed.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object (from uploads/temp/)
 * @param {object} [meta] - Optional { title, displayOrder }
 * @returns {Promise<object>} The updated project document
 */
const uploadVideo = async (projectId, file, meta = {}) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/videos`, file.mimetype);
  
  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload video to storage");
  }

  project.videos.push({
    title: meta.title || "",
    type: "upload",
    url: storageResponse.secure_url,
    displayOrder: meta.displayOrder !== undefined ? Number(meta.displayOrder) : project.videos.length,
  });

  project = await saveProject(project);

  return project;
};

/**
 * Uploads a new floor plan image and appends it to the project's existing
 * floorPlans array. Existing floor plans are never overwritten or removed.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object (from uploads/temp/)
 * @param {object} [meta] - Optional { title, displayOrder }
 * @returns {Promise<object>} The updated project document
 */
const uploadFloorPlan = async (projectId, file, meta = {}) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/floorplans`, file.mimetype);
  
  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload floor plan to storage");
  }

  project.floorPlans.push({
    title: meta.title || "",
    url: storageResponse.secure_url,
    displayOrder: meta.displayOrder !== undefined ? Number(meta.displayOrder) : project.floorPlans.length,
  });

  project = await saveProject(project);

  return project;
};

/**
 * Uploads (and replaces) a project's brochure.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object (from uploads/temp/)
 * @param {string} [title] - Optional brochure title
 * @returns {Promise<object>} The updated project document
 */
const uploadBrochure = async (projectId, file, title) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/brochures`, file.mimetype);

  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload brochure to storage");
  }

  project.brochures.push({
    title: title || "",
    url: storageResponse.secure_url,
  });

  project = await saveProject(project);

  return project;
};

/**
 * Uploads a new legal document and appends it to the project's existing
 * legalDocuments array.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object
 * @param {string} [title]
 * @returns {Promise<object>}
 */
const uploadLegalDocument = async (projectId, file, title) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/legal`, file.mimetype);

  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload legal document to storage");
  }

  project.legalDocuments.push({
    title: title || "",
    url: storageResponse.secure_url,
  });

  project = await saveProject(project);

  return project;
};

/**
 * Uploads (and replaces) a project's RERA certificate.
 * The previous certificate file, if any, is deleted from storage.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object (from uploads/temp/)
 * @returns {Promise<object>} The updated project document
 */
const uploadReraCertificate = async (projectId, file) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  let project = await getProjectOrThrow(projectId, file);

  const storageResponse = await uploadOnStorage(file.path, `projects/${projectId}/rera`, file.mimetype);

  if (!storageResponse) {
    throw new ApiError(500, "Failed to upload RERA certificate to storage");
  }

  const previousCertificateUrl = project.rera?.certificate?.url;

  if (!project.rera) project.rera = {};
  project.rera.certificate = {
    url: storageResponse.secure_url,
    name: file.originalname || "",
  };
  project = await saveProject(project);

  if (previousCertificateUrl && isStorageUrl(previousCertificateUrl)) {
    await deleteFromStorage(previousCertificateUrl);
  }

  return project;
};

export {
  uploadCoverImage,
  uploadThumbnailImage,
  uploadLogoImage,
  uploadGalleryImage,
  uploadVideo,
  uploadFloorPlan,
  uploadBrochure,
  uploadLegalDocument,
  uploadReraCertificate,
};