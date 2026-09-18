import { useRef, useState } from "react";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

const MAX_SIZE = 20 * 1024 * 1024;

const ALLOWED_TYPES = ["application/pdf"];

const DocumentUpload = ({
  label,
  value = [],
  onChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);

  const validateFiles = (files) => {
    const validFiles = [];

    for (const file of files) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        toast.error(`${file.name} is not a PDF.`);
        continue;
      }

      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} exceeds 20 MB.`);
        continue;
      }

      validFiles.push({
        title: file.name.replace(/\.pdf$/i, ""),
        file,
      });
    }

    if (validFiles.length) {
      onChange([...(value || []), ...validFiles]);
    }
  };

  const handleChange = (event) => {
    validateFiles(Array.from(event.target.files || []));

    event.target.value = "";
  };

  const handleRemove = (index) => {
    const updated = [...value];
    updated.splice(index, 1);

    onChange(updated);

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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

    validateFiles(Array.from(event.dataTransfer.files || []));
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
        {label}
      </label>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        multiple
        accept="application/pdf"
        onChange={handleChange}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200
          ${
            isDragging
              ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
              : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          }`}
      >
        <Upload
          size={50}
          className="mb-4 text-slate-400 dark:text-slate-500"
        />

        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {isDragging
            ? "Drop PDF files here"
            : "Click or Drag PDF files here"}
        </p>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          PDF only
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Maximum size: 20 MB each
        </p>
      </div>

      {value?.length > 0 && (
        <div className="space-y-3">
          {value.map((document, index) => {
            const file = document.file || null;
            const displayName = document.title || file?.name || "Document";
            const sizeLabel = file
              ? `${(file.size / 1024 / 1024).toFixed(2)} MB`
              : null;
            const viewUrl = !file && document.url ? getImageUrl(document.url) : null;

            return (
              <div
                key={index}
                className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60"
              >
                <div className="flex items-center gap-3">
                  <FileText className="h-8 w-8 text-red-500" />

                  <div>
                    {viewUrl ? (
                      <a
                        href={viewUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="font-medium text-blue-600 hover:underline dark:text-blue-400"
                      >
                        {displayName}
                      </a>
                    ) : (
                      <p className="font-medium text-slate-900 dark:text-slate-100">
                        {displayName}
                      </p>
                    )}

                    {sizeLabel && (
                      <p className="text-sm text-slate-500 dark:text-slate-400">
                        {sizeLabel}
                      </p>
                    )}
                  </div>
                </div>

                <Button
                  type="button"
                  variant="destructive"
                  size="icon"
                  onClick={() =>
                    handleRemove(index)
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default DocumentUpload;