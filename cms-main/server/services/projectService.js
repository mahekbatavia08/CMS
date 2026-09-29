import {
  findProjectById,
  createProjectDoc,
  saveProject,
  slugExists,
  findAllProjectTags,
  findDeletedPortfolioIds,
  softDeleteProjects,
  listProjects,
} from "../models/Project.js";
import { isValidObjectId } from "../utils/objectId.js";
import ApiError from "../utils/ApiError.js";
import { syncProjectFilters } from "./filterService.js";
import floorPlanService, { deleteFloorPlanFiles } from "./floorPlanService.js";
import { backupProjects } from "../utils/databaseBackup.js";

/**
 * Throws a 400 ApiError if the given id is not a well-formed ObjectId,
 * so malformed ids fail cleanly instead of crashing with an uncaught
 * database error.
 */
const assertValidObjectId = (id, label = "id") => {
  if (!isValidObjectId(String(id))) {
    throw new ApiError(400, `Invalid ${label}`);
  }
};

/**
 * Creates a new project after confirming the slug is not already in use.
 *
 * @param {object} projectData - Validated request body
 * @returns {Promise<object>} The created project document
 */

const buildProjectFilter = ({
  search,
  status,
  featured,
  projectCategory,
  parentProject,
  includeSubProjects,
} = {}) => {
  // Soft-deleted projects are always excluded inside the list_projects RPC.
  return {
    search: search ? String(search) : null,
    status: status || null,
    featured:
      featured !== undefined ? featured === true || featured === "true" : null,
    projectCategory: projectCategory || null,
    parentProject: parentProject || null,
    includeSubProjects:
      includeSubProjects === "true" || includeSubProjects === true,
    excludeParentIds: null,
  };
};

const normalizeProjectPayload = (data = {}) => {
  const normalized = { ...data };

  // Normalize status if primitive string or malformed object
  if (typeof normalized.status === "string" || !normalized.status) {
    const rawStr = String(normalized.status || "").trim().toLowerCase();
    const isPub = rawStr === "active" || rawStr === "published";
    const statusVal = isPub ? "Published" : rawStr === "archived" ? "Archived" : "Draft";
    normalized.status = {
      status: statusVal,
      published: isPub,
      featured: false,
      isDeleted: false,
    };
  } else if (typeof normalized.status === "object" && normalized.status !== null) {
    const sStr = String(normalized.status.status || "").trim().toLowerCase();
    if (sStr === "active" || sStr === "published") {
      normalized.status.status = "Published";
      normalized.status.published = true;
    } else if (sStr === "archived") {
      normalized.status.status = "Archived";
      normalized.status.published = false;
    } else if (sStr === "draft") {
      normalized.status.status = "Draft";
      normalized.status.published = false;
    }
  }

  // Normalize general if missing or if flat fields were supplied at root
  if (!normalized.general || typeof normalized.general !== "object") {
    normalized.general = {};
  }
  if (!normalized.general.projectName && normalized.projectName) {
    normalized.general.projectName = String(normalized.projectName).trim();
  }
  if (!normalized.general.builderName && normalized.builderName) {
    normalized.general.builderName = String(normalized.builderName).trim();
  }
  if (!normalized.general.slug && (normalized.slug || normalized.general.projectName)) {
    const rawSlug = normalized.slug || normalized.general.projectName;
    normalized.general.slug = String(rawSlug)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
  }
  if (!normalized.general.description && normalized.description) {
    normalized.general.description = String(normalized.description).trim();
  }

  // Ensure required subfields in general have valid non-empty values
  if (!normalized.general.projectName || !String(normalized.general.projectName).trim()) {
    normalized.general.projectName = "Untitled Project";
  }
  if (!normalized.general.builderName || !String(normalized.general.builderName).trim()) {
    normalized.general.builderName = normalized.general.projectName || "Developer";
  }
  if (!normalized.general.slug || !String(normalized.general.slug).trim()) {
    const generatedSlug = String(normalized.general.projectName)
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "");
    normalized.general.slug = generatedSlug || `project-${Date.now()}`;
  }

  return normalized;
};

