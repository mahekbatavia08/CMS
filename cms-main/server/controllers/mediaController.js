import asyncHandler from "../utils/asyncHandler.js";
import sendSuccess from "../utils/apiResponse.js";
import {
  uploadCoverImage,
  uploadThumbnailImage,
  uploadGalleryImage,
  uploadVideo,
  uploadFloorPlan,
  uploadBrochure,
  uploadLegalDocument,
} from "../services/mediaService.js";

/**
 * @route   POST /api/projects/:id/media/cover
 * @access  Private
 */
const uploadCover = asyncHandler(async (req, res) => {
  const project = await uploadCoverImage(
    req.params.id,
    req.file,
    req.body.alt
  );

  sendSuccess(res, 200, "Cover image uploaded successfully", {
    project,
  });
});

/**
 * @route   POST /api/projects/:id/media/thumbnail
 * @access  Private
 */
const uploadThumbnail = asyncHandler(async (req, res) => {
  const project = await uploadThumbnailImage(
    req.params.id,
    req.file,
    req.body.alt
  );

  sendSuccess(res, 200, "Thumbnail image uploaded successfully", {
    project,
  });
});

/**
 * @route   POST /api/projects/:id/media/gallery
 * @access  Private
 */
const uploadGallery = asyncHandler(async (req, res) => {
  const {
    albumName,
    alt,
    caption,
    displayOrder,
  } = req.body;

  const project = await uploadGalleryImage(
    req.params.id,
    req.file,
    {
      albumName,
      alt,
      caption,
      displayOrder,
    }
  );

  sendSuccess(res, 200, "Gallery image uploaded successfully", {
    project,
  });
});

/**
 * @route   POST /api/projects/:id/media/video
 * @access  Private
 */
const uploadProjectVideo = asyncHandler(async (req, res) => {
  const { title, displayOrder } = req.body;

  const project = await uploadVideo(
    req.params.id,
    req.file,
    {
      title,
      displayOrder,
    }
  );

  sendSuccess(res, 200, "Video uploaded successfully", {
    project,
  });
});

/**
 * @route   POST /api/projects/:id/media/floorplan
 * @access  Private
 */
const uploadProjectFloorPlan = asyncHandler(async (req, res) => {
  const { title, displayOrder } = req.body;

  const project = await uploadFloorPlan(
    req.params.id,
    req.file,
    {
      title,
      displayOrder,
    }
  );

  sendSuccess(res, 200, "Floor plan uploaded successfully", {
    project,
  });
});

/**
 * @route   POST /api/projects/:id/media/brochure
 * @access  Private
 */
const uploadProjectBrochure = asyncHandler(async (req, res) => {
  const project = await uploadBrochure(
    req.params.id,
    req.file,
    req.body.title
  );

  sendSuccess(res, 200, "Brochure uploaded successfully", {
    project,
  });
});

/**
 * @route   POST /api/projects/:id/media/legal
 * @access  Private
 */
const uploadProjectLegal = asyncHandler(async (req, res) => {
  const project = await uploadLegalDocument(
    req.params.id,
    req.file,
    req.body.title
  );

  sendSuccess(res, 200, "Legal document uploaded successfully", {
    project,
  });
});

export {
  uploadCover,
  uploadThumbnail,
  uploadGallery,
  uploadProjectVideo,
  uploadProjectFloorPlan,
  uploadProjectBrochure,
  uploadProjectLegal,
};