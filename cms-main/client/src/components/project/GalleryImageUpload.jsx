import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
];

const GalleryImageUpload = ({
  label = "Gallery Images",
  value = [],
  onChange,
  accept = "image/*",
}) => {
  const [previews, setPreviews] = useState([]);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  useEffect(() => {
    if (!value || value.length === 0) {
      setPreviews([]);
      return;
    }

    const previewList = value.map((item) => {
      // Existing image
      if (item?.url) {
        return {
          src: getImageUrl(item.url),
          name: item.caption || "Gallery Image",
          existing: true,
        };
      }

      // Newly selected image
      if (item?.file instanceof File) {
        return {
          src: URL.createObjectURL(item.file),
          name: item.file.name,
          existing: false,
        };
      }

      return null;
    }).filter(Boolean);

    setPreviews(previewList);

    return () => {
      previewList.forEach((preview) => {
        if (!preview.existing) {
          URL.revokeObjectURL(preview.src);
        }
      });
    };
  }, [value]);

  const addFiles = (files) => {
    if (!files.length) return;

    const newImages = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a supported image.`);
        continue;
      }

      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 10 MB.`);
        continue;
      }

      newImages.push({
        file,
        caption: "",
        alt: "",
      });
    }

    if (newImages.length) {
      onChange([...(value || []), ...newImages]);
    }
  };

  const handleChange = (e) => {
    addFiles(Array.from(e.target.files || []));
    e.target.value = "";
  };

  const removeImage = (index) => {
    const updated = [...value];
    updated.splice(index, 1);
    onChange(updated);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    addFiles(Array.from(e.dataTransfer.files || []));
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>

      <input
        hidden
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
      />

      <div className="flex flex-wrap items-start gap-4">
        {/* Drag/drop box, thumbnail sized (4:3) and always available so more
            images can be added right beside the ones already uploaded. */}
        <div
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          style={{ aspectRatio: "4/3" }}
          className={`
            flex
            w-56
            shrink-0
            cursor-pointer
            flex-col
            items-center
            justify-center
            rounded-xl
            border-2
            border-dashed
            p-2
            text-center
            transition-all

            ${
              isDragging
                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
            }
          `}
        >
          <ImagePlus size={24} className="mb-1.5 text-slate-400 dark:text-slate-500" />

          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            {isDragging ? "Drop here" : "Click or Drag"}
          </p>
        </div>

        {/* Uploaded images, shown beside the drag box instead of in a
            separate section below it. */}
        {previews.map((preview, index) => (
          <div
            key={index}
            style={{ aspectRatio: "4/3" }}
            className="group relative w-56 shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900"
          >
            <img
              src={preview.src}
              alt=""
              className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
            />

            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
              <Button
                type="button"
                size="icon-sm"
                variant="destructive"
                onClick={() => removeImage(index)}
                title="Remove"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>

            <p className="absolute inset-x-0 bottom-0 truncate bg-black/60 px-2 py-1 text-xs text-white">
              {preview.name}
            </p>
          </div>
        ))}
      </div>

      <p className="text-xs text-slate-400 dark:text-slate-500">
        JPG, JPEG, PNG, WEBP &middot; Maximum size: 10 MB each
      </p>
    </div>
  );
};

export default GalleryImageUpload;