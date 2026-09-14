import { Controller, useFormContext } from "react-hook-form";

import DocumentUpload from "./DocumentUpload";
import GalleryAlbums from "./GalleryAlbums";
import ImageUpload from "./ImageUpload";
import FloorPlanUpload from "./FloorPlanUpload";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_SECTIONS } from "@/constants/projectSections";

const MediaInformationForm = ({
  title = "Media Information",
  thumbnailLabel = "Project Thumbnail",
  showGallery = true,
  showBrochures = true,
  showLegalDocuments = true,
  showFloorPlans = true,
  showThumbnailImage = false,
}) => {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Cover Image */}
        <div id={PROJECT_SECTIONS.cover.id}>
          <Controller
            name="media.coverImage"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label={thumbnailLabel}
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        </div>

        {/* Thumbnail Image */}
        {showThumbnailImage && (
          <Controller
            name="media.thumbnailImage"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Thumbnail Image"
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}

        {/* Gallery Albums */}
        {showGallery && (
          <div id={PROJECT_SECTIONS.gallery.id}>
            <GalleryAlbums />
          </div>
        )}

        {/* Brochures */}
        {showBrochures && (
          <div id={PROJECT_SECTIONS.brochure.id}>
            <Controller
              name="brochures"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <DocumentUpload
                  label="Brochures"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        {/* Floor Plans */}
        {showFloorPlans && (
          <div id={PROJECT_SECTIONS.floorplans.id}>
            <Controller
              name="floorPlans"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <FloorPlanUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        )}

        {/* Legal Documents */}
        {showLegalDocuments && (
          <div id={PROJECT_SECTIONS.legal.id}>
            <Controller
              name="legalDocuments"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <DocumentUpload
                  label="Legal Documents"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MediaInformationForm;
