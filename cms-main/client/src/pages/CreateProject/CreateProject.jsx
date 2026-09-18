import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import useProjectForm from "@/hooks/useProjectForm";
import projectService from "@/services/project/projectService";

import { ROUTES } from "@/constants/routes";

import ProjectSelector from "@/components/project/ProjectSelector";
import PortfolioTourForm from "@/components/project/PortfolioTourForm";
import IndividualProjectForm from "@/components/project/IndividualProjectForm";

const CreateProject = () => {
  const methods = useProjectForm();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const location = useLocation();

  const queryType = searchParams.get("type") || location.state?.type;
  const portfolioId = searchParams.get("portfolioId") || location.state?.portfolioId;

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNextSubmitting, setIsNextSubmitting] = useState(false);
  // Set once an Individual Project draft has been autosaved, so the final
  // "Create Project" submit updates that draft instead of duplicating it.
  const [individualProjectId, setIndividualProjectId] = useState(null);
  const [selectedType, setSelectedType] = useState(
    queryType === "portfolio" || queryType === "master"
      ? "portfolio"
      : queryType === "individual"
        ? "individual"
        : null
  );

  useEffect(() => {
    if (queryType === "portfolio" || queryType === "master") {
      methods.setValue("projectCategory", "portfolio");
      setSelectedType("portfolio");
    } else if (queryType === "individual" || portfolioId) {
      methods.setValue("projectCategory", "individual");
      if (portfolioId) {
        methods.setValue("addToPortfolio", true);
        methods.setValue("parentProject", portfolioId);
      }
      setSelectedType("individual");
    }
  }, [queryType, portfolioId, methods]);

  const handleSave = async (data, { navigateToMapSkin = false } = {}) => {
    if (navigateToMapSkin) {
      setIsNextSubmitting(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      const coverImage = data.media?.coverImage instanceof File ? data.media.coverImage : (data.media?.coverImage?.file instanceof File ? data.media.coverImage.file : null);
      const thumbnailImage = data.media?.thumbnailImage instanceof File ? data.media.thumbnailImage : (data.media?.thumbnailImage?.file instanceof File ? data.media.thumbnailImage.file : null);
      const galleryAlbums = data.media?.gallery || [];
      const brochures = data.brochures || [];
      const legalDocuments = data.legalDocuments || [];
      const floorPlans = data.floorPlans || [];
      const reraCertificateFile =
        data.rera?.certificate instanceof File ? data.rera.certificate : null;

      // Remove File objects before sending JSON
      if (data.media) {
        data.media.coverImage = null;
        data.media.thumbnailImage = null;
        data.media.gallery = [];
      }

      data.brochures = [];
      data.legalDocuments = [];
      data.floorPlans = [];
      if (data.rera) {
        data.rera.certificate = null;
      }

      // Intercept custom project type
      if (data.general?.projectType === "Custom" && data.general?.customProjectType) {
        data.general.projectType = data.general.customProjectType;
      }
      if (data.general) {
        delete data.general.customProjectType;
      }

      // Intercept custom category
      if (data.filters?.customCategory) {
        data.filters.category = [data.filters.customCategory];
        delete data.filters.customCategory;
      }

      // If an autosaved draft already exists for this individual project,
      // update it instead of creating a duplicate record.
      const response = individualProjectId
        ? await projectService.updateProject(individualProjectId, data)
        : await projectService.createProject(data);
      const project = response.data?.project || (individualProjectId ? { _id: individualProjectId } : undefined);

      // Upload cover image
      if (coverImage) {
        await projectService.uploadCoverImage(project._id, coverImage);
      }

      // Upload thumbnail image
      if (thumbnailImage) {
        await projectService.uploadThumbnailImage(project._id, thumbnailImage);
      }

      // Upload gallery albums and images
      for (const [albumIndex, album] of galleryAlbums.entries()) {
        const safeAlbumName = String(album.albumName || "").trim() || `Album ${albumIndex + 1}`;
        const images = album.images || [];
        const newImages = images.filter((img) => img.file);

        await Promise.all(
          newImages.map((image, index) =>
            projectService.uploadGalleryImage(project._id, image.file, {
              albumName: safeAlbumName,
              caption: image.caption || "",
              alt: image.alt || "",
              displayOrder: index,
            })
          )
        );
      }

      // Upload brochures
      const newBrochures = brochures.filter((doc) => doc.file);
      await Promise.all(
        newBrochures.map((brochure) =>
          projectService.uploadBrochure(project._id, brochure.file, brochure.title)
        )
      );

      // Upload legal documents
      const newLegalDocs = legalDocuments.filter((doc) => doc.file);
      await Promise.all(
        newLegalDocs.map((document) =>
          projectService.uploadLegalDocument(project._id, document.file, document.title)
        )
      );

      // Upload RERA certificate
      if (reraCertificateFile) {
        await projectService.uploadReraCertificate(project._id, reraCertificateFile);
      }

      // Upload floor plans
      const newFloorPlans = floorPlans.filter((doc) => doc.file);
      await Promise.all(
        newFloorPlans.map((floorPlan) =>
          projectService.uploadFloorPlan(project._id, floorPlan.file, floorPlan.title)
        )
      );

      // Invalidate React Query caches so new project appears everywhere
      await queryClient.invalidateQueries();

      if (!navigateToMapSkin) {
        toast.success(response.message || "Project created successfully.");
      }
      const createdId = project?._id || response.data?.project?._id || response.data?._id || individualProjectId;
      methods.reset({}, { keepValues: true });

      const targetPortfolio = portfolioId || data.parentProject;

      if (navigateToMapSkin && createdId) {
        navigate(ROUTES.PROJECT_MAP_SKIN.replace(":id", createdId));
      } else if (data.projectCategory === "portfolio") {
        navigate(ROUTES.PROJECTS_MASTER);
      } else if (targetPortfolio) {
        navigate(ROUTES.PROJECTS_PORTFOLIO_DETAIL.replace(":portfolioId", targetPortfolio));
      } else {
        navigate(ROUTES.PROJECTS_INDIVIDUAL);
      }
    } catch (error) {
      const responseData = error?.response?.data;
      if (responseData?.errors?.length) {
        toast.error(
          responseData.errors
            .map((err) => `${err.field}: ${err.message}`)
            .join("\n")
        );
      } else {
        toast.error(
          responseData?.message || error.message || "Failed to create project."
        );
      }
    } finally {
      setIsSubmitting(false);
      setIsNextSubmitting(false);
    }
  };

  const onSubmit = (data) => handleSave(data, { navigateToMapSkin: false });
  const onNext = (data) => handleSave(data, { navigateToMapSkin: true });

  /**
   * Uploads any newly attached files for a project (used by autosave so
   * uploads aren't lost if the user never reaches the final submit) and
   * returns the resulting project doc if anything was uploaded.
   */
  const uploadPendingProjectFiles = async (projectId, {
    coverImage,
    thumbnailImage,
    galleryAlbums = [],
    brochures = [],
    legalDocuments = [],
    floorPlans = [],
    reraCertificateFile,
  }) => {
    let latestProject = null;

    if (coverImage) {
      const res = await projectService.uploadCoverImage(projectId, coverImage);
      latestProject = res.data?.project || latestProject;
    }
    if (thumbnailImage) {
      const res = await projectService.uploadThumbnailImage(projectId, thumbnailImage);
      latestProject = res.data?.project || latestProject;
    }

    for (const [albumIndex, album] of galleryAlbums.entries()) {
      const safeAlbumName = String(album.albumName || "").trim() || `Album ${albumIndex + 1}`;
      const newImages = (album.images || []).filter((img) => img.file);

      for (const [index, image] of newImages.entries()) {
        const res = await projectService.uploadGalleryImage(projectId, image.file, {
          albumName: safeAlbumName,
          caption: image.caption || "",
          alt: image.alt || "",
          displayOrder: index,
        });
        latestProject = res.data?.project || latestProject;
      }
    }

    for (const brochure of brochures.filter((doc) => doc.file)) {
      const res = await projectService.uploadBrochure(projectId, brochure.file, brochure.title);
      latestProject = res.data?.project || latestProject;
    }

    for (const document of legalDocuments.filter((doc) => doc.file)) {
      const res = await projectService.uploadLegalDocument(projectId, document.file, document.title);
      latestProject = res.data?.project || latestProject;
    }

    if (reraCertificateFile) {
      const res = await projectService.uploadReraCertificate(projectId, reraCertificateFile);
      latestProject = res.data?.project || latestProject;
    }

    for (const floorPlan of floorPlans.filter((doc) => doc.file)) {
      const res = await projectService.uploadFloorPlan(projectId, floorPlan.file, floorPlan.title);
      latestProject = res.data?.project || latestProject;
    }

    return latestProject;
  };

  /**
   * Portfolio Tour Configuration has no explicit "Save" action — the record
   * is created on the first meaningful change and every change after that
   * is auto-saved (debounced) directly to it.
   */
  const [portfolioProjectId, setPortfolioProjectId] = useState(null);
  const autosaveTimerRef = useRef(null);
  const isAutosavingRef = useRef(false);
  const hasPendingAutosaveRef = useRef(false);

  const autosavePortfolio = async (rawData) => {
    const data = { ...rawData };

    try {
      const thumbnailImage =
        data.media?.thumbnailImage instanceof File
          ? data.media.thumbnailImage
          : (data.media?.thumbnailImage?.file instanceof File ? data.media.thumbnailImage.file : null);

      // Defaults previously injected at submit time by the removed "Save Configuration" button
      if (!data.general.builderName) {
        data.general.builderName = data.general.projectName;
      }
      if (!data.general.projectType) {
        data.general.projectType = "Commercial";
      }
      if (!data.status) {
        data.status = {};
      }
      if (!data.status.status) {
        data.status.status = "Published";
        data.status.published = true;
      }

      if (data.general?.projectType === "Custom" && data.general?.customProjectType) {
        data.general.projectType = data.general.customProjectType;
      }
      if (data.general) {
        delete data.general.customProjectType;
      }

      if (data.filters?.customCategory) {
        data.filters.category = [data.filters.customCategory];
        delete data.filters.customCategory;
      }

      // Portfolio Tour Configuration only manages a logo (thumbnail) image;
      // strip fields this form doesn't expose before sending JSON.
      if (data.media) {
        data.media.coverImage = null;
        data.media.thumbnailImage = portfolioProjectId ? (thumbnailImage ? null : data.media.thumbnailImage) : null;
        data.media.gallery = [];
      }
      data.brochures = [];
      data.legalDocuments = [];
      data.floorPlans = [];
      if (data.rera) {
        data.rera.certificate = null;
      }

      delete data.__v;
      delete data._id;
      delete data.createdAt;
      delete data.updatedAt;

      let targetId = portfolioProjectId;

      if (!targetId) {
        const response = await projectService.createProject(data);
        targetId = response.data?.project?._id;
        if (!targetId) return;
        setPortfolioProjectId(targetId);
      } else {
        await projectService.updateProject(targetId, data);
      }

      if (thumbnailImage) {
        await projectService.uploadThumbnailImage(targetId, thumbnailImage);
      }

      await queryClient.invalidateQueries();
      methods.reset({}, { keepValues: true });
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  useEffect(() => {
    if (selectedType !== "portfolio") return undefined;

    const runAutosave = () => {
      if (isAutosavingRef.current) return;

      const data = methods.getValues();
      if (!data.general?.projectName?.trim()) {
        hasPendingAutosaveRef.current = false;
        return;
      }

      hasPendingAutosaveRef.current = false;
      isAutosavingRef.current = true;
      autosavePortfolio(data).finally(() => {
        isAutosavingRef.current = false;
      });
    };

    const subscription = methods.watch((_value, { type }) => {
      // Ignore emits from methods.reset() (no `type`), so the reset a
      // save performs on itself doesn't immediately re-trigger autosave.
      if (!type) return;

      hasPendingAutosaveRef.current = true;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(runAutosave, 1200);
    });

    // Flush any pending debounced autosave immediately instead of losing it,
    // e.g. when the user switches to another browser tab or navigates away
    // before the debounce timer would have fired on its own.
    const flushPendingAutosave = () => {
      if (!hasPendingAutosaveRef.current) return;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }

      runAutosave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingAutosave();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushPendingAutosave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, portfolioProjectId]);

  /**
   * Individual Project creation has an explicit "Create Project" submit,
   * but filled-in fields are also autosaved as a draft (debounced) so
   * navigating away before submitting doesn't lose them. The final submit
   * (see handleSave) updates this same draft instead of creating a
   * duplicate record.
   */
  const autosaveIndividual = async (rawData) => {
    const data = { ...rawData };

    try {
      // Capture any attached files before they're stripped for the JSON
      // save below, so they can be uploaded right after — autosave should
      // persist uploads too, not just text fields, no matter which section
      // of the form the user is on.
      const coverImage = data.media?.coverImage instanceof File ? data.media.coverImage : (data.media?.coverImage?.file instanceof File ? data.media.coverImage.file : null);
      const thumbnailImage = data.media?.thumbnailImage instanceof File ? data.media.thumbnailImage : (data.media?.thumbnailImage?.file instanceof File ? data.media.thumbnailImage.file : null);
      const galleryAlbums = data.media?.gallery || [];
      const brochures = data.brochures || [];
      const legalDocuments = data.legalDocuments || [];
      const floorPlans = data.floorPlans || [];
      const reraCertificateFile = data.rera?.certificate instanceof File ? data.rera.certificate : null;

      if (data.media) {
        data.media = {
          ...data.media,
          coverImage: coverImage ? null : data.media.coverImage,
          thumbnailImage: thumbnailImage ? null : data.media.thumbnailImage,
          gallery: (data.media.gallery || []).map((album, albumIndex) => ({
            ...album,
            albumName: String(album.albumName || "").trim() || `Album ${albumIndex + 1}`,
            images: (album.images || []).filter((img) => !img.file),
          })),
        };
      }
      data.brochures = brochures.filter((doc) => !doc.file && doc.url);
      data.legalDocuments = legalDocuments.filter((doc) => !doc.file && doc.url);
      data.floorPlans = floorPlans.filter((doc) => !doc.file && doc.originalPdf);
      if (data.rera) {
        data.rera = { ...data.rera, certificate: reraCertificateFile ? null : data.rera.certificate };
      }

      if (data.general?.projectType === "Custom" && data.general?.customProjectType) {
        data.general.projectType = data.general.customProjectType;
      }
      if (data.general) {
        delete data.general.customProjectType;
      }

      if (data.filters?.customCategory) {
        data.filters = { ...data.filters, category: [data.filters.customCategory] };
        delete data.filters.customCategory;
      }

      delete data.__v;
      delete data._id;
      delete data.createdAt;
      delete data.updatedAt;

      let targetId = individualProjectId;

      if (!targetId) {
        const response = await projectService.createProject(data);
        targetId = response.data?.project?._id;
        if (!targetId) return;
        setIndividualProjectId(targetId);
      } else {
        await projectService.updateProject(targetId, data);
      }

      const latestProject = await uploadPendingProjectFiles(targetId, {
        coverImage,
        thumbnailImage,
        galleryAlbums,
        brochures,
        legalDocuments,
        floorPlans,
        reraCertificateFile,
      });

      await queryClient.invalidateQueries();

      // If anything was uploaded, resync the form with the server's copy
      // (now holding URLs instead of File objects) so the next autosave
      // tick doesn't re-upload the same files again.
      if (latestProject) {
        methods.reset(latestProject);
      } else {
        methods.reset({}, { keepValues: true });
      }
    } catch (error) {
      console.error("Autosave failed:", error);
    }
  };

  useEffect(() => {
    if (selectedType !== "individual") return undefined;

    const runAutosave = () => {
      if (isAutosavingRef.current) return;

      const data = methods.getValues();
      if (!data.general?.projectName?.trim()) {
        hasPendingAutosaveRef.current = false;
        return;
      }

      hasPendingAutosaveRef.current = false;
      isAutosavingRef.current = true;
      autosaveIndividual(data).finally(() => {
        isAutosavingRef.current = false;
      });
    };

    const subscription = methods.watch((_value, { type }) => {
      // Ignore emits from methods.reset() (no `type`), so the reset a
      // save performs on itself doesn't immediately re-trigger autosave.
      if (!type) return;

      hasPendingAutosaveRef.current = true;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
      }

      autosaveTimerRef.current = setTimeout(runAutosave, 1200);
    });

    // Flush any pending debounced autosave immediately instead of losing it,
    // e.g. when the user switches to another browser tab or navigates away
    // before the debounce timer would have fired on its own.
    const flushPendingAutosave = () => {
      if (!hasPendingAutosaveRef.current) return;

      if (autosaveTimerRef.current) {
        clearTimeout(autosaveTimerRef.current);
        autosaveTimerRef.current = null;
      }

      runAutosave();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushPendingAutosave();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      subscription.unsubscribe();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      flushPendingAutosave();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedType, individualProjectId]);

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <Link to={ROUTES.PROJECTS} className="hover:text-slate-900 dark:hover:text-slate-100 transition">
        Projects
      </Link>
      <span>/</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">Create Project</span>
    </nav>
  );

  if (!selectedType) {
    return (
      <div>
        {breadcrumb}
        <ProjectSelector
          onContinue={(type) => {
            methods.setValue("projectCategory", type);
            setSelectedType(type);
          }}
        />
      </div>
    );
  }

  if (selectedType === "portfolio") {
    return (
      <div>
        {breadcrumb}
        <PortfolioTourForm
          methods={methods}
          onSubmit={() => { }}
          isSubmitting={isSubmitting}
          hideSubmit
        />
      </div>
    );
  }

  return (
    <div>
      {breadcrumb}
      <IndividualProjectForm
        methods={methods}
        onSubmit={onSubmit}
        onNext={onNext}
        isSubmitting={isSubmitting}
        isNextSubmitting={isNextSubmitting}
      />
    </div>
  );
};

export default CreateProject;
