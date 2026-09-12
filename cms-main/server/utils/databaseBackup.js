import fs from "fs/promises";
import path from "path";
import Project from "../models/Project.js";

const BACKUP_DIR = path.join(process.cwd(), "Local-Backup");
const BACKUP_FILE = path.join(BACKUP_DIR, "projects.json");
const INDIVIDUAL_DIR = path.join(BACKUP_DIR, "individual");
const PORTFOLIO_DIR = path.join(BACKUP_DIR, "portfolio");

/**
 * Helper to extract a single URL string from various item formats (string, object with url/dziPath/path/src/link/file).
 */
const extractUrl = (item) => {
  if (!item) return "";
  if (typeof item === "string") return item.trim();
  if (typeof item === "object") {
    return (
      item.url ||
      item.dziPath ||
      item.path ||
      item.src ||
      item.link ||
      item.videoUrl ||
      item.file ||
      item.originalPdf ||
      item.thumbnail ||
      ""
    ).trim();
  }
  return "";
};

/**
 * Transforms a Project model document into the strict custom JSON format:
 * {
 *   projectName: "",
 *   developer: "",
 *   contact: { phone, email, social: { facebook, instagram, website } },
 *   location: { text, googleMapLink, mapEmbedUrl },
 *   brochures: [...],
 *   legal: [...],
 *   photos: { [album]: [...] },
 *   videos: { [title]: url },
 *   floorplans: { [album]: [...] }
 * }
 */
export const formatProjectToCustomJson = (project) => {
  // Photos object with album-name keys
  const photosObj = {};

  if (
    project.media?.gallery &&
    Array.isArray(project.media.gallery) &&
    project.media.gallery.length > 0
  ) {
    project.media.gallery.forEach((album, idx) => {
      const albumName = album.albumName || `album-name-${idx + 1}`;
      const imgs = (album.images || [])
        .map(extractUrl)
        .filter(Boolean);
      photosObj[albumName] = imgs;
    });
  } else if (project.photos && typeof project.photos === "object" && !Array.isArray(project.photos)) {
    // If photos is already an object with album keys
    Object.keys(project.photos).forEach((albumName) => {
      const val = project.photos[albumName];
      if (Array.isArray(val)) {
        photosObj[albumName] = val.map(extractUrl).filter(Boolean);
      }
    });
  } else if (Array.isArray(project.photos) && project.photos.length > 0) {
    photosObj["album-name-1"] = project.photos.map(extractUrl).filter(Boolean);
  } else if (Array.isArray(project.media?.photos) && project.media.photos.length > 0) {
    photosObj["album-name-1"] = project.media.photos.map(extractUrl).filter(Boolean);
  }

  // Floorplans object with album/title keys
  const floorplansObj = {};
  const rawFloorPlans = project.floorPlans || project.floorplans;

  if (rawFloorPlans && Array.isArray(rawFloorPlans) && rawFloorPlans.length > 0) {
    rawFloorPlans.forEach((fp, idx) => {
      const albumName =
        fp.title ||
        fp.albumName ||
        (rawFloorPlans.length === 1 ? "Floorplan" : `Floorplan ${idx + 1}`);
      let pages = [];
      if (Array.isArray(fp.pages) && fp.pages.length > 0) {
        pages = fp.pages.map(extractUrl).filter(Boolean);
      } else if (fp.originalPdf || fp.dziPath || fp.url || fp.thumbnail) {
        const singleUrl = extractUrl(fp.originalPdf || fp);
        if (singleUrl) pages = [singleUrl];
      }
      floorplansObj[albumName] = pages;
    });
  } else if (rawFloorPlans && typeof rawFloorPlans === "object" && !Array.isArray(rawFloorPlans)) {
    Object.keys(rawFloorPlans).forEach((albumName) => {
      const val = rawFloorPlans[albumName];
      if (Array.isArray(val)) {
        floorplansObj[albumName] = val.map(extractUrl).filter(Boolean);
      }
    });
  }

  // Videos object with title -> direct URL
  const videosObj = {};
  const rawVideos = project.videos || project.media?.videos || [];
  if (Array.isArray(rawVideos)) {
    rawVideos.forEach((v, idx) => {
      const url = extractUrl(v);
      if (url) {
        const title =
          (v && typeof v === "object" && v.title && v.title.trim()) ||
          `Video ${idx + 1}`;
        videosObj[title] = url;
      }
    });
  } else if (rawVideos && typeof rawVideos === "object") {
    Object.entries(rawVideos).forEach(([k, v]) => {
      const url = extractUrl(v);
      if (url) videosObj[k] = url;
    });
  }

  // Brochures list with direct URLs
  const rawBrochures = project.brochures || project.media?.brochures || [];
  const brochuresList = Array.isArray(rawBrochures)
    ? rawBrochures.map(extractUrl).filter(Boolean)
    : [];

  // Legal documents list with direct URLs
  const rawLegal = project.legalDocuments || project.legal || project.media?.legalDocuments || [];
  const legalList = Array.isArray(rawLegal)
    ? rawLegal.map(extractUrl).filter(Boolean)
    : [];

  // Location address / text
  const locationText =
    project.location?.address ||
    [
      project.location?.address,
      project.location?.city,
      project.location?.state,
      project.location?.pincode,
    ]
      .filter(Boolean)
      .join(", ") ||
    "";

  return {
    projectName: project.general?.projectName || "",
    developer: project.general?.builderName || "",
    contact: {
      phone: project.contact?.phone || "",
      email: project.contact?.email || "",
      social: {
        facebook: project.contact?.facebook || "",
        instagram: project.contact?.instagram || "",
        website: project.contact?.website || "",
      },
    },
    location: {
      text: locationText,
      googleMapLink: project.location?.googleMaps || "",
      mapEmbedUrl: project.location?.mapEmbedUrl || "",
    },
    brochures: brochuresList,
    legal: legalList,
    photos: photosObj,
    videos: videosObj,
    floorplans: floorplansObj,
  };
};

