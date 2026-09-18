import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useSearchParams, Link } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import useProjectForm from "@/hooks/useProjectForm";
import projectService from "@/services/project/projectService";

import { ROUTES } from "@/constants/routes";
import { PROJECT_SECTIONS } from "@/constants/projectSections";

import ProjectForm from "@/components/project/ProjectForm";
import PortfolioTourForm from "@/components/project/PortfolioTourForm";

const EditProject = () => {
  const { id } = useParams();

  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [searchParams] = useSearchParams();
  const sectionParam = searchParams.get("section");

  const methods = useProjectForm();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNextSubmitting, setIsNextSubmitting] = useState(false);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const response = await projectService.getProject(id);
        const project = response.data.project;

        methods.reset(project);

        // The loaded project only stores `parentProject`; derive the
        // "Add to Existing Portfolio Tour" checkbox state from it so this
        // section (and the "Also include as Individual Project" option
        // inside it) is visible when editing a project already in a
        // Portfolio Tour.
        if (project?.parentProject) {
          methods.setValue("addToPortfolio", true);
        }
      } catch (error) {
        toast.error(
          error?.response?.data?.message ||
          "Failed to load project."
        );

        navigate(ROUTES.PROJECTS);
      } finally {
        setIsLoading(false);
      }
    };

    fetchProject();
  }, [id, methods, navigate]);

  const autosaveTimerRef = useRef(null);
  const isAutosavingRef = useRef(false);
  const hasPendingAutosaveRef = useRef(false);

  useEffect(() => {
    if (isLoading) return undefined;

    const runAutosave = () => {
      if (isAutosavingRef.current) return;

      hasPendingAutosaveRef.current = false;
      isAutosavingRef.current = true;
      handleSave(methods.getValues(), { silent: true }).finally(() => {
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
  }, [isLoading]);

  useEffect(() => {
    if (!isLoading && sectionParam) {
      const section = Object.values(PROJECT_SECTIONS).find(
        (sec) => sec.slug === sectionParam
      );

      if (section) {
        setTimeout(() => {
          const element = document.getElementById(section.id);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "start" });
          }
        }, 100);
      }
    }
  }, [isLoading, sectionParam]);

  const handleSave = async (data, { navigateToMapSkin = false, silent = false } = {}) => {
    if (!silent) {
      if (navigateToMapSkin) {
        setIsNextSubmitting(true);
      } else {
        setIsSubmitting(true);
      }
    }

    try {
      // Thumbnail & Cover
      const coverImage = data.media?.coverImage instanceof File ? data.media.coverImage : (data.media?.coverImage?.file instanceof File ? data.media.coverImage.file : null);
      const thumbnailImage = data.media?.thumbnailImage instanceof File ? data.media.thumbnailImage : (data.media?.thumbnailImage?.file instanceof File ? data.media.thumbnailImage.file : null);

      // Gallery Albums
      const galleryAlbums = data.media?.gallery || [];
      const cleanAlbums = galleryAlbums.map((album, albumIndex) => ({
        ...album,
        albumName: String(album.albumName || "").trim() || `Album ${albumIndex + 1}`,
        images: (album.images || []).filter((img) => !img.file),
      }));

      // Documents
      const brochures = data.brochures || [];
      const legalDocuments = data.legalDocuments || [];
      const floorPlans = data.floorPlans || [];

      // RERA Certificate
      const reraCertificateFile =
        data.rera?.certificate instanceof File ? data.rera.certificate : null;

      // Filter out new file objects before sending JSON
      if (data.media) {
        data.media.coverImage = coverImage ? null : data.media.coverImage;
        data.media.thumbnailImage = thumbnailImage ? null : data.media.thumbnailImage;
        data.media.gallery = cleanAlbums;
      }

      data.brochures = brochures.filter((doc) => !doc.file && doc.url);
      data.legalDocuments = legalDocuments.filter((doc) => !doc.file && doc.url);
      // Floor plan items are stored with `originalPdf` (not `url`), unlike
      // brochures/legal documents, so already-saved plans must be matched
      // on that field or they get dropped from the array on every save.
      data.floorPlans = floorPlans.filter((doc) => !doc.file && doc.originalPdf);

      if (data.rera) {
        data.rera.certificate = reraCertificateFile ? null : data.rera.certificate;
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

      // Strip metadata before sending update payload
      delete data.__v;
      delete data._id;
      delete data.createdAt;
      delete data.updatedAt;

      // Update project JSON data
      const response = await projectService.updateProject(id, data);

      // Upload new cover image
      if (coverImage) {
        await projectService.uploadCoverImage(id, coverImage);
      }

      // Upload new thumbnail image
      if (thumbnailImage) {
        await projectService.uploadThumbnailImage(id, thumbnailImage);
      }

      // Upload newly added gallery images inside albums
      for (const [albumIndex, album] of galleryAlbums.entries()) {
        const safeAlbumName = String(album.albumName || "").trim() || `Album ${albumIndex + 1}`;

        const newImages = (album.images || []).filter((img) => img.file);

        await Promise.all(
          newImages.map((image, index) =>
            projectService.uploadGalleryImage(id, image.file, {
              albumName: safeAlbumName,
              caption: image.caption || "",
              alt: image.alt || "",
              displayOrder: index,
            })
          )
        );
      }

      // Upload new brochures
      const newBrochures = brochures.filter((doc) => doc.file);
      await Promise.all(
        newBrochures.map((brochure) =>
          projectService.uploadBrochure(id, brochure.file, brochure.title)
        )
      );

      // Upload new legal documents
      const newLegalDocs = legalDocuments.filter((doc) => doc.file);
      await Promise.all(
        newLegalDocs.map((document) =>
          projectService.uploadLegalDocument(id, document.file, document.title)
        )
      );

      // Upload new RERA certificate
      if (reraCertificateFile) {
        await projectService.uploadReraCertificate(id, reraCertificateFile);
      }

      // Upload new floor plans
      const newFloorPlans = floorPlans.filter((doc) => doc.file);
      await Promise.all(
        newFloorPlans.map((floorPlan) =>
          projectService.uploadFloorPlan(id, floorPlan.file, floorPlan.title)
        )
      );

      // Invalidate React Query caches so updated project appears everywhere
      await queryClient.invalidateQueries();

      if (!silent && !navigateToMapSkin) {
        toast.success(
          response.message ||
          "Project updated successfully."
        );
      }

      methods.reset({}, { keepValues: true });

      if (!silent) {
        if (navigateToMapSkin) {
          navigate(ROUTES.PROJECT_MAP_SKIN.replace(":id", id));
        } else {
          navigate(ROUTES.PROJECTS);
        }
      }
    } catch (error) {
      if (silent) {
        console.error("Autosave failed:", error);
      } else {
        const responseData = error?.response?.data;

        if (responseData?.errors?.length) {
          toast.error(
            responseData.errors
              .map(
                (err) =>
                  `${err.field}: ${err.message}`
              )
              .join("\n")
          );
        } else {
          toast.error(
            responseData?.message ||
            error.message ||
            "Failed to update project."
          );
        }
      }
    } finally {
      if (!silent) {
        setIsSubmitting(false);
        setIsNextSubmitting(false);
      }
    }
  };

  const onSubmit = (data) => handleSave(data, { silent: true });
  const onNext = (data) => handleSave(data, { navigateToMapSkin: true });

  const handleBack = () => {
    const category = methods.watch("projectCategory");
    const parent = methods.watch("parentProject");

    if (category === "portfolio") {
      navigate(ROUTES.PROJECTS_MASTER);
    } else if (parent) {
      navigate(ROUTES.PROJECTS_PORTFOLIO_DETAIL.replace(":portfolioId", parent));
    } else {
      navigate(ROUTES.PROJECTS_INDIVIDUAL);
    }
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 p-12 text-center text-slate-700 dark:text-slate-300">
        Loading project...
      </div>
    );
  }

  const isPortfolioTour = methods.watch("projectCategory") === "portfolio";
  const parentProjectId = methods.watch("parentProject");
  const projectName = methods.watch("general.projectName") || "Untitled Project";

  let crumbLabel = "Projects";
  let crumbLink = ROUTES.PROJECTS;

  if (isPortfolioTour) {
    crumbLabel = "Master Project";
    crumbLink = ROUTES.PROJECTS_MASTER;
  } else if (parentProjectId) {
    crumbLabel = "Master Project";
    crumbLink = ROUTES.PROJECTS_PORTFOLIO_DETAIL.replace(":portfolioId", parentProjectId);
  } else {
    crumbLabel = "Projects";
    crumbLink = ROUTES.PROJECTS_INDIVIDUAL;
  }

  // The master portfolio this project belongs to (itself, if it is one) so
  // its breadcrumb name can jump back to the Master Projects list.
  const masterProjectId = isPortfolioTour ? id : parentProjectId || null;

  const breadcrumb = (
    <nav className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400 mb-4">
      <Link to={crumbLink} className="hover:text-slate-900 dark:hover:text-slate-100 transition">
        {crumbLabel}
      </Link>
      <span>/</span>
      <span className="text-slate-700 dark:text-slate-300 truncate max-w-[220px]">
        {masterProjectId ? (
          <Link
            to={`${ROUTES.PROJECTS_MASTER}?highlight=${masterProjectId}`}
            className="hover:text-slate-900 dark:hover:text-slate-100 hover:underline transition"
          >
            {projectName}
          </Link>
        ) : (
          projectName
        )}
      </span>
      <span>/</span>
      <span className="font-semibold text-slate-900 dark:text-slate-100">
        Edit Project
      </span>
    </nav>
  );

  if (isPortfolioTour) {
    return (
      <div>
        {breadcrumb}
        <PortfolioTourForm
          methods={methods}
          onSubmit={onSubmit}
          onBack={handleBack}
          isSubmitting={isSubmitting}
          hideSubmit
        />
      </div>
    );
  }

  return (
    <div>
      {breadcrumb}
      <ProjectForm
        methods={methods}
        onSubmit={onSubmit}
        onNext={onNext}
        onBack={handleBack}
        isSubmitting={isSubmitting}
        isNextSubmitting={isNextSubmitting}
        title="Edit Project"
        description="Update the project details below."
        submitButtonText="Save Changes"
      />
    </div>
  );
};

export default EditProject;