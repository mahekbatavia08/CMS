import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
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

      // Remove File objects before sending JSON
      if (data.media) {
        data.media.coverImage = null;
        data.media.thumbnailImage = null;
        data.media.gallery = [];
      }

      data.brochures = [];
      data.legalDocuments = [];
      data.floorPlans = [];

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

      const response = await projectService.createProject(data);
      const project = response.data?.project;

      // Upload cover image
      if (coverImage) {
        await projectService.uploadCoverImage(project._id, coverImage);
      }

      // Upload thumbnail image
      if (thumbnailImage) {
        await projectService.uploadThumbnailImage(project._id, thumbnailImage);
      }

      // Upload gallery albums and images
      for (const album of galleryAlbums) {
        const safeAlbumName = String(album.albumName || "").trim();
        if (!safeAlbumName) continue;
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

      // Upload floor plans
      const newFloorPlans = floorPlans.filter((doc) => doc.file);
      await Promise.all(
        newFloorPlans.map((floorPlan) =>
          projectService.uploadFloorPlan(project._id, floorPlan.file, floorPlan.title)
        )
      );

      // Invalidate React Query caches so new project appears everywhere
      await queryClient.invalidateQueries();

      toast.success(response.message || "Project created successfully.");
      const createdId = project?._id || response.data?.project?._id || response.data?._id;
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

  if (!selectedType) {
    return (
      <ProjectSelector
        onContinue={(type) => {
          methods.setValue("projectCategory", type);
          setSelectedType(type);
        }}
      />
    );
  }

  if (selectedType === "portfolio") {
    return (
      <PortfolioTourForm
        methods={methods}
        onSubmit={onSubmit}
        isSubmitting={isSubmitting}
      />
    );
  }

  return (
    <IndividualProjectForm
      methods={methods}
      onSubmit={onSubmit}
      onNext={onNext}
      isSubmitting={isSubmitting}
      isNextSubmitting={isNextSubmitting}
    />
  );
};

export default CreateProject;