const ensureUniqueSlug = async (baseSlug, excludeId = null) => {
  let cleanSlug = String(baseSlug || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  if (!cleanSlug) {
    cleanSlug = `project-${Date.now()}`;
  }

  let slug = cleanSlug;
  let counter = 1;

  while (true) {
    const existing = await slugExists(slug, excludeId);
    if (!existing) {
      return slug;
    }
    slug = `${cleanSlug}-${counter}`;
    counter++;
  }
};

const createProject = async (rawProjectData) => {
  const projectData = normalizeProjectPayload(rawProjectData);
  const slug = projectData.general.slug;

  // Automatically ensure slug is unique by appending suffix if duplicate exists
  projectData.general.slug = await ensureUniqueSlug(slug);

  // Sanitize Portfolio Tours
  if (projectData.projectCategory === "portfolio") {
    if (projectData.contact) {
      delete projectData.contact.email;
      delete projectData.contact.whatsapp;
      delete projectData.contact.linkedin;
    }
    if (projectData.location) {
      delete projectData.location.city;
      delete projectData.location.state;
      delete projectData.location.pincode;
    }
    projectData.specifications = [];
    projectData.filters = {};
    projectData.rera = {};
    projectData.videos = [];
    projectData.brochures = [];
    projectData.legalDocuments = [];
    projectData.floorPlans = [];
    projectData.seo = {};
    if (projectData.media) {
      projectData.media.gallery = [];
    }
  }

  // Normalize parentProject
  if (
    projectData.projectCategory === "portfolio" ||
    !projectData.parentProject
  ) {
    projectData.parentProject = null;
  }

  // Generate Project Tag safely if not provided
  if (!projectData.projectTag || !String(projectData.projectTag).trim()) {
    const existingProjects = await findAllProjectTags();
    let maxNum = 0;
    for (const p of existingProjects) {
      if (p.projectTag) {
        const match = p.projectTag.match(/(\d+)/);
        if (match) {
          const num = parseInt(match[1], 10);
          if (!isNaN(num) && num > maxNum) {
            maxNum = num;
          }
        }
      }
    }
    const nextNumber = maxNum + 1;
    projectData.projectTag = `P${String(nextNumber).padStart(4, "0")}`;
  }

  const project = await createProjectDoc(projectData);

  // Sync autocomplete values
  await syncProjectFilters(project);

  // Backup database locally
  await backupProjects();

  return project;
};

/**
 * Fetches a paginated, searchable, filterable, sortable list of projects.
 * Soft-deleted projects (status.isDeleted = true) are always excluded.
 *
 * @param {object} queryParams - Raw query params from the request
 * @returns {Promise<{ items: object[], totalItems: number, totalPages: number, currentPage: number }>}
 */
/**
 * Builds the filter params used across project listing APIs (list_projects RPC).
 */

/**
 * Normalizes the sort key.
 */
const buildProjectSort = (sort = "newest") => {
  // Sorting is applied inside the list_projects RPC.
  return ["oldest", "name-asc", "name-desc"].includes(sort) ? sort : "newest";
};

const buildProjectOverview = (project) => {
  const galleryAlbums = project.media?.gallery?.length ?? 0;

  const galleryImages =
    project.media?.gallery?.reduce(
      (total, album) => total + (album.images?.length ?? 0),
      0,
    ) ?? 0;

  const videoCount = project.videos?.length ?? 0;

  const brochureCount = project.brochures?.length ?? 0;

  const floorPlanCount = project.floorPlans?.length ?? 0;

  const legalDocumentCount = project.legalDocuments?.length ?? 0;

  const hasCover = !!project.media?.coverImage?.url;

  const hasSEO = !!project.seo?.metaTitle;

  const hasContact = !!project.contact?.email;

  const hasLocation = !!project.location?.city;

  const stats = {
    cover: hasCover,

    gallery: {
      albums: galleryAlbums,
      images: galleryImages,
    },

    videos: videoCount,

    brochures: brochureCount,

    floorPlans: floorPlanCount,

    legalDocuments: legalDocumentCount,

    seo: hasSEO,

    contact: hasContact,

    location: hasLocation,
  };

  stats.completion = calculateCompletion(stats);

  stats.missing = buildMissingItems(stats);

  return {
    _id: project._id,

    projectTag: project.projectTag,

    projectName: project.general.projectName,

    builderName: project.general.builderName,

    category: project.projectCategory,

    parentProject: project.parentProject,

    city: project.location?.city || "",

    status: project.status.status,

    featured: project.status.featured,

    updatedAt: project.updatedAt,

    stats,
  };
};

const calculateCompletion = (stats) => {
  const checks = [
    stats.cover,
    stats.gallery.images > 0,
    stats.videos > 0,
    stats.brochures > 0,
    stats.floorPlans > 0,
    stats.legalDocuments > 0,
    stats.seo,
    stats.contact,
    stats.location,
  ];

  const completed = checks.filter(Boolean).length;

  return Math.round((completed / checks.length) * 100);
};

const buildMissingItems = (stats) => {
  const missing = [];

  if (!stats.cover) missing.push("Cover Image");

  if (stats.gallery.images === 0) missing.push("Gallery");

  if (stats.videos === 0) missing.push("Videos");

  if (stats.brochures === 0) missing.push("Brochures");

  if (stats.floorPlans === 0) missing.push("Floor Plans");

  if (stats.legalDocuments === 0) missing.push("Legal Documents");

  if (!stats.seo) missing.push("SEO");

  if (!stats.contact) missing.push("Contact");

  if (!stats.location) missing.push("Location");

  return missing;
};

/**
 * Fetches a paginated, searchable, filterable, sortable list of projects.
 */
const getProjects = async (queryParams) => {
  const {
    page = 1,
    limit = 10,
    search,
    status,
    featured,
    projectCategory,
    parentProject,
    includeSubProjects,
    sort,
  } = queryParams;

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 10, 1);

  const filter = buildProjectFilter({
    search,
    status,
    featured,
    projectCategory,
    parentProject,
    includeSubProjects,
  });

  const sortOption = buildProjectSort(sort);

  const { items, totalItems } = await listProjects({
    ...filter,
    sort: sortOption,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const totalPages = Math.ceil(totalItems / pageSize) || 0;

  return {
    items,
    totalItems,
    totalPages,
    currentPage,
  };
};

/**
 * Returns dashboard-friendly project overview data.
 */
const getProjectOverview = async (queryParams) => {
  const {
    page = 1,
    limit = 25,
    search,
    status,
    featured,
    projectCategory,
    sort,
  } = queryParams;

  const currentPage = Math.max(parseInt(page, 10) || 1, 1);
  const pageSize = Math.max(parseInt(limit, 10) || 25, 1);

  const deletedPortfolioIds = await findDeletedPortfolioIds();

  if (deletedPortfolioIds.length > 0) {
    await softDeleteProjects({ parentIds: deletedPortfolioIds });
  }

  const filter = buildProjectFilter({
    search,
    status,
    featured,
    projectCategory: projectCategory || "individual",
    includeSubProjects: true,
  });

  if (deletedPortfolioIds.length > 0) {
    filter.excludeParentIds = deletedPortfolioIds;
  }

  const sortOption = buildProjectSort(sort);

  const { items: projects, totalItems } = await listProjects({
    ...filter,
    sort: sortOption,
    limit: pageSize,
    offset: (currentPage - 1) * pageSize,
  });

  const totalPages = Math.ceil(totalItems / pageSize) || 0;

  const items = projects.map(buildProjectOverview);

  return {
    items,
    totalItems,
    totalPages,
    currentPage,
  };
};

/**
 * Fetches a single project by id.
 *
 * @param {string} id - Project ObjectId
 * @returns {Promise<object>} The project document
 */
const getProjectById = async (id) => {
  assertValidObjectId(id, "project id");

  const project = await findProjectById(id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  return project;
};

/**
 * Partially updates a project, confirming the project exists and, if a new
 * slug is provided, that it does not collide with a different project's slug.
 *
 * @param {string} id - Project ObjectId
 * @param {object} updateData - Validated partial update payload
 * @returns {Promise<object>} The updated project document
 */
const updateProject = async (id, rawUpdateData) => {
  assertValidObjectId(id, "project id");

  const updateData = { ...rawUpdateData };

  // Normalize status if primitive string is passed
  if (typeof updateData.status === "string") {
    const rawStr = updateData.status.trim().toLowerCase();
    const isPub = rawStr === "active" || rawStr === "published";
    const statusVal = isPub ? "Published" : rawStr === "archived" ? "Archived" : "Draft";
    updateData.status = {
      status: statusVal,
      published: isPub,
      isDeleted: false,
    };
  } else if (updateData.status && typeof updateData.status === "object") {
    const sStr = String(updateData.status.status || "").trim().toLowerCase();
    if (sStr === "active" || sStr === "published") {
      updateData.status.status = "Published";
      updateData.status.published = true;
    }
    updateData.status.isDeleted = false;
  }

  // Normalize parentProject
  if (
    updateData.projectCategory === "portfolio" ||
    updateData.parentProject === ""
  ) {
    updateData.parentProject = null;
  }

  let project = await findProjectById(id);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  const newSlug = updateData?.general?.slug;

  if (newSlug) {
    updateData.general.slug = await ensureUniqueSlug(newSlug, id);
  }

  // Strip system/immutable fields
  delete updateData._id;
  delete updateData.__v;
  delete updateData.createdAt;
  delete updateData.updatedAt;
  delete updateData.projectTag;

  // Merge each provided top-level section into the existing document
  Object.keys(updateData).forEach((key) => {
    if (key === "_id" || key === "__v" || key === "createdAt" || key === "updatedAt" || key === "projectTag") {
      return;
    }
    const value = updateData[key];

    if (value && typeof value === "object" && !Array.isArray(value)) {
      const existingValue = project[key]
        ? JSON.parse(JSON.stringify(project[key]))
        : {};
      project[key] = { ...existingValue, ...value };
    } else {
      project[key] = value;
    }
  });

  // Sanitize Portfolio Tours before saving
  if (project.projectCategory === "portfolio") {
    if (project.contact) {
      project.contact.email = undefined;
      project.contact.whatsapp = undefined;
      project.contact.linkedin = undefined;
    }
    if (project.location) {
      project.location.city = undefined;
      project.location.state = undefined;
      project.location.pincode = undefined;
    }
    project.specifications = [];
    project.filters = {};
    project.rera = {};
    project.videos = [];
    project.brochures = [];
    project.legalDocuments = [];
    project.floorPlans = [];
    project.seo = {};
    if (project.media) {
      project.media.gallery = [];
    }
  }

  // Ensure updated project is active
  if (project.status) {
    project.status.isDeleted = false;
  }

  project = await saveProject(project);

  // Sync autocomplete values
  await syncProjectFilters(project);

  // Backup database locally
  await backupProjects();

  return project;
};

/**
 * Soft-deletes a project by setting status.isDeleted to true.
 * The document is never actually removed from the database.
 *
 * @param {string} id - Project ObjectId
 * @returns {Promise<object>} The soft-deleted project document
 */
const deleteProject = async (id) => {
  // Coerce id in case it's a stringified ObjectId object ({ $oid: "..." })
  const resolvedId = id && typeof id === "object" && id.$oid ? id.$oid : id;

  assertValidObjectId(resolvedId, "project id");

  const project = await findProjectById(resolvedId);

  if (!project) {
    throw new ApiError(404, "Project not found");
  }

  // Already soft-deleted — treat as success
  if (project.status?.isDeleted === true) {
    return project;
  }

  await softDeleteProjects({ ids: [String(resolvedId)] });

  // If soft-deleting a portfolio, also soft-delete its child sub-projects
  if (project.projectCategory === "portfolio") {
    await softDeleteProjects({ parentIds: [String(resolvedId)] });
  }

  // Backup database locally
  await backupProjects();

  return project;
};

export const uploadProjectFloorPlan = async (projectId, title, floorPlanFile) => {
  assertValidObjectId(projectId, "project id");

  if (!floorPlanFile) {
    throw new ApiError(400, "Floor plan file is required.");
  }

  let project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  // Process uploaded file (move, convert if PDF, etc.)
  const processedFloorPlan = await floorPlanService.processFloorPlan(
    String(project._id),
    floorPlanFile.path,
    floorPlanFile.mimetype,
    floorPlanFile.originalname
  );

  project.floorPlans.push({
    title: title?.trim() || "Untitled Floor Plan",

    // Public Supabase Storage URLs
    originalPdf: processedFloorPlan.originalPdf,

    thumbnail: processedFloorPlan.thumbnail,

    pageCount: processedFloorPlan.pageCount,

    pages: (processedFloorPlan.pages || []).map((page) => ({
      pageNumber: page.pageNumber || 1,
      dziPath: page.dziPath || "",
      url: page.url || "",
    })),

    displayOrder: project.floorPlans.length,
  });

  project = await saveProject(project);

  return project;
};

export const deleteProjectFloorPlan = async (projectId, floorPlanId) => {
  assertValidObjectId(projectId, "project id");

  let project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  const floorPlan = project.floorPlans.find(
    (item) => String(item._id) === String(floorPlanId),
  );

  if (!floorPlan) {
    throw new ApiError(404, "Floor plan not found.");
  }

  // Delete all files from storage
  await deleteFloorPlanFiles(floorPlan.originalPdf);

  // Remove from the project document
  project.floorPlans = project.floorPlans.filter((item) => item !== floorPlan);

  // Recalculate display order
  project.floorPlans.forEach((item, index) => {
    item.displayOrder = index;
  });

  project = await saveProject(project);

  return project;
};

export const replaceProjectFloorPlan = async (
  projectId,
  floorPlanId,
  title,
  floorPlanFile,
) => {
  assertValidObjectId(projectId, "project id");

  let project = await findProjectById(projectId);

  if (!project) {
    throw new ApiError(404, "Project not found.");
  }

  const floorPlan = project.floorPlans.find(
    (item) => String(item._id) === String(floorPlanId),
  );

  if (!floorPlan) {
    throw new ApiError(404, "Floor plan not found.");
  }

  // If no new file is uploaded, update only the title.
  if (!floorPlanFile) {
    if (typeof title === "string" && title.trim()) {
      floorPlan.title = title.trim();
    }

    project = await saveProject(project);

    return project;
  }
  // Replace the existing floor plan with the new file.
  const newFloorPlan = await floorPlanService.replaceFloorPlan(
    String(project._id),
    floorPlanFile.path,
    floorPlan.originalPdf,
    floorPlanFile.mimetype,
    floorPlanFile.originalname
  );

  // Update metadata.
  floorPlan.title = title?.trim() || floorPlan.title;
  floorPlan.originalPdf = newFloorPlan.originalPdf;
  floorPlan.thumbnail = newFloorPlan.thumbnail;
  floorPlan.pageCount = newFloorPlan.pageCount;
  floorPlan.pages = (newFloorPlan.pages || []).map((page) => ({
    pageNumber: page.pageNumber || 1,
    dziPath: page.dziPath || "",
    url: page.url || "",
  }));

  project = await saveProject(project);

  return project;
};

export {
  buildProjectFilter,
  createProject,
  getProjects,
  getProjectOverview,
  getProjectById,
  updateProject,
  deleteProject,
};