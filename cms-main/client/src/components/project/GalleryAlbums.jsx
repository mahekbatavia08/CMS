import { Controller, useFieldArray, useFormContext } from "react-hook-form";
import { Plus, Trash2 } from "lucide-react";

import GalleryImageUpload from "./GalleryImageUpload";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const GalleryAlbums = () => {
  const { control } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "media.gallery",
  });

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Gallery Albums</CardTitle>

        <Button
          type="button"
          onClick={() =>
            append({
              albumName: "",
              images: [],
            })
          }
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Album
        </Button>
      </CardHeader>

      <CardContent className="space-y-6">
        {fields.length === 0 && (
          <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">
            No albums added yet.
            <br />
            Click <strong>Add Album</strong> to create one.
          </div>
        )}

        {fields.map((album, index) => (
          <div
            key={album.id}
            className="space-y-5 rounded-xl border p-6"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">
                Album {index + 1}
              </h3>

              <Button
                type="button"
                variant="destructive"
                size="icon"
                onClick={() => remove(index)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            {/* Album Name */}

            <Controller
              control={control}
              name={`media.gallery.${index}.albumName`}
              render={({ field }) => (
                <Input
                  {...field}
                  placeholder="Album Name"
                />
              )}
            />

            {/* Album Images */}

            <Controller
              control={control}
              name={`media.gallery.${index}.images`}
              render={({ field }) => (
                <GalleryImageUpload
                  label="Album Images"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        ))}
      </CardContent>
    </Card>
  );
};

export default GalleryAlbums;