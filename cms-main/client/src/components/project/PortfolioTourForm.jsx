import { useEffect, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronDown, Map, Plus, X } from "lucide-react";
import { Controller, FormProvider, useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

import AutocompleteField from "@/components/common/AutocompleteField";
import projectService from "@/services/project/projectService";
import MediaInformationForm from "./CoverImageForm";
import VideoInformationForm from "./VideoInformationForm";
import SEOInformationForm from "./SEOInformationForm";
import StickyActionBar from "./StickyActionBar";
import { CATEGORY_OPTIONS, POSSESSION_STATUS_OPTIONS } from "./TagsFiltersForm";
import { PROJECT_SECTIONS } from "@/constants/projectSections";
import { ROUTES } from "@/constants/routes";

// Manages a list (Areas / Category / Property Type) in form state on every
// Add/Remove; the page's normal Save button persists it along with the rest
// of the form, same as Tagline and Description. fieldName is a "general.xxx"
// path.
const MasterChipListField = ({
    control,
    fieldName,
    addPlaceholder = "Type a value...",
    suggestions = [],
    showAddButton = true,
}) => {
    const [inputValue, setInputValue] = useState("");

    return (
        <Controller
            name={fieldName}
            control={control}
            render={({ field }) => {
                const items = Array.isArray(field.value)
                    ? field.value
                    : (typeof field.value === "string" && field.value.trim()
                        ? field.value.split(",").map((a) => a.trim()).filter(Boolean)
                        : []);

                const persist = (nextItems) => {
                    // Just update form state — the page's normal Save button
                    // (now fixed to actually report success/failure) persists
                    // this along with the rest of the form, same as Tagline
                    // and Description already do.
                    field.onChange(nextItems);
                };

                const addItem = (value) => {
                    const trimmed = (value ?? inputValue).trim();
                    if (!trimmed || items.includes(trimmed)) {
                        setInputValue("");
                        return;
                    }
                    setInputValue("");
                    persist([...items, trimmed]);
                };

                const removeItem = (item) => {
                    persist(items.filter((a) => a !== item));
                };

                const handleKeyDown = (e) => {
                    if (e.key === "Enter" || e.key === ",") {
                        e.preventDefault();
                        addItem();
                    }
                };

                const remainingSuggestions = suggestions.filter((s) => !items.includes(s));

                return (
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2 rounded-lg border border-input bg-transparent p-2 min-h-[42px] dark:bg-input/30">
                            {items.map((item) => (
                                <span
                                    key={item}
                                    className="inline-flex items-center gap-1.5 rounded-md bg-slate-100 dark:bg-slate-800 px-2.5 py-1 text-sm text-slate-700 dark:text-slate-200"
                                >
                                    {item}
                                    <button
                                        type="button"
                                        onClick={() => removeItem(item)}
                                        className="text-slate-400 hover:text-red-500 transition-colors cursor-pointer"
                                        aria-label={`Remove ${item}`}
                                    >
                                        <X size={13} />
                                    </button>
                                </span>
                            ))}

                            <input
                                type="text"
                                value={inputValue}
                                onChange={(e) => setInputValue(e.target.value)}
                                onKeyDown={handleKeyDown}
                                placeholder={items.length === 0 ? addPlaceholder : "Add another..."}
                                className="flex-1 min-w-[140px] border-none bg-transparent text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {showAddButton && (
                                <Button type="button" variant="outline" size="sm" onClick={() => addItem()}>
                                    <Plus size={14} className="mr-1" />
                                    Add Custom
                                </Button>
                            )}

                            {remainingSuggestions.map((s) => (
                                <button
                                    key={s}
                                    type="button"
                                    onClick={() => addItem(s)}
                                    className="text-xs px-2.5 py-1 rounded-md border border-dashed border-slate-300 dark:border-slate-700 text-slate-500 hover:border-blue-400 hover:text-blue-600 transition-colors cursor-pointer"
                                >
                                    + {s}
                                </button>
                            ))}
                        </div>
                    </div>
                );
            }}
        />
    );
};

