import Project from "../models/Project.js";
import { buildProjectFilter } from "./projectService.js";

/**
 * Computes dashboard statistics in a single aggregation pipeline:
 * total/published/draft/archived/featured project counts, plus the 5
 * most recently created projects. Soft-deleted projects (status.isDeleted
 * = true), deleted portfolio sub-projects, and hidden sub-projects of
 * portfolio tours are excluded so only real active projects are counted.
 *
 * @returns {Promise<object>} Dashboard statistics
 */
const getDashboardStats = async () => {
  // Find any soft-deleted portfolios and ensure their sub-projects are marked deleted
  const deletedPortfolioIds = await Project.find({
    projectCategory: "portfolio",
    "status.isDeleted": true,
  }).distinct("_id");

  if (deletedPortfolioIds.length > 0) {
    await Project.updateMany(
      { parentProject: { $in: deletedPortfolioIds }, "status.isDeleted": { $ne: true } },
      { $set: { "status.isDeleted": true } }
    );
  }

  const baseFilter = buildProjectFilter({
    projectCategory: "individual",
    includeSubProjects: false,
  });

  if (deletedPortfolioIds.length > 0) {
    if (!baseFilter.$and) baseFilter.$and = [];
    baseFilter.$and.push({
      parentProject: { $nin: deletedPortfolioIds },
    });
  }

  const [result] = await Project.aggregate([
    {
      $match: baseFilter,
    },
    {
      $facet: {
        totalProjects: [{ $count: "count" }],
        publishedProjects: [
          {
            $match: {
              $or: [
                { "status.status": { $regex: /^(published|active)$/i } },
                { "status.published": true },
              ],
            },
          },
          { $count: "count" },
        ],
        draftProjects: [
          {
            $match: {
              $or: [
                { "status.status": { $regex: /^draft$/i } },
                {
                  $and: [
                    { "status.published": false },
                    { "status.status": { $not: { $regex: /^(published|active|archived)$/i } } },
                  ],
                },
              ],
            },
          },
          { $count: "count" },
        ],
        archivedProjects: [
          {
            $match: {
              "status.status": { $regex: /^archived$/i },
            },
          },
          { $count: "count" },
        ],
        featuredProjects: [
          {
            $match: {
              $or: [
                { "status.featured": true },
                { "status.featured": "true" },
              ],
            },
          },
          { $count: "count" },
        ],
        recentProjects: [
          { $sort: { createdAt: -1 } },
          { $limit: 5 },
          {
            $project: {
              _id: 1,
              projectName: "$general.projectName",
              builderName: "$general.builderName",
              status: "$status.status",
              featured: "$status.featured",
              createdAt: 1,
            },
          },
        ],
      },
    },
  ]);

  // Each count facet resolves to either [{ count: N }] or [] (no matches),
  // so unwrap accordingly and default to 0.
  const extractCount = (facetResult) => facetResult?.[0]?.count || 0;

  return {
    totalProjects: extractCount(result.totalProjects),
    publishedProjects: extractCount(result.publishedProjects),
    draftProjects: extractCount(result.draftProjects),
    archivedProjects: extractCount(result.archivedProjects),
    featuredProjects: extractCount(result.featuredProjects),
    recentProjects: result.recentProjects,
  };
};

export { getDashboardStats };