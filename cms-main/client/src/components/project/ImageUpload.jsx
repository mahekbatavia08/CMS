import { useEffect, useRef, useState } from "react";
import { ImagePlus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { getImageUrl } from "@/lib/utils";

const MAX_SIZE = 10 * 1024 * 1024;

const ALLOWED_TYPES = [
    "image/jpeg",
    "image/jpg",
    "image/pjpeg",
    "image/png",
    "image/x-png",
    "image/webp",
    "image/avif",
    "image/gif",
    "image/bmp",
    "image/svg+xml",
    "image/heic",
    "image/heif",
];

const ALLOWED_EXTENSIONS = [
    ".jpg",
    ".jpeg",
    ".png",
    ".webp",
    ".avif",
    ".gif",
    ".bmp",
    ".svg",
    ".heic",
    ".heif",
];

const getInitialPreview = (value) => {
    if (!value) return null;
    if (typeof value === "object" && value.url && !(value instanceof File)) {
        return getImageUrl(value.url);
    }
    if (typeof value === "string" && value) {
        return getImageUrl(value);
    }
    return null;
};

const ImageUpload = ({
    label,
    value,
    accept = "image/*",
    onChange,
    aspectRatio,
}) => {
    const [preview, setPreview] = useState(() => getInitialPreview(value));
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!value) {
            setPreview(null);
            return;
        }

        // Existing image from database (object with url)
        if (
            typeof value === "object" &&
            value.url &&
            !(value instanceof File)
        ) {
            setPreview(getImageUrl(value.url));
            return;
        }

        // Existing image from database (plain string url)
        if (typeof value === "string") {
            setPreview(getImageUrl(value));
            return;
        }

        // Newly selected image (File)
        if (value instanceof File) {
            const objectUrl = URL.createObjectURL(value);

            setPreview(objectUrl);

            return () => {
                URL.revokeObjectURL(objectUrl);
            };
        }
    }, [value]);

    const validateAndUpload = (file) => {
        if (!file) return;

        const fileType = file.type ? file.type.toLowerCase() : "";
        const fileName = file.name ? file.name.toLowerCase() : "";
        const ext = fileName.substring(fileName.lastIndexOf("."));

        const isImageMime = fileType.startsWith("image/") || ALLOWED_TYPES.includes(fileType);
        const isImageExt = ALLOWED_EXTENSIONS.includes(ext);

        if (!isImageMime && !isImageExt) {
            toast.error(
                "Only image files (JPG, JPEG, PNG, WEBP, AVIF, GIF, etc.) are allowed."
            );
            return;
        }

        if (file.size > MAX_SIZE) {
            toast.error(
                "Image size must be less than 10 MB."
            );
            return;
        }

        onChange(file);
    };

    const handleChange = (event) => {
        const file = event.target.files?.[0];

        validateAndUpload(file);

        event.target.value = "";
    };

    const handleRemove = () => {
        onChange(null);

        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const handleDragOver = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setIsDragging(true);
    };

    const handleDragLeave = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setIsDragging(false);
    };

    const handleDrop = (event) => {
        event.preventDefault();
        event.stopPropagation();

        setIsDragging(false);

        const file = event.dataTransfer.files?.[0];

        validateAndUpload(file);
    };

    const hasImage = Boolean(preview && value);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700 dark:text-slate-200">
                {label}
            </label>

            <input
                ref={fileInputRef}
                hidden
                type="file"
                accept={accept}
                onChange={handleChange}
            />

            <div className="flex flex-wrap items-start gap-4">
                {/* Drag/drop box — only shown until an image is uploaded,
                    since only one thumbnail can be set at a time. Once an
                    image exists, use the Change button on it instead. */}
                {!hasImage && (
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        style={aspectRatio ? { aspectRatio } : undefined}
                        className={`
            flex
            w-48
            ${aspectRatio ? "" : "h-48"}
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
            duration-200

            ${isDragging
                                ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                                : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                            }
          `}
                    >
                        <ImagePlus
                            size={24}
                            className="mb-1.5 text-slate-400 dark:text-slate-500"
                        />

                        <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
                            {isDragging ? "Drop here" : "Click or Drag"}
                        </p>
                    </div>
                )}

                {/* Uploaded image */}
                {hasImage && (
                    <>
                        <div
                            style={aspectRatio ? { aspectRatio } : undefined}
                            className={`group relative w-48 ${aspectRatio ? "" : "h-48"} shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900`}
                        >
                            <img
                                src={preview}
                                alt="Preview"
                                className={`h-full w-full ${aspectRatio ? "object-cover" : "object-contain"} transition duration-300 group-hover:scale-105`}
                            />

                            <div className="absolute inset-0 flex items-center justify-center gap-1.5 bg-black/50 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="secondary"
                                    onClick={() => fileInputRef.current?.click()}
                                    title="Change Image"
                                >
                                    <Pencil className="h-3.5 w-3.5" />
                                </Button>

                                <Button
                                    type="button"
                                    size="icon-sm"
                                    variant="destructive"
                                    onClick={handleRemove}
                                    title="Remove"
                                >
                                    <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>

                        <div className="flex min-w-[160px] flex-col justify-center gap-1">
                            <p className="max-w-xs truncate text-sm font-medium text-slate-900 dark:text-slate-100">
                                {value instanceof File
                                    ? value.name
                                    : "Current Thumbnail"}
                            </p>

                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {value instanceof File
                                    ? `${(value.size / 1024 / 1024).toFixed(2)} MB`
                                    : "Already uploaded"}
                            </p>

                            <span className="w-fit rounded-full bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 dark:border dark:border-green-800/60 px-2.5 py-0.5 text-xs font-semibold">
                                Ready
                            </span>
                        </div>
                    </>
                )}
            </div>

            <p className="text-xs text-slate-400 dark:text-slate-500">
                JPG, JPEG, PNG, WEBP &middot; Maximum size: 10 MB
            </p>
        </div>
    );
};

export default ImageUpload;