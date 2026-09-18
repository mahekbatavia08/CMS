import Project from "../models/Project.js";
import ApiError from "../utils/ApiError.js";
import { uploadOnCloudinary, deleteFromCloudinary } from "../utils/cloudinary.js";
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
  const project = await Project.findOne({ _id: projectId, "status.isDeleted": { $ne: true } });

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
 * The previous cover image file, if any, is deleted from Cloudinary.
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

  const project = await getProjectOrThrow(projectId, file);

  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/cover`);
  
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload image to Cloudinary");
  }

  const previousCoverUrl = project.media?.coverImage?.url;

  if (!project.media) project.media = {};
  project.media.coverImage = { url: cloudinaryResponse.secure_url, alt: alt || "" };
  await project.save();

  if (previousCoverUrl && previousCoverUrl.includes("cloudinary.com")) {
    await deleteFromCloudinary(previousCoverUrl, "image");
  }

  return project;
};

/**
 * Uploads (and replaces) a project's thumbnail image.
 * If an old thumbnail image exists, it is deleted from Cloudinary.
 *
 * @param {string} projectId - MongoDB _id of the project
 * @param {object} file - Multer file object
 * @param {string} [alt] - Optional alt text
 * @returns {Promise<object>} The updated project document
 */
const uploadThumbnailImage = async (projectId, file, alt) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  const project = await getProjectOrThrow(projectId, file);

  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/thumbnail`);
  
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload image to Cloudinary");
  }

  const previousThumbnailUrl = project.media?.thumbnailImage?.url;

  if (!project.media) project.media = {};
  project.media.thumbnailImage = { url: cloudinaryResponse.secure_url, alt: alt || "" };
  await project.save();

  if (previousThumbnailUrl && previousThumbnailUrl.includes("cloudinary.com")) {
    await deleteFromCloudinary(previousThumbnailUrl, "image");
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

  const project = await getProjectOrThrow(projectId, file);

  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/gallery`);
  
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload image to Cloudinary");
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

    // Re-fetch the newly added album as a Mongoose subdocument
    album = project.media.gallery.find(
      (a) => a.albumName === meta.albumName
    );
  }

  album.images.push({
    url: cloudinaryResponse.secure_url,
    alt: meta.alt || "",
    caption: meta.caption || "",
    displayOrder:
      meta.displayOrder !== undefined
        ? Number(meta.displayOrder)
        : album.images.length,
  });

  await project.save();

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

  const project = await getProjectOrThrow(projectId, file);

  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/videos`);
  
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload video to Cloudinary");
  }

  project.videos.push({
    title: meta.title || "",
    type: "upload",
    url: cloudinaryResponse.secure_url,
    displayOrder: meta.displayOrder !== undefined ? Number(meta.displayOrder) : project.videos.length,
  });

  await project.save();

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

  const project = await getProjectOrThrow(projectId, file);

  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/floorplans`);
  
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload floor plan to Cloudinary");
  }

  project.floorPlans.push({
    title: meta.title || "",
    url: cloudinaryResponse.secure_url,
    displayOrder: meta.displayOrder !== undefined ? Number(meta.displayOrder) : project.floorPlans.length,
  });

  await project.save();

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

  const project = await getProjectOrThrow(projectId, file);

  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/brochures`);
  
  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload brochure to Cloudinary");
  }

  project.brochures.push({
    title: title || "",
    url: cloudinaryResponse.secure_url,
  });

  await project.save();

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

  const project = await getProjectOrThrow(projectId, file);

  // Uploaded as "raw" (not "auto") because Cloudinary resolves PDFs under
  // "auto" to an image-delivery resource, which its PDF/ZIP access
  // restrictions block from being viewed directly.
  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/legal`, "raw");

  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload legal document to Cloudinary");
  }

  project.legalDocuments.push({
    title: title || "",
    url: cloudinaryResponse.secure_url,
  });

  await project.save();

  return project;
};

/**
 * Uploads (and replaces) a project's RERA certificate.
 * The previous certificate file, if any, is deleted from Cloudinary.
 *
 * @param {string} projectId
 * @param {object} file - Multer file object (from uploads/temp/)
 * @returns {Promise<object>} The updated project document
 */
const uploadReraCertificate = async (projectId, file) => {
  if (!file) {
    throw new ApiError(400, "No file was uploaded");
  }

  const project = await getProjectOrThrow(projectId, file);

  const cloudinaryResponse = await uploadOnCloudinary(file.path, `portfolio-cms/projects/${projectId}/rera`);

  if (!cloudinaryResponse) {
    throw new ApiError(500, "Failed to upload RERA certificate to Cloudinary");
  }

  const previousCertificateUrl = project.rera?.certificate?.url;

  if (!project.rera) project.rera = {};
  project.rera.certificate = {
    url: cloudinaryResponse.secure_url,
    name: file.originalname || "",
  };
  await project.save();

  if (previousCertificateUrl && previousCertificateUrl.includes("cloudinary.com")) {
    await deleteFromCloudinary(previousCertificateUrl, "image");
  }

  return project;
};

export {
  uploadCoverImage,
  uploadThumbnailImage,
  uploadGalleryImage,
  uploadVideo,
  uploadFloorPlan,
  uploadBrochure,
  uploadLegalDocument,
  uploadReraCertificate,
};