/**
 * Formats an array of projects into a map object strictly keyed by "p1", "p2", "p3", etc.
 */
export const formatProjectsCollection = (projectsList) => {
  const formattedMap = {};
  projectsList.forEach((p, idx) => {
    const key = `p${idx + 1}`;
    formattedMap[key] = formatProjectToCustomJson(p);
  });
  return formattedMap;
};

/**
 * Backs up all non-deleted projects to:
 * 1) Local-Backup/projects.json (full raw backup)
 * 2) Local-Backup/individual/Project-Data.json (formatted individual projects)
 * 3) Local-Backup/portfolio/Project-Data.json (formatted portfolio projects)
 */
export const backupProjects = async () => {
  try {
    await fs.mkdir(BACKUP_DIR, { recursive: true });
    await fs.mkdir(INDIVIDUAL_DIR, { recursive: true });
    await fs.mkdir(PORTFOLIO_DIR, { recursive: true });

    const projects = await Project.find({ "status.isDeleted": { $ne: true } }).lean();

    // 1. Full raw backup to preserve existing functionality
    await fs.writeFile(BACKUP_FILE, JSON.stringify(projects, null, 2));

    // 2. Separate into individual and portfolio
    const individualProjects = projects.filter(
      (p) => p.projectCategory === "individual" || !p.projectCategory
    );
    const portfolioProjects = projects.filter(
      (p) => p.projectCategory === "portfolio"
    );

    // 3. Format as specific custom JSON structure
    const individualFormatted = formatProjectsCollection(individualProjects);
    const portfolioFormatted = formatProjectsCollection(portfolioProjects);

    // 4. Save into 2 different folders
    const individualFile = path.join(INDIVIDUAL_DIR, "Project-Data.json");
    const portfolioFile = path.join(PORTFOLIO_DIR, "Project-Data.json");

    await fs.writeFile(individualFile, JSON.stringify(individualFormatted, null, 2));
    await fs.writeFile(portfolioFile, JSON.stringify(portfolioFormatted, null, 2));

    console.log(
      `Successfully backed up ${projects.length} projects:\n` +
      `  - Full backup: ${BACKUP_FILE}\n` +
      `  - Individual (${individualProjects.length}): ${individualFile}\n` +
      `  - Portfolio (${portfolioProjects.length}): ${portfolioFile}`
    );
  } catch (error) {
    console.error("Error creating local project backup:", error);
  }
};