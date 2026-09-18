import { toast } from "sonner";
import { PROJECT_SECTIONS } from "@/constants/projectSections";
import { FormProvider } from "react-hook-form";

import GeneralInformationForm from "./GeneralInformationForm";
import ContactInformationForm from "./ContactInformationForm";
import LocationInformationForm from "./LocationInformationForm";
import MediaInformationForm from "./CoverImageForm";
import VideoInformationForm from "./VideoInformationForm";
import TagsFiltersForm from "./TagsFiltersForm";
import SpecificationsForm from "./SpecificationsForm";
import StickyActionBar from "./StickyActionBar";

const IndividualProjectForm = ({
  methods,
  onSubmit,
  onNext,
  isSubmitting = false,
  isNextSubmitting = false,
}) => {


  return (
    <FormProvider {...methods}>
      <form
        onSubmit={methods.handleSubmit(onSubmit)}
        className="space-y-8 pb-24"
      >
        <div>
          <h1 className="text-3xl font-bold dark:text-slate-50">
            Create Individual Project
          </h1>

          <p className="mt-2 text-slate-500 dark:text-slate-400">
            Fill in the Individual Project details below.
          </p>
        </div>

        <div id={PROJECT_SECTIONS.general.id}>
          <GeneralInformationForm projectType="individual" />
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
          <MediaInformationForm
            title="Media Information"
            thumbnailLabel="Project Thumbnail"
          />
        </div>

        <div id={PROJECT_SECTIONS.videos.id}>
          <VideoInformationForm />
        </div>

        <StickyActionBar
          isSubmitting={isSubmitting}
          submitButtonText="Create Project"
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

export default IndividualProjectForm;