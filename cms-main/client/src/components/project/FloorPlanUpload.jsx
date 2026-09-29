import { useEffect, useMemo, useRef, useState } from "react";
import { Eye, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { getImageUrl } from "@/lib/utils";

const MAX_FLOOR_PLAN_SIZE = 100 * 1024 * 1024; // matches server limit (uploadFloorPlan.js)
const ALLOWED_TYPES = ["application/pdf", "image/png", "image/jpeg", "image/jpg", "image/webp"];
const IMAGE_EXT = /\.(png|jpe?g|webp|gif)(\?.*)?$/i;

/**
 * One floor plan card. A plan is either a freshly picked File (previewed
 * through a temporary blob URL) or an already saved plan whose file lives on
 * the server (`thumbnail` / `originalPdf` / `pages[0].url`).
 */
const FloorPlanCard = ({ floorPlan, onTitleChange, onRemove }) => {
  const file = floorPlan.file instanceof File ? floorPlan.file : null;

  const blobUrl = useMemo(() => (file ? URL.createObjectURL(file) : ""), [file]);
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const savedPath = floorPlan.originalPdf || floorPlan.pages?.[0]?.url || "";
  const openUrl = file ? blobUrl : savedPath ? getImageUrl(savedPath) : "";

  let previewSrc = "";
  if (file) {
    previewSrc = file.type.startsWith("image/") ? blobUrl : "";
  } else if (IMAGE_EXT.test(floorPlan.thumbnail || "")) {
    previewSrc = getImageUrl(floorPlan.thumbnail);
  } else if (IMAGE_EXT.test(savedPath)) {
    previewSrc = getImageUrl(savedPath);
  }

  const fileName = file
    ? file.name
    : decodeURIComponent(savedPath.split("/").pop() || "") || "Floor plan";

  const sizeLabel = file ? `${(file.size / 1024 / 1024).toFixed(2)} MB` : null;

  return (
    <div className="flex h-full min-w-0 flex-col gap-4 rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40">
      {/* Title + actions */}
      <div className="flex items-end gap-2">
        <div className="min-w-0 flex-1 space-y-1.5">
          <Label>Title</Label>
          <Input
            placeholder="Ground Floor"
            value={floorPlan.title || ""}
            onChange={(e) => onTitleChange(e.target.value)}
          />
        </div>

        {openUrl && (
          <Button
            variant="outline"
            size="icon"
            title="View"
            render={<a href={openUrl} target="_blank" rel="noopener noreferrer" />}
          >
            <Eye className="h-4 w-4" />
          </Button>
        )}

        <Button
          type="button"
          variant="destructive"
          size="icon"
          title="Remove"
          onClick={onRemove}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Preview */}
      <div className="flex h-44 items-center justify-center overflow-hidden rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
        {previewSrc ? (
          <a href={openUrl} target="_blank" rel="noopener noreferrer" className="h-full w-full">
            <img
              src={previewSrc}
              alt={floorPlan.title || fileName}
              className="h-full w-full object-contain"
            />
          </a>
        ) : (
          <FileText className="h-12 w-12 text-red-500" />
        )}
      </div>

      {/* File name */}
      <div className="flex min-w-0 items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <FileText className="h-4 w-4 shrink-0" />
        {openUrl ? (
          <a
            href={openUrl}
            target="_blank"
            rel="noopener noreferrer"
            title={fileName}
            className="truncate text-blue-600 hover:underline dark:text-blue-400"
          >
            {fileName}
          </a>
        ) : (
          <span className="truncate" title={fileName}>{fileName}</span>
        )}
        {sizeLabel && (
          <span className="ml-auto shrink-0 text-xs text-slate-500 dark:text-slate-400">
            {sizeLabel}
          </span>
        )}
      </div>
    </div>
  );
};

const FloorPlanUpload = ({ value = [], onChange }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

  const plans = Array.isArray(value) ? value : [];

  const addFiles = (files) => {
    const accepted = [];

    Array.from(files || []).forEach((file) => {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name}: only PDF, PNG, JPG or WEBP allowed.`);
        return;
      }
      if (file.size > MAX_FLOOR_PLAN_SIZE) {
        toast.error(`${file.name} exceeds 100 MB.`);
        return;
      }
      accepted.push({
        title: file.name.replace(/\.[^/.]+$/, ""),
        file,
      });
    });

    if (accepted.length) {
      onChange([...plans, ...accepted]);
    }
  };

  const removeFloorPlan = (index) => {
    onChange(plans.filter((_, i) => i !== index));
  };

  const updateTitle = (index, title) => {
    const updated = [...plans];
    updated[index] = { ...updated[index], title };
    onChange(updated);
  };

  const handleDragOver = (event) => {
    event.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (event) => {
    event.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    addFiles(event.dataTransfer.files);
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
        Floor Plans
      </label>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        multiple
        accept="application/pdf,image/png,image/jpeg,image/webp"
        onChange={(event) => {
          addFiles(event.target.files);
          event.target.value = "";
        }}
      />

      {/* Drop zone */}
      <div
        role="button"
        tabIndex={0}
        onClick={() => fileInputRef.current?.click()}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            fileInputRef.current?.click();
          }
        }}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-40 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200
          ${isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          }`}
      >
        <Upload size={36} className="mb-3 text-slate-400 dark:text-slate-500" />

        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {isDragging ? "Drop floor plans here" : "Click or Drag floor plans here"}
        </p>

        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          PDF, PNG, JPG, WEBP · multiple files allowed
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Maximum size: 100 MB each
        </p>
      </div>

      {/* Floor plans — 2 per row on desktop, 1 on mobile */}
      {plans.length > 0 && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {plans.map((floorPlan, index) => (
            <FloorPlanCard
              key={floorPlan._id || `${floorPlan.file?.name || "plan"}-${index}`}
              floorPlan={floorPlan}
              onTitleChange={(title) => updateTitle(index, title)}
              onRemove={() => removeFloorPlan(index)}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default FloorPlanUpload;