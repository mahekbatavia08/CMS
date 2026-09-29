import { useEffect, useMemo, useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Eye, FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import DocumentUpload from "./DocumentUpload";
import GalleryAlbums from "./GalleryAlbums";
import ImageUpload from "./ImageUpload";
import FloorPlanUpload from "./FloorPlanUpload";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_SECTIONS } from "@/constants/projectSections";
import { getImageUrl } from "@/lib/utils";

const MAX_RERA_SIZE = 20 * 1024 * 1024;

const ReraCertificateUpload = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const existing = value && !(value instanceof File) ? value : null;
  const selectedFile = value instanceof File ? value : null;

  const blobUrl = useMemo(() => (selectedFile ? URL.createObjectURL(selectedFile) : ""), [selectedFile]);
  useEffect(() => {
    return () => {
      if (blobUrl) URL.revokeObjectURL(blobUrl);
    };
  }, [blobUrl]);

  const validateAndSet = (file) => {
    if (!file) return;

    if (file.type !== "application/pdf") {
      toast.error(`${file.name} is not a PDF.`);
      return;
    }

    if (file.size > MAX_RERA_SIZE) {
      toast.error(`${file.name} exceeds 20 MB.`);
      return;
    }

    onChange(file);
  };

  const handleChange = (event) => {
    validateAndSet(event.target.files?.[0] || null);
    event.target.value = "";
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
    validateAndSet(event.dataTransfer.files?.[0] || null);
  };

  const handleRemove = () => {
    onChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="space-y-4">
      <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
        RERA Certificate
      </label>

      <input
        ref={fileInputRef}
        hidden
        type="file"
        accept="application/pdf"
        onChange={handleChange}
      />

      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`flex h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-all duration-200
          ${isDragging
            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
          }`}
      >
        <Upload
          size={50}
          className="mb-4 text-slate-400 dark:text-slate-500"
        />

        <p className="font-semibold text-slate-700 dark:text-slate-200">
          {isDragging ? "Drop PDF file here" : "Click or Drag PDF file here"}
        </p>

        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          PDF only
        </p>

        <p className="text-xs text-slate-400 dark:text-slate-500">
          Maximum size: 20 MB
        </p>
      </div>

      {selectedFile && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-500" />

            <div>
              <p className="font-medium text-slate-900 dark:text-slate-100">
                {selectedFile.name}
              </p>

              <p className="text-sm text-slate-500 dark:text-slate-400">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              title="View"
              render={<a href={blobUrl} target="_blank" rel="noopener noreferrer" />}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {!selectedFile && existing?.url && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-500" />

            <p className="font-medium text-slate-900 dark:text-slate-100">
              {existing.name || "RERA certificate"}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              title="View"
              render={<a href={getImageUrl(existing.url)} target="_blank" rel="noopener noreferrer" />}
            >
              <Eye className="h-4 w-4" />
            </Button>

            <Button
              type="button"
              variant="destructive"
              size="icon"
              onClick={handleRemove}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

const MediaInformationForm = ({
  title = "Media Information",
  thumbnailLabel = "Project Thumbnail",
  showGallery = true,
  showBrochures = true,
  showLegalDocuments = true,
  showFloorPlans = true,
  showThumbnailImage = false,
  showRera = true,
  coverAspectRatio = "16/9",
  thumbnailAspectRatio = "16/9",
}) => {
  const { control, register } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Cover Image */}
        <div id={PROJECT_SECTIONS.cover.id} className="max-w-sm">
          <Controller
            name="media.coverImage"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label={thumbnailLabel}
                value={field.value}
                onChange={field.onChange}
                aspectRatio={coverAspectRatio}
              />
            )}
          />
        </div>

        {/* Thumbnail Image */}
        {showThumbnailImage && (
          <Controller
            name="media.thumbnailImage"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Thumbnail Image"
                value={field.value}
                onChange={field.onChange}
                aspectRatio={thumbnailAspectRatio}
              />
            )}
          />
        )}

        {/* Gallery Albums */}
        {showGallery && (
          <div id={PROJECT_SECTIONS.gallery.id}>
            <GalleryAlbums />
          </div>
        )}

        {/* Brochures */}
        {showBrochures && (
          <div id={PROJECT_SECTIONS.brochure.id}>
            <Controller
              name="brochures"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <DocumentUpload
                  label="Brochures"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}

        {/* Floor Plans */}
        {showFloorPlans && (
          <div id={PROJECT_SECTIONS.floorplans.id}>
            <Controller
              name="floorPlans"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <FloorPlanUpload value={field.value} onChange={field.onChange} />
              )}
            />
          </div>
        )}

        {/* RERA Number */}
        {showRera && (
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
              RERA Number
            </label>
            <input
              type="text"
              placeholder="e.g. PR/GJ/SURAT/SURAT CITY/..."
              {...register("rera.number")}
              className="flex h-10 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            />
          </div>
        )}

        {/* RERA Certificate */}
        {showRera && (
          <Controller
            name="rera.certificate"
            control={control}
            render={({ field }) => (
              <ReraCertificateUpload
                value={field.value}
                onChange={field.onChange}
              />
            )}
          />
        )}

        {/* Legal Documents */}
        {showLegalDocuments && (
          <div id={PROJECT_SECTIONS.legal.id}>
            <Controller
              name="legalDocuments"
              control={control}
              defaultValue={[]}
              render={({ field }) => (
                <DocumentUpload
                  label="Legal Documents"
                  value={field.value}
                  onChange={field.onChange}
                />
              )}
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MediaInformationForm;