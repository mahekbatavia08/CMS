import JSZip from "jszip";
import { getImageUrl } from "@/lib/utils";

// Sanitize a value so it is safe to use as a zip folder/file name
export const sanitizeFileName = (name, fallback = "untitled") => {
    const cleaned = String(name || "")
        .trim()
        .replace(/[\\/:*?"<>|]/g, "-")
        .replace(/\s+/g, " ")
        .trim();
    return cleaned || fallback;
};

// Ensures no two sibling folders/files share the same name inside a zip
export const getUniqueName = (desiredName, usedNames) => {
    let uniqueName = desiredName;
    let suffix = 2;
    while (usedNames.has(uniqueName.toLowerCase())) {
        uniqueName = `${desiredName} (${suffix++})`;
    }
    usedNames.add(uniqueName.toLowerCase());
    return uniqueName;
};

const getFileNameFromUrl = (url, fallback) => {
    try {
        const clean = String(url).split("?")[0].split("#")[0];
        const parts = clean.split("/");
        const last = parts[parts.length - 1];
        return last || fallback;
    } catch {
        return fallback;
    }
};

const getFileExtension = (fileName, fallbackExt) => {
    const parts = String(fileName || "").split(".");
    return parts.length > 1 ? parts.pop() : fallbackExt;
};

// Builds the projectName/developer/contact/location shape shared by every
// manifest json (all-portfolios, single portfolio, and individual project),
// mirroring the uploaded Project-Data.json format.
export const buildBaseManifest = (entity) => {
    const addressParts = [
        entity?.location?.address,
        entity?.location?.city,
        [entity?.location?.state, entity?.location?.pincode].filter(Boolean).join(" "),
    ].filter((part) => part && String(part).trim());

    return {
        projectName: entity?.general?.projectName || "",
        developer: entity?.general?.builderName || "",
        contact: {
            phone: entity?.contact?.phone || "",
            email: entity?.contact?.email || "",
            social: {
                facebook: entity?.contact?.facebook || "",
                instagram: entity?.contact?.instagram || "",
                website: entity?.contact?.website || "",
            },
        },
        location: {
            text: addressParts.join(", "),
            googleMapLink: entity?.location?.googleMaps || "",
            mapEmbedUrl: entity?.location?.mapEmbedUrl || "",
        },
    };
};

// Fetches a file's binary content and adds it to the given zip folder
const addFileToZip = async (folder, url, desiredName) => {
    if (!folder || !url) return false;
    try {
        const resolvedUrl = getImageUrl(url);
        const response = await fetch(resolvedUrl);
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const blob = await response.blob();
        folder.file(desiredName, blob);
        return true;
    } catch (err) {
        console.error(`Failed to fetch file for ZIP export: ${url}`, err);
        return false;
    }
};

// Writes one portfolio's folder (its child projects' image/legal/floorplan/
// brochure files + project-data.json + portfolio-data.json +
// all-projects-data.json) into `zipRoot`. Shared by both the "export every
// portfolio" flow and the "export this one portfolio" flow so the folder
// layout is always identical.
export const buildPortfolioFolder = async (zipRoot, portfolio, childProjects) => {
    const portfolioFolderName = sanitizeFileName(portfolio.general?.projectName, "Portfolio");
    const portfolioFolder = zipRoot.folder(portfolioFolderName);

    const usedProjectNames = new Set();
    // Keyed p1, p2, ... matching the uploaded Project-Data.json format.
    const portfolioProjectsManifest = {};
    let projectManifestCounter = 1;

    for (const project of childProjects) {
        const projectFolderName = getUniqueName(
            sanitizeFileName(project.general?.projectName, "Project"),
            usedProjectNames
        );
        const projectFolder = portfolioFolder.folder(projectFolderName);

        const imageFolder = projectFolder.folder("image");
        const legalFolder = projectFolder.folder("legal");
        const floorplanFolder = projectFolder.folder("floorplan");
        const brochureFolder = projectFolder.folder("brochure");
        const projectDataFolder = projectFolder.folder("project-data");

        const projectDataManifest = {
            ...buildBaseManifest(project),
            brochures: [],
            legal: [],
            photos: {},
            videos: {},
            floorplans: {},
        };

        // ---- Images (cover + gallery albums) ----
        const imageItems = [];
        if (project.media?.coverImage?.url) {
            imageItems.push({ url: project.media.coverImage.url, name: "cover", album: "cover" });
        }
        (project.media?.gallery || []).forEach((album) => {
            (album.images || []).forEach((img, idx) => {
                if (!img?.url) return;
                const albumLabel = album.albumName ? sanitizeFileName(album.albumName) : "gallery";
                imageItems.push({ url: img.url, name: `${albumLabel}-${idx + 1}`, album: albumLabel });
            });
        });

        const usedImageNames = new Set();
        for (const item of imageItems) {
            const sourceFileName = getFileNameFromUrl(item.url, `${item.name}.jpg`);
            const ext = getFileExtension(sourceFileName, "jpg");
            const finalName = getUniqueName(`${sanitizeFileName(item.name)}.${ext}`, usedImageNames);
            const added = await addFileToZip(imageFolder, item.url, finalName);
            if (added) {
                if (!projectDataManifest.photos[item.album]) projectDataManifest.photos[item.album] = [];
                projectDataManifest.photos[item.album].push(finalName);
            }
        }

        // ---- Legal documents ----
        const usedLegalNames = new Set();
        let legalCounter = 1;
        for (const doc of project.legalDocuments || []) {
            if (!doc?.url) continue;
            const sourceFileName = getFileNameFromUrl(doc.url, `legal-${legalCounter}.pdf`);
            const ext = getFileExtension(sourceFileName, "pdf");
            const baseName = sanitizeFileName(doc.title, `legal-${legalCounter}`);
            const finalName = getUniqueName(`${baseName}.${ext}`, usedLegalNames);
            const added = await addFileToZip(legalFolder, doc.url, finalName);
            if (added) projectDataManifest.legal.push(finalName);
            legalCounter++;
        }

        // ---- Brochures ----
        const usedBrochureNames = new Set();
        let brochureCounter = 1;
        for (const doc of project.brochures || []) {
            if (!doc?.url) continue;
            const sourceFileName = getFileNameFromUrl(doc.url, `brochure-${brochureCounter}.pdf`);
            const ext = getFileExtension(sourceFileName, "pdf");
            const baseName = sanitizeFileName(doc.title, `brochure-${brochureCounter}`);
            const finalName = getUniqueName(`${baseName}.${ext}`, usedBrochureNames);
            const added = await addFileToZip(brochureFolder, doc.url, finalName);
            if (added) projectDataManifest.brochures.push(finalName);
            brochureCounter++;
        }

        // ---- Floor plans ----
        const usedFloorplanNames = new Set();
        let floorplanCounter = 1;
        for (const fp of project.floorPlans || []) {
            if (!fp?.originalPdf) continue;
            const sourceFileName = getFileNameFromUrl(fp.originalPdf, `floorplan-${floorplanCounter}.pdf`);
            const ext = getFileExtension(sourceFileName, "pdf");
            const baseName = sanitizeFileName(fp.title, `floorplan-${floorplanCounter}`);
            const finalName = getUniqueName(`${baseName}.${ext}`, usedFloorplanNames);
            const added = await addFileToZip(floorplanFolder, fp.originalPdf, finalName);
            if (added) {
                const floorplanLabel = fp.title ? sanitizeFileName(fp.title) : `Floorplan ${floorplanCounter}`;
                if (!projectDataManifest.floorplans[floorplanLabel]) projectDataManifest.floorplans[floorplanLabel] = [];
                projectDataManifest.floorplans[floorplanLabel].push(finalName);
            }
            floorplanCounter++;
        }

        // ---- Videos (URLs only, nothing to fetch/store as a file) ----
        (project.videos || []).forEach((video, idx) => {
            if (!video?.url) return;
            const videoLabel = video.title ? String(video.title).trim() : `Video ${idx + 1}`;
            projectDataManifest.videos[videoLabel] = video.url;
        });

        const projectKey = `p${projectManifestCounter}`;
        portfolioProjectsManifest[projectKey] = projectDataManifest;

        // Save project-data.json in { p1: { ... } } structure
        const singleProjectContainer = { [projectKey]: projectDataManifest };
        projectDataFolder.file("Project-Data.json", JSON.stringify(singleProjectContainer, null, 2));
        projectDataFolder.file("project-data.json", JSON.stringify(singleProjectContainer, null, 2));

        projectManifestCounter++;
    }

    // ---- Single portfolio manifest + all-projects-in-portfolio manifest ----
    const portfolioManifest = buildBaseManifest(portfolio);
    const portfolioDataFolder = portfolioFolder.folder("portfolio-data");
    portfolioDataFolder.file("portfolio-data.json", JSON.stringify(portfolioManifest, null, 2));
    portfolioDataFolder.file("Project-Data.json", JSON.stringify(portfolioProjectsManifest, null, 2));
    portfolioDataFolder.file("all-projects-data.json", JSON.stringify(portfolioProjectsManifest, null, 2));

    return { portfolioFolderName, portfolioManifest, portfolioProjectsManifest };
};

const triggerZipDownload = async (zip, fileNamePrefix) => {
    const content = await zip.generateAsync({ type: "blob" });
    const dateStr = new Date().toISOString().slice(0, 10);
    const downloadUrl = URL.createObjectURL(content);
    const link = document.createElement("a");
    link.href = downloadUrl;
    link.download = `${fileNamePrefix}_${dateStr}.zip`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
};

// Exports every portfolio + their projects into one zip
// (all-portfolios-data.json at the root, matching the uploaded format).
export const exportAllPortfoliosZip = async (portfolios, allProjects) => {
    const zip = new JSZip();
    const allPortfoliosManifest = {};

    for (const portfolio of portfolios) {
        const childProjects = (allProjects || []).filter(
            (p) =>
                String(p.parentProject) === String(portfolio._id) ||
                String(p.parentProject?._id) === String(portfolio._id)
        );

        const { portfolioFolderName, portfolioManifest, portfolioProjectsManifest } =
            await buildPortfolioFolder(zip, portfolio, childProjects);

        allPortfoliosManifest[portfolioFolderName] = {
            ...portfolioManifest,
            projects: portfolioProjectsManifest,
        };
    }

    zip.file("all-portfolios-data.json", JSON.stringify(allPortfoliosManifest, null, 2));
    await triggerZipDownload(zip, "Master_Portfolios");
};

// Exports a single portfolio + its own projects into one zip
// (same image/legal/floorplan/brochure + project-data.json /
// portfolio-data.json layout as the bulk export, just scoped to one portfolio).
export const exportSinglePortfolioZip = async (portfolio, childProjects) => {
    const zip = new JSZip();
    await buildPortfolioFolder(zip, portfolio, childProjects || []);
    const fileNamePrefix = sanitizeFileName(portfolio?.general?.projectName, "Portfolio");
    await triggerZipDownload(zip, fileNamePrefix);
};