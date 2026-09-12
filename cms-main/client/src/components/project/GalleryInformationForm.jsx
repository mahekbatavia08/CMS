import { Controller, useFormContext } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import GalleryUpload from "./GalleryUpload";

const GalleryInformationForm = () => {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          Project Gallery
        </CardTitle>
      </CardHeader>

      <CardContent>
        <Controller
          name="media.gallery"
          control={control}
          render={({ field }) => (
            <GalleryUpload
              label="Project Photos"
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
      </CardContent>
    </Card>
  );
};

export default GalleryInformationForm;