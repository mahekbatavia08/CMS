import { useFieldArray, useFormContext } from "react-hook-form";
import { FileText, Plus, Trash2 } from "lucide-react";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BrochureInformationForm = () => {
  const { control, register, setValue, watch } = useFormContext();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "brochures",
  });

  const brochures = watch("brochures");

  const addBrochure = () => {
    append({
      title: "",
      file: null,
    });
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Project Brochures</CardTitle>

        {fields.length > 0 && (
          <Button type="button" onClick={addBrochure}>
            <Plus className="mr-2 h-4 w-4" />
            Add Brochure
          </Button>
        )}
      </CardHeader>

      <CardContent>
        {fields.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 py-14 text-center">
            <FileText
              size={46}
              className="mb-4 text-slate-400 dark:text-slate-500"
            />

            <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
              No Brochures Added
            </h3>

            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              Upload one or more brochure PDFs.
            </p>

            <Button
              type="button"
              className="mt-6"
              onClick={addBrochure}
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Brochure
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
                    Brochure #{index + 1}
                  </h4>

                  <Button
                    type="button"
                    variant="destructive"
                    size="icon"
                    onClick={() => remove(index)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>

                <div className="space-y-5">
                  <div className="space-y-2">
                    <Label>Title</Label>

                    <Input
                      placeholder="Sales Brochure"
                      {...register(
                        `brochures.${index}.title`
                      )}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Brochure PDF</Label>

                    <Input
                      type="file"
                      accept=".pdf"
                      onChange={(e) => {
                        const file =
                          e.target.files?.[0] || null;

                        setValue(
                          `brochures.${index}.file`,
                          file,
                          {
                            shouldDirty: true,
                          }
                        );
                      }}
                    />

                    {brochures?.[index]?.file && (
                      <p className="text-sm text-slate-500">
                        Selected:{" "}
                        {
                          brochures[index].file
                            .name
                        }
                      </p>
                    )}
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

export default BrochureInformationForm;