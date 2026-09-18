import { useRef, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { FileText, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";

import DocumentUpload from "./DocumentUpload";
import GalleryAlbums from "./GalleryAlbums";
import ImageUpload from "./ImageUpload";
import FloorPlanUpload from "./FloorPlanUpload";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PROJECT_SECTIONS } from "@/constants/projectSections";

const MAX_RERA_SIZE = 20 * 1024 * 1024;

const ReraCertificateUpload = ({ value, onChange }) => {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const existing = value && !(value instanceof File) ? value : null;
  const selectedFile = value instanceof File ? value : null;

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

          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      )}

      {!selectedFile && existing?.url && (
        <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
          <div className="flex items-center gap-3">
            <FileText className="h-8 w-8 text-red-500" />

            <a
              href={existing.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-slate-900 hover:underline dark:text-slate-100"
            >
              {existing.name || "View uploaded RERA certificate"}
            </a>
          </div>

          <Button
            type="button"
            variant="destructive"
            size="icon"
            onClick={handleRemove}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
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
}) => {
  const { control } = useFormContext();

  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* Cover Image */}
        <div id={PROJECT_SECTIONS.cover.id}>
          <Controller
            name="media.coverImage"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label={thumbnailLabel}
                value={field.value}
                onChange={field.onChange}
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
