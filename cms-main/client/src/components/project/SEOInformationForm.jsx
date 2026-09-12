import { useEffect, useRef } from "react";
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

import {
  Search,
  Link2,
  Tags,
} from "lucide-react";

const slugify = (text) =>
  text
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

const SEOInformationForm = () => {
  const {
    register,
    watch,
    setValue,
    formState: { errors },
  } = useFormContext();

  const slugEdited = useRef(false);
  const slugField = register("general.slug", {
    required: "Slug is required",
    pattern: {
      value: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
      message: "Slug must be lowercase with hyphens (e.g. skyline-residency)",
    },
  });

  const projectName = watch("general.projectName");

  const metaTitle = watch("seo.metaTitle") || "";
  const metaDescription =
    watch("seo.metaDescription") || "";
  const shareDescription =
    watch("seo.shareDescription") || "";

  useEffect(() => {
    if (!projectName) return;

    if (!slugEdited.current) {
      setValue(
        "general.slug",
        slugify(projectName)
      );
    }
  }, [projectName, setValue]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          SEO Information
        </CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">

        <div className="space-y-2">
          <Label htmlFor="slug">
            URL Slug <span className="text-red-500">*</span>
          </Label>

          <Input
            id="slug"
            placeholder="skyline-residency"
            {...slugField}
            onChange={(e) => {
              slugEdited.current = true;
              slugField.onChange(e);
            }}
          />
          {errors.general?.slug && (
            <p className="text-xs text-red-500 font-medium mt-1">
              {errors.general.slug.message}
            </p>
          )}

          <p className="text-xs text-slate-500">
            Auto-generated from the Project Name.
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaTitle">
              Meta Title
            </Label>

            <span className="text-xs text-slate-500">
              {metaTitle.length}/60
            </span>
          </div>

          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-3 text-slate-500"
            />

            <Input
              id="metaTitle"
              className="pl-10"
              placeholder="Luxury Apartments in Ahmedabad"
              {...register("seo.metaTitle")}
            />
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="metaDescription">
              Meta Description
            </Label>

            <span className="text-xs text-slate-500">
              {metaDescription.length}/160
            </span>
          </div>

          <Textarea
            id="metaDescription"
            rows={4}
            placeholder="Write a search-engine-friendly description..."
            {...register("seo.metaDescription")}
          />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <Label htmlFor="shareDescription">
              Share Description
            </Label>

            <span className="text-xs text-slate-500">
              {shareDescription.length}/200
            </span>
          </div>

          <Textarea
            id="shareDescription"
            rows={3}
            placeholder="Write a short description used when sharing this project on WhatsApp, Facebook and other platforms..."
            {...register("seo.shareDescription")}
          />

          <p className="text-xs text-slate-500">
            This description will be used when the project is shared.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="keywords">
            Keywords
          </Label>

          <div className="relative">
            <Tags
              size={16}
              className="absolute left-3 top-3 text-slate-500"
            />

            <Input
              id="keywords"
              className="pl-10"
              placeholder="luxury apartments, ahmedabad, 3bhk"
              {...register("seo.keywords")}
            />
          </div>

          <p className="text-xs text-slate-500">
            Separate keywords with commas.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="canonicalUrl">
            Canonical URL
          </Label>

          <div className="relative">
            <Link2
              size={16}
              className="absolute left-3 top-3 text-slate-500"
            />

            <Input
              id="canonicalUrl"
              className="pl-10"
              placeholder="https://yourwebsite.com/projects/skyline-residency"
              {...register("seo.canonicalUrl")}
            />
          </div>
        </div>

      </CardContent>
    </Card>
  );
};

export default SEOInformationForm;