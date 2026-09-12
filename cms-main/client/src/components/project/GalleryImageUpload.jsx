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
    <div className="space-y-4">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">{label}</label>

      <input
        hidden
        ref={fileInputRef}
        type="file"
        multiple
        accept={accept}
        onChange={handleChange}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`
          flex
          h-48
          cursor-pointer
          flex-col
          items-center
          justify-center
          rounded-xl
          border-2
          border-dashed
          transition-all

          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          }
        `}
      >
        <ImagePlus size={48} className="mb-3 text-slate-400 dark:text-slate-500" />

        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {isDragging
            ? "Drop images here"
            : "Click or Drag images here"}
        </p>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          JPG, JPEG, PNG, WEBP
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Maximum size: 10 MB each
        </p>
      </div>

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {previews.map((preview, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-800/60"
            >
              <img
                src={preview.src}
                alt=""
                className="h-40 w-full object-cover"
              />

              <div className="space-y-2 p-3">
                <p className="truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                  {preview.name}
                </p>

                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  className="w-full"
                  onClick={() => removeImage(index)}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default GalleryImageUpload;