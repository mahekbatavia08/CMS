import { useFieldArray, useFormContext } from "react-hook-form";
import {
  Plus,
  Trash2,
  Video,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const VideoInformationForm = () => {
  const { control, register } = useFormContext();

  const { fields, append, remove } =
    useFieldArray({
      control,
      name: "videos",
    });

  const handleAddVideo = () => {
    append({
      title: "",
      url: "",
      thumbnail: "",
      displayOrder: fields.length + 1,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>
          Project Videos
        </CardTitle>

        {fields.length > 0 && (
          <Button
            type="button"
            onClick={handleAddVideo}
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Video
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-14 text-center">
            <Video
              size={46}
              className="mb-4 text-slate-400 dark:text-slate-500"
            />

            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No Videos Added
            </h3>

            <p className="mt-2 max-w-md text-sm text-slate-500 dark:text-slate-400">
              Store Google Drive video links instead
              of uploading video files to the server.
            </p>

            <Button
              type="button"
              className="mt-6"
              onClick={handleAddVideo}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Video
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            {fields.map((field, index) => (
              <div
                key={field.id}
                className="rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/40 p-5"
              >
                <div className="mb-5 flex items-center justify-between">
                  <h4 className="font-semibold text-slate-900 dark:text-slate-100">
                    Video #{index + 1}
                  </h4>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() =>
                      remove(index)
                    }
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="grid gap-5 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">Title</Label>

                    <Input
                      placeholder="Project Walkthrough"
                      {...register(
                        `videos.${index}.title`
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      Display Order
                    </Label>

                    <Input
                      type="number"
                      {...register(
                        `videos.${index}.displayOrder`,
                        {
                          valueAsNumber: true,
                        }
                      )}
                    />
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      Google Drive Video URL
                    </Label>

                    <Input
                      placeholder="https://drive.google.com/file/d/..."
                      {...register(
                        `videos.${index}.url`
                      )}
                    />

                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      Example:
                      https://drive.google.com/file/d/FILE_ID/view
                    </p>
                  </div>

                  <div className="space-y-2 md:col-span-2">
                    <Label className="text-slate-700 dark:text-slate-300">
                      Thumbnail URL (Optional)
                    </Label>

                    <Input
                      placeholder="https://..."
                      {...register(
                        `videos.${index}.thumbnail`
                      )}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default VideoInformationForm;