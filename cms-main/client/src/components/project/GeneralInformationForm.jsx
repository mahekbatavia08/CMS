import { useEffect, useRef, useState } from "react";
import { useFormContext } from "react-hook-form";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const GeneralInformationForm = ({ projectType }) => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const slugEdited = useRef(false);

  const projectName = watch("general.projectName");
  const currentSlug = watch("general.slug");
  const parentProject = watch("parentProject");

  useEffect(() => {
    if (!projectName) return;
    if (!slugEdited.current && !currentSlug) {
      setValue("general.slug", slugify(projectName), { shouldDirty: true });
    }
  }, [projectName, currentSlug, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Information</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Project Name */}
        <div className="space-y-2">
          <Label htmlFor="projectName">
            Project Name <span className="text-red-500">*</span>
          </Label>
          <Input
            id="projectName"
            placeholder="e.g. Skyline Residency"
            {...register("general.projectName", {
              required: "Project Name is required",
            })}
          />
          {errors.general?.projectName && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.general.projectName.message}
            </p>
          )}
        </div>

        {/* Builder Name & Slug */}
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="builderName">
              Builder Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="builderName"
              placeholder="e.g. Skyline Developers"
              {...register("general.builderName", {
                required: "Builder Name is required",
              })}
            />
            {errors.general?.builderName && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.general.builderName.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="slug">
              Slug <span className="text-red-500">*</span>
            </Label>
            <Input
              id="slug"
              placeholder="e.g. skyline-residency"
              {...register("general.slug", {
                required: "Slug is required",
                onChange: () => {
                  slugEdited.current = true;
                },
              })}
            />
            {errors.general?.slug && (
              <p className="text-xs text-red-500 font-medium mt-1">
                {errors.general.slug.message}
              </p>
            )}
          </div>
        </div>



        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="Enter detailed project description..."
            {...register("general.description")}
          />
        </div>

        {/* Option to also include as Individual Project if this project belongs to a Portfolio Tour */}
        {parentProject && parentProject !== "none" && (
          <div className="pt-4 border-t border-slate-200 dark:border-slate-800 space-y-1 animate-in fade-in-50 duration-200">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                {...register("alsoShowAsIndividual")}
                className="rounded border-slate-300 text-blue-600 focus:ring-blue-500 h-4 w-4"
              />
              <span className="text-sm font-medium">
                Also include as Individual Project
              </span>
            </label>

            <p className="text-xs text-slate-500">
              If checked, this project will also show up in the standalone
              "Individual" projects list, in addition to its Portfolio Tour.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GeneralInformationForm;