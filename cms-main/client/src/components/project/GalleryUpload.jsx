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

const GalleryUpload = ({
    label,
    value = [],
    onChange,
    accept = "image/*",
}) => {
    const [previews, setPreviews] = useState([]);
    const [isDragging, setIsDragging] = useState(false);

    const fileInputRef = useRef(null);

    useEffect(() => {
        if (!value.length) {
            setPreviews([]);
            return;
        }

        const objectUrls = [];

        const urls = value.map((item) => {
            // Existing image from MongoDB
            if (
                typeof item === "object" &&
                item.url &&
                !(item instanceof File)
            ) {
                return {
                    file: item,
                    url: getImageUrl(item.url),
                };
            }

            // Newly selected image
            if (item instanceof File) {
                const objectUrl = URL.createObjectURL(item);

                objectUrls.push(objectUrl);

                return {
                    file: item,
                    url: objectUrl,
                };
            }

            return null;
        }).filter(Boolean);

        setPreviews(urls);

        return () => {
            objectUrls.forEach((url) => {
                URL.revokeObjectURL(url);
            });
        };
    }, [value]);

    const validateFiles = (files) => {
        const validFiles = [];

        files.forEach((file) => {
            if (!ALLOWED_TYPES.includes(file.type)) {
                toast.error(`${file.name} is not a supported image.`);
                return;
            }

            if (file.size > MAX_SIZE) {
                toast.error(`${file.name} exceeds 10 MB.`);
                return;
            }

            validFiles.push(file);
        });

        if (validFiles.length) {
            onChange([...(value || []), ...validFiles]);
        }
    };

    const handleChange = (event) => {
        const files = Array.from(event.target.files || []);

        validateFiles(files);

        event.target.value = "";
    };

    const handleRemove = (index) => {
        const updated = value.filter((_, i) => i !== index);

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

        const files = Array.from(event.dataTransfer.files || []);

        validateFiles(files);
    };

    return (
        <div className="space-y-4">
            <label className="text-sm font-medium">
                {label}
            </label>

            <input
                ref={fileInputRef}
                hidden
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
                className={`flex h-56 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition ${isDragging
                    ? "border-blue-500 bg-blue-50 dark:bg-blue-950/20"
                    : "border-slate-300 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 hover:border-slate-400 dark:hover:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-900"
                    }`}
            >
                <ImagePlus
                    size={48}
                    className="mb-3 text-slate-400 dark:text-slate-500"
                />

                <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Click or Drag Photos Here
                </p>

                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                    JPG, PNG, WEBP
                </p>

                <p className="text-xs text-slate-400">
                    Maximum size: 10 MB each
                </p>
            </div>

            {previews.length > 0 && (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                    {previews.map((item, index) => (
                        <div
                            key={index}
                            className="group relative overflow-hidden rounded-xl border"
                        >
                            <img
                                src={item.url}
                                alt=""
                                className="h-40 w-full object-cover"
                            />

                            <Button
                                type="button"
                                size="icon-sm"
                                variant="destructive"
                                className="absolute right-2 top-2 opacity-0 transition group-hover:opacity-100"
                                onClick={() => handleRemove(index)}
                            >
                                <Trash2 size={16} />
                            </Button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default GalleryUpload;