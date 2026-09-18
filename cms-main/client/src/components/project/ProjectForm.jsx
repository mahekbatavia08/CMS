import { toast } from "sonner";
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
}) => {
  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-8 pb-24"
      >
        <div>
          <h1 className="text-3xl font-bold dark:text-slate-50">
            {title}
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            {description}
          </p>
        </div>

        <div id={PROJECT_SECTIONS.general.id}>
          <GeneralInformationForm />
        </div>

        <TagsFiltersForm />

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
          hideSubmit
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