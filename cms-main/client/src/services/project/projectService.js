import api from "@/api/axios";
import imageCompression from "browser-image-compression";

const projectService = {
  /**
   * Get all projects
   */
  getProjects: async (params = {}) => {
    const { data } = await api.get("/projects", {
      params,
    });

    return data;
  },

  /**
   * Get all Portfolio Tours (Master Projects)
   */
  getPortfolioTours: async () => {
    const { data } = await api.get("/projects", {
      params: {
        projectCategory: "portfolio",
        limit: 1000,
      },
    });

    return data;
  },

  /**
   * Get single project
   */
  getProject: async (id) => {
    const { data } = await api.get(`/projects/${id}`);

    return data;
  },

  /**
   * Create project
   */
  createProject: async (projectData) => {
    const { data } = await api.post("/projects", projectData);

    return data;
  },

  /**
   * Upload project cover image
   */
  uploadCoverImage: async (projectId, file, alt = "") => {
    if (!file) return null;
    const actualFile = file instanceof File ? file : (file?.file instanceof File ? file.file : null);
    if (!actualFile) return null;

    let compressedFile = actualFile;
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      compressedFile = await imageCompression(actualFile, options);
    } catch (err) {
      console.warn("Cover compression skipped:", err);
    }
    
    const formData = new FormData();
    formData.append("file", compressedFile, actualFile.name || "cover.jpg");
    formData.append("alt", alt);

    const { data } = await api.post(
      `/projects/${projectId}/media/cover`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },

  /**
   * Upload project thumbnail image
   */
  uploadThumbnailImage: async (projectId, file, alt = "") => {
    if (!file) return null;
    const actualFile = file instanceof File ? file : (file?.file instanceof File ? file.file : null);
    if (!actualFile) return null;

    let compressedFile = actualFile;
    try {
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };
      compressedFile = await imageCompression(actualFile, options);
    } catch (err) {
      console.warn("Thumbnail compression skipped:", err);
    }
    
    const formData = new FormData();
    formData.append("file", compressedFile, actualFile.name || "thumbnail.jpg");
    formData.append("alt", alt);

    const { data } = await api.post(
      `/projects/${projectId}/media/thumbnail`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },

  /**
   * Upload gallery image
   */
  uploadGalleryImage: async (
    projectId,
    file,
    { albumName = "", caption = "", alt = "", displayOrder = 0 } = {},
  ) => {
    const options = {
      maxSizeMB: 1,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
    };
    const compressedFile = await imageCompression(file, options);
    
    const formData = new FormData();

    formData.append("file", compressedFile, file.name || "gallery.jpg");
    formData.append("albumName", albumName);
    formData.append("caption", caption);
    formData.append("alt", alt);
    formData.append("displayOrder", displayOrder);

    const { data } = await api.post(
      `/projects/${projectId}/media/gallery`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },

  /**
   * Update project
   */
  updateProject: async (id, projectData) => {
    const { data } = await api.patch(`/projects/${id}`, projectData);

    return data;
  },

  /**
   * Delete project (Soft Delete)
   */
  deleteProject: async (id) => {
    // Handle MongoDB Extended JSON { $oid: "..." } wrapper that may come from imported data
    const resolvedId = id && typeof id === "object" && id.$oid ? id.$oid : String(id);
    const { data } = await api.delete(`/projects/${resolvedId}`);

    return data;
  },

  /**
   * Upload project brochure
   */
  uploadBrochure: async (projectId, file, title = "") => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("title", title);

    const { data } = await api.post(
      `/projects/${projectId}/media/brochure`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },

  /**
   * Upload legal document
   */
  uploadLegalDocument: async (projectId, file, title = "") => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("title", title);

    const { data } = await api.post(
      `/projects/${projectId}/media/legal`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },
  /**
   * Upload RERA certificate
   */
  uploadReraCertificate: async (projectId, file) => {
    const formData = new FormData();

    formData.append("file", file);

    const { data } = await api.post(
      `/projects/${projectId}/media/rera`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },

  /**
   * Upload floor plan
   */
  uploadFloorPlan: async (projectId, file, title = "") => {
    const formData = new FormData();

    formData.append("file", file);
    formData.append("title", title);

    const { data } = await api.post(
      `/projects/${projectId}/floorplans`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      },
    );

    return data;
  },
};

export default projectService;