// Same Category dropdown (and selection rules) individual projects used
// before: Residential + Commercial can be combined, Industrial / Custom are
// solo. The selection is stored in general.category and becomes the list of
// Category options offered to the individual projects under this master.
const MasterCategoryDropdown = ({ control }) => {
    const [open, setOpen] = useState(false);

    return (
        <Controller
            name="general.category"
            control={control}
            render={({ field }) => {
                const selected = Array.isArray(field.value)
                    ? field.value.filter(Boolean)
                    : (typeof field.value === "string" && field.value.trim()
                        ? field.value.split(",").map((c) => c.trim()).filter(Boolean)
                        : []);

                const primary = selected[0] || "";
                const isCustomActive = selected.includes("Custom") || (
                    selected.length === 1 && primary && !CATEGORY_OPTIONS.includes(primary)
                );
                const customValue = selected.length === 1 && !CATEGORY_OPTIONS.includes(primary) ? primary : "";

                const toggle = (cat) => {
                    let next;

                    if (selected.includes(cat)) {
                        next = cat === "Residential" || cat === "Commercial"
                            ? selected.filter((c) => c !== cat)
                            : [];
                    } else if (cat === "Industrial") {
                        next = ["Industrial"];
                    } else if (cat === "Residential" || cat === "Commercial") {
                        const multi = selected.filter((c) => c === "Residential" || c === "Commercial");
                        next = [...multi, cat];
                    } else {
                        next = [cat];
                    }

                    field.onChange(next);
                };

                return (
                    <>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger className="flex w-full h-10 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer dark:bg-input/30">
                                <span className={cn("truncate text-left flex-1", selected.length === 0 ? "text-muted-foreground" : "text-foreground font-normal")}>
                                    {selected.length === 0 ? "Select Category" : selected.join(", ")}
                                </span>
                                <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                            </PopoverTrigger>

                            <PopoverContent className="w-(--anchor-width) min-w-[240px] p-2 space-y-1" align="start">
                                <div className="text-xs font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                                    Select Categories
                                </div>
                                {CATEGORY_OPTIONS.map((cat) => {
                                    const isChecked = selected.includes(cat);

                                    return (
                                        <div
                                            key={cat}
                                            onClick={() => {
                                                toggle(cat);
                                                setOpen(false);
                                            }}
                                            className={cn(
                                                "flex items-center justify-between px-3 py-2 rounded-md cursor-pointer text-sm font-medium transition-colors select-none",
                                                isChecked
                                                    ? "bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300 font-semibold"
                                                    : "hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-200"
                                            )}
                                        >
                                            <span>{cat}</span>
                                            {isChecked && (
                                                <Check className="h-4 w-4 shrink-0 text-blue-600 dark:text-blue-400 ml-2" />
                                            )}
                                        </div>
                                    );
                                })}
                            </PopoverContent>
                        </Popover>

                        {isCustomActive && (
                            <div className="pt-2 animate-in fade-in-50 duration-200">
                                <Label className="text-xs text-slate-500">Custom Category Name</Label>
                                <Input
                                    placeholder="Enter custom category name..."
                                    value={customValue}
                                    onChange={(e) => field.onChange([e.target.value || "Custom"])}
                                    className="mt-1"
                                />
                            </div>
                        )}
                    </>
                );
            }}
        />
    );
};

const slugify = (text) =>
    text
        .toLowerCase()
        .trim()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");

