import { useEffect, useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
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

    return (
        <div className="space-y-3">
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

            {!(preview && value) ? (
                <div
                    onClick={() => fileInputRef.current?.click()}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    className={`
            flex
            h-64
            cursor-pointer
            flex-col
            items-center
            justify-center
            rounded-xl
            border-2
            border-dashed
            transition-all
            duration-200

            ${isDragging
                            ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30"
                            : "border-slate-300 bg-slate-50 hover:border-slate-400 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800/60 dark:hover:border-slate-600 dark:hover:bg-slate-800"
                        }
          `}
                >
                    <ImagePlus
                        size={52}
                        className="mb-4 text-slate-400 dark:text-slate-500"
                    />

                    <p className="font-semibold text-slate-700 dark:text-slate-200">
                        {isDragging
                            ? "Drop image here"
                            : "Click or Drag an image here"}
                    </p>

                    <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                        JPG, JPEG, PNG, WEBP
                    </p>

                    <p className="text-xs text-slate-400 dark:text-slate-500">
                        Maximum size: 10 MB
                    </p>
                </div>
            ) : (
                <div className="space-y-4">
                    <div className="group relative flex h-72 w-full items-center justify-center overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-900">
                        <img
                            src={preview}
                            alt="Preview"
                            className="h-full w-full object-contain transition duration-300 group-hover:scale-105"
                        />

                        <div
                            className="
                absolute
                inset-0
                flex
                items-center
                justify-center
                gap-3
                bg-black/50
                opacity-0
                transition-opacity
                duration-300
                group-hover:opacity-100
              "
                        >
                            <Button
                                type="button"
                                variant="secondary"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Change Image
                            </Button>

                            <Button
                                type="button"
                                variant="destructive"
                                onClick={handleRemove}
                            >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Remove
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-800/60">
                        <div>
                            <p className="max-w-xs truncate font-medium text-slate-900 dark:text-slate-100">
                                {value instanceof File
                                    ? value.name
                                    : "Current Thumbnail"}
                            </p>

                            <p className="text-sm text-slate-500 dark:text-slate-400">
                                {value instanceof File
                                    ? `${(value.size / 1024 / 1024).toFixed(2)} MB`
                                    : "Already uploaded"}
                            </p>
                        </div>

                        <div className="rounded-full bg-green-100 text-green-700 dark:bg-green-950/60 dark:text-green-300 dark:border dark:border-green-800/60 px-3 py-1 text-xs font-semibold">
                            Ready
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ImageUpload;