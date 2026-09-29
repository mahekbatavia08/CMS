import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Map } from "lucide-react";
import { PROJECT_SECTIONS } from "@/constants/projectSections";
import { FormProvider } from "react-hook-form";

import GeneralInformationForm from "./GeneralInformationForm";
import TagsFiltersForm from "./TagsFiltersForm";
import SpecificationsForm from "./SpecificationsForm";
import ContactInformationForm from "./ContactInformationForm";
import LocationInformationForm from "./LocationInformationForm";
import MediaInformationForm from "./CoverImageForm";
import VideoInformationForm from "./VideoInformationForm";
import StickyActionBar from "./StickyActionBar";
import { Button } from "@/components/ui/button";
import { ROUTES } from "@/constants/routes";

const ProjectForm = ({
  methods,
  onSubmit,
  onNext,
  onBack,
  isSubmitting = false,
  isNextSubmitting = false,
  title = "Create Project",
  description = "Fill in the project details below.",
  submitButtonText = "Create Project",
  projectId,
}) => {
  const navigate = useNavigate();
  const parentProjectId = methods.watch("parentProject");
  const isMasterChildProject = Boolean(parentProjectId) && parentProjectId !== "none";

  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-8 pb-24"
      >
        <div className="sticky top-0 z-30 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 flex items-start justify-between gap-3 flex-wrap bg-slate-100/95 dark:bg-slate-950/95 backdrop-blur border-b border-slate-200 dark:border-slate-800">
          <div>
            <h1 className="text-3xl font-bold dark:text-slate-50">
              {title}
            </h1>

            <p className="mt-2 text-slate-500 dark:text-slate-400">
              {description}
            </p>
          </div>

          {/* Standalone entry point into Map Skin selection — independent of
              the Save/Next flow, only shown once the project exists. */}
          {projectId && (
            <Button
              type="button"
              onClick={() => navigate(ROUTES.PROJECT_MAP_SKIN.replace(":id", projectId))}
              className="flex items-center gap-2 cursor-pointer shrink-0"
            >
              <Map className="h-4 w-4" />
              <span>Select Map Skin</span>
            </Button>
          )}
        </div>

        <div id={PROJECT_SECTIONS.general.id}>
          <GeneralInformationForm />
        </div>

        {isMasterChildProject && <TagsFiltersForm />}

        <SpecificationsForm />

        <div id={PROJECT_SECTIONS.contact.id}>
          <ContactInformationForm />
        </div>

        <div id={PROJECT_SECTIONS.location.id}>
          <LocationInformationForm />
        </div>

        <div id={PROJECT_SECTIONS.media.id}>
          <MediaInformationForm />
        </div>

        <div id={PROJECT_SECTIONS.videos.id}>
          <VideoInformationForm />
        </div>

        <StickyActionBar
          isSubmitting={isSubmitting}
          submitButtonText={submitButtonText}
          hideSubmit={!!onNext}
          onBack={onBack}
          onNext={
            onNext
              ? methods.handleSubmit(onNext, (errors) => {
                const errorMessages = [];
                if (errors?.general?.projectName) errorMessages.push("Project name is required");
                if (errors?.general?.builderName) errorMessages.push("Builder name is required");
                if (errors?.general?.slug) errorMessages.push("Slug is required");
                if (errorMessages.length > 0) {
                  toast.error(errorMessages.join(". "));
                } else {
                  toast.error("Please fill in all required fields before proceeding.");
                }
              })
              : undefined
          }
          isNextSubmitting={isNextSubmitting}
        />
      </form>
    </FormProvider>
  );
};

export default ProjectForm;