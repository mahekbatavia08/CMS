import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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

  const handleSave = async (data, { navigateToMapSkin = false } = {}) => {
    if (navigateToMapSkin) {
      setIsNextSubmitting(true);
    } else {
      setIsSubmitting(true);
    }

    try {
      // Thumbnail & Cover
      const coverImage = data.media?.coverImage instanceof File ? data.media.coverImage : (data.media?.coverImage?.file instanceof File ? data.media.coverImage.file : null);
      const thumbnailImage = data.media?.thumbnailImage instanceof File ? data.media.thumbnailImage : (data.media?.thumbnailImage?.file instanceof File ? data.media.thumbnailImage.file : null);

      // Gallery Albums
      const galleryAlbums = data.media?.gallery || [];
      const cleanAlbums = galleryAlbums
        .map((album) => ({
          ...album,
          images: (album.images || []).filter((img) => !img.file),
        }))
        .filter((album) => String(album.albumName || "").trim() !== "");

      // Documents
      const brochures = data.brochures || [];
      const legalDocuments = data.legalDocuments || [];
      const floorPlans = data.floorPlans || [];

      // Filter out new file objects before sending JSON
      if (data.media) {
        data.media.coverImage = coverImage ? null : data.media.coverImage;
        data.media.thumbnailImage = thumbnailImage ? null : data.media.thumbnailImage;
        data.media.gallery = cleanAlbums;
      }

      data.brochures = brochures.filter((doc) => !doc.file && doc.url);
      data.legalDocuments = legalDocuments.filter((doc) => !doc.file && doc.url);
      data.floorPlans = floorPlans.filter((doc) => !doc.file && doc.url);

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
      for (const album of galleryAlbums) {
        const safeAlbumName = String(album.albumName || "").trim();
        if (!safeAlbumName) continue;

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

      // Upload new floor plans
      const newFloorPlans = floorPlans.filter((doc) => doc.file);
      await Promise.all(
        newFloorPlans.map((floorPlan) =>
          projectService.uploadFloorPlan(id, floorPlan.file, floorPlan.title)
        )
      );

      // Invalidate React Query caches so updated project appears everywhere
      await queryClient.invalidateQueries();

      toast.success(
        response.message ||
        "Project updated successfully."
      );

      methods.reset({}, { keepValues: true });

      if (navigateToMapSkin) {
        navigate(ROUTES.PROJECT_MAP_SKIN.replace(":id", id));
      } else {
        navigate(ROUTES.PROJECTS);
      }
    } catch (error) {
      const responseData = error?.response?.data;

      console.log("Validation Error:", responseData);

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
    } finally {
      setIsSubmitting(false);
      setIsNextSubmitting(false);
    }
  };

  const onSubmit = (data) => handleSave(data, { navigateToMapSkin: false });
  const onNext = (data) => handleSave(data, { navigateToMapSkin: true });

  const handleBack = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(ROUTES.PROJECTS);
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

  if (isPortfolioTour) {
    return (
      <PortfolioTourForm
        methods={methods}
        onSubmit={onSubmit}
        onBack={handleBack}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
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
  );
};

export default EditProject;