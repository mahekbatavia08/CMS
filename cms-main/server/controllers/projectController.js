import asyncHandler from "../utils/asyncHandler.js";
import sendSuccess from "../utils/apiResponse.js";
import {
  createProject,
  getProjects,
  getProjectOverview,
  getProjectById,
  updateProject,
  deleteProject,
  uploadProjectFloorPlan,
  deleteProjectFloorPlan,
  replaceProjectFloorPlan,
} from "../services/projectService.js";

/**
 * @route   POST /api/projects
 * @access  Private
 */
const create = asyncHandler(async (req, res) => {
  const project = await createProject(req.body, req.files);
  sendSuccess(res, 201, "Project created successfully", { project });
});

/**
 * @route   GET /api/projects
 * @access  Private
 */
const getAll = asyncHandler(async (req, res) => {
  const { items, totalItems, totalPages, currentPage } = await getProjects(
    req.query,
  );

  sendSuccess(res, 200, "Projects fetched successfully", {
    items,
    totalItems,
    totalPages,
    currentPage,
  });
});

/**
 * @route   GET /api/projects/overview
 * @access  Private
 */
const getOverview = asyncHandler(async (req, res) => {
  const { items, totalItems, totalPages, currentPage } =
    await getProjectOverview(req.query);

  sendSuccess(res, 200, "Project overview fetched successfully", {
    items,
    totalItems,
    totalPages,
    currentPage,
  });
});

/**
 * @route   GET /api/projects/:id
 * @access  Private
 */
const getOne = asyncHandler(async (req, res) => {
  const project = await getProjectById(req.params.id);

  sendSuccess(res, 200, "Project fetched successfully", {
    project,
  });
});

/**
 * @route   PATCH /api/projects/:id
 * @access  Private
 */
const update = asyncHandler(async (req, res) => {
  const project = await updateProject(req.params.id, req.body);

  sendSuccess(res, 200, "Project updated successfully", {
    project,
  });
});

/**
 * @route   DELETE /api/projects/:id
 * @access  Private
 *
 * Performs a soft delete only. The document is never removed from the
 * database; status.isDeleted is set to true instead.
 */
const remove = asyncHandler(async (req, res) => {
  await deleteProject(req.params.id);

  sendSuccess(res, 200, "Project deleted successfully");
});

/**
 * @route   POST /api/projects/:projectId/floorplans
 * @access  Private
 */
const uploadFloorPlan = asyncHandler(async (req, res) => {
  const project = await uploadProjectFloorPlan(
    req.params.projectId,
    req.body.title,
    req.file,
  );

  sendSuccess(res, 201, "Floor plan uploaded successfully", { project });
});

/**
 * @route   DELETE /api/projects/:projectId/floorplans/:floorPlanId
 * @access  Private
 */
const deleteFloorPlan = asyncHandler(async (req, res) => {
  const project = await deleteProjectFloorPlan(
    req.params.projectId,
    req.params.floorPlanId,
  );

  sendSuccess(res, 200, "Floor plan deleted successfully", { project });
});

const replaceFloorPlan = asyncHandler(async (req, res) => {
  const project = await replaceProjectFloorPlan(
    req.params.projectId,
    req.params.floorPlanId,
    req.body.title,
    req.file,
  );

  sendSuccess(res, 200, "Floor plan replaced successfully.", { project });
});

export {
  create,
  getAll,
  getOverview,
  getOne,
  update,
  remove,
  uploadFloorPlan,
  deleteFloorPlan,
  replaceFloorPlan,
};