const PortfolioTourFields = ({ projectId }) => {
    const { register, control, watch, setValue, formState: { errors } } = useFormContext();
    const slugEdited = useRef(false);
    const projectName = watch("general.projectName");

    useEffect(() => {
        if (!projectName) return;
        if (!slugEdited.current) {
            setValue("general.slug", slugify(projectName), { shouldDirty: true });
        }
    }, [projectName, setValue]);

    return (
        <div className="space-y-8">
            <Card>
                <CardHeader>
                    <CardTitle>Basic Details</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="space-y-2">
                        <Label htmlFor="projectName">
                            Tour Title <span className="text-red-500">*</span>
                        </Label>
                        <Input
                            id="projectName"
                            placeholder="e.g. ABC Group Virtual Tour"
                            {...register("general.projectName", {
                                required: "Tour Title is required",
                            })}
                        />
                        {errors.general?.projectName && (
                            <p className="text-xs text-red-500 font-medium mt-1">
                                {errors.general.projectName.message}
                            </p>
                        )}
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            rows={4}
                            placeholder="Trusted by 1500+ families..."
                            {...register("general.description")}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Tags &amp; Filters</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-6 md:grid-cols-2">
                    <div className="space-y-2 w-full">
                        <Label>Category</Label>
                        <MasterCategoryDropdown control={control} />
                        <p className="text-xs text-slate-500">
                            Select the category, then click "Save Configuration" below. These become the only Category options selectable on individual projects added under this master project.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Possession Status</Label>
                        <Controller
                            name="general.possessionStatus"
                            control={control}
                            render={({ field }) => (
                                <Select
                                    value={field.value || ""}
                                    onValueChange={field.onChange}
                                >
                                    <SelectTrigger className="w-full h-10">
                                        <SelectValue placeholder="Select Possession Status" />
                                    </SelectTrigger>

                                    <SelectContent>
                                        {POSSESSION_STATUS_OPTIONS.map((status) => (
                                            <SelectItem key={status} value={status}>
                                                {status}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        />
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label>Property Type</Label>
                        <MasterChipListField
                            control={control}
                            fieldName="general.propertyType"
                            addPlaceholder="Type a custom property type..."
                            suggestions={["2 BHK", "3 BHK", "4 BHK", "Penthouse", "Bungalow", "Villa", "Shop", "Office", "Plot"]}
                        />
                        <p className="text-xs text-slate-500">
                            Pick a suggestion or add a custom one, then click "Save Configuration" below. These become the only Property Type options selectable on individual projects added under this master project.
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>City</Label>
                        <Controller
                            name="general.city"
                            control={control}
                            render={({ field }) => (
                                <AutocompleteField
                                    type="city"
                                    value={field.value || ""}
                                    onChange={field.onChange}
                                    placeholder="Select or create city"
                                />
                            )}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Area</Label>
                        <MasterChipListField
                            control={control}
                            fieldName="general.area"
                            addPlaceholder="Type an area..."
                            showAddButton={false}
                        />
                        <p className="text-xs text-slate-500">
                            Click "Save Configuration" below to persist. These become the dropdown options for the Area field on individual projects added under this master project.
                        </p>
                    </div>

                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="tagline">Tagline</Label>
                        <Input
                            id="tagline"
                            autoComplete="off"
                            {...register("general.tagline")}
                        />
                    </div>
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <CardTitle>Contact & Location Info</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <div className="space-y-2">
                            <Label htmlFor="address">Address</Label>
                            <Input
                                id="address"
                                placeholder="413,414,415, Gruham Plaza..."
                                {...register("location.address")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="googleMaps">Google Maps Link</Label>
                            <Input
                                id="googleMaps"
                                placeholder="https://maps.google.com/..."
                                {...register("location.googleMaps", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid Google Maps URL",
                                    },
                                })}
                            />
                            {errors.location?.googleMaps && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.location.googleMaps.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="phone">Phone Number</Label>
                            <Input
                                id="phone"
                                placeholder="+91 99799 78551"
                                {...register("contact.phone")}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="website">Website Link</Label>
                            <Input
                                id="website"
                                placeholder="https://..."
                                {...register("contact.website", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid website URL",
                                    },
                                })}
                            />
                            {errors.contact?.website && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.website.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram">Instagram Link</Label>
                            <Input
                                id="instagram"
                                placeholder="https://instagram.com/..."
                                {...register("contact.instagram", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid Instagram URL",
                                    },
                                })}
                            />
                            {errors.contact?.instagram && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.instagram.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="facebook">Facebook Link</Label>
                            <Input
                                id="facebook"
                                placeholder="https://facebook.com/..."
                                {...register("contact.facebook", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid Facebook URL",
                                    },
                                })}
                            />
                            {errors.contact?.facebook && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.facebook.message}
                                </p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="youtube">YouTube Link</Label>
                            <Input
                                id="youtube"
                                placeholder="https://youtube.com/..."
                                {...register("contact.youtube", {
                                    pattern: {
                                        value: /^(https?:\/\/)?([\w.-]+)\.([a-z]{2,})(:\d{1,5})?(\/.*)?$/i,
                                        message: "Please enter a valid YouTube URL",
                                    },
                                })}
                            />
                            {errors.contact?.youtube && (
                                <p className="text-xs text-red-500 font-medium mt-1">
                                    {errors.contact.youtube.message}
                                </p>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Logo */}
            <MediaInformationForm
                title="Logo"
                thumbnailLabel="Upload Logo"
                showGallery={false}
                showBrochures={false}
                showLegalDocuments={false}
                showFloorPlans={false}
                showThumbnailImage={true}
                showRera={false}
                coverAspectRatio="1/1"
            />

            {/* Videos */}
            <div id={PROJECT_SECTIONS.videos.id}>
                <VideoInformationForm />
            </div>

            {/* SEO Information */}
            <div id={PROJECT_SECTIONS.seo.id}>
                <SEOInformationForm />
            </div>
        </div>
    );
};

const PortfolioTourForm = ({
    methods,
    onSubmit,
    onBack,
    isSubmitting = false,
    hideSubmit = false,
    projectId,
}) => {
    const navigate = useNavigate();

    // Inject default values for removed fields to satisfy backend schema
    const applyDefaults = (data) => {
        if (!data.general.builderName) {
            data.general.builderName = data.general.projectName;
        }
        if (!data.general.projectType) {
            data.general.projectType = "Commercial";
        }
        if (!data.status.status) {
            data.status.status = "Published";
            data.status.published = true;
        }
        return data;
    };

    return (
        <FormProvider {...methods}>
            <form
                onSubmit={methods.handleSubmit((data) => {
                    onSubmit(applyDefaults(data));
                })}
                className="space-y-8 pb-24"
            >
                <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                        <div className="flex items-center gap-3">
                            {onBack && (
                                <button
                                    type="button"
                                    onClick={onBack}
                                    className="flex items-center justify-center p-2 rounded-lg border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
                                    title="Back"
                                >
                                    <ArrowLeft className="h-5 w-5" />
                                </button>
                            )}
                            <h1 className="text-3xl font-bold dark:text-slate-50">
                                Master Project Configuration
                            </h1>
                        </div>
                        <p className="mt-2 text-slate-500 dark:text-slate-400">
                            Configure the modal popup for the master project.
                        </p>
                    </div>

                    {/* Standalone entry point into Map Skin selection — independent of
                        the Save/Next flow, only shown once the master project exists. */}
                    {projectId && (
                        <Button
                            type="button"
                            onClick={() => navigate(ROUTES.PROJECT_MAP_SKIN.replace(":id", projectId))}
                            className="flex items-center gap-2 cursor-pointer shrink-0"
                        >
                            <Map className="h-4 w-4" />
                            <span>Select Map Skin</span>
                        </Button>
                    )}
                </div>

                <PortfolioTourFields projectId={projectId} />

                <StickyActionBar
                    isSubmitting={isSubmitting}
                    submitButtonText="Save Configuration"
                    hideSubmit={hideSubmit}
                    onBack={onBack}
                />
            </form>
        </FormProvider>
    );
};

export default PortfolioTourForm;