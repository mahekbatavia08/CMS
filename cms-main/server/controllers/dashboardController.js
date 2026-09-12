import asyncHandler from "../utils/asyncHandler.js";
import sendSuccess from "../utils/apiResponse.js";

import { getDashboardStats } from "../services/dashboardService.js";

import { getProjectOverview as getProjectOverviewService } from "../services/projectService.js";

/**
 * @route   GET /api/dashboard/stats
 * @access  Private
 */
const getStats = asyncHandler(async (req, res) => {
  const stats = await getDashboardStats();

  sendSuccess(
    res,
    200,
    "Dashboard statistics fetched successfully",
    stats
  );
});

/**
 * @route   GET /api/dashboard/project-overview
 * @access  Private
 */
const getProjectOverview = asyncHandler(async (req, res) => {
  const overview = await getProjectOverviewService(req.query);

  sendSuccess(
    res,
    200,
    "Project overview fetched successfully",
    overview
  );
});

export {
  getStats,
  getProjectOverview,
};