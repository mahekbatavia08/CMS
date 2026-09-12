import { useMemo, useState } from "react";
import { Controller, useFormContext } from "react-hook-form";
import { Check, ChevronDown } from "lucide-react";

import AutocompleteField from "@/components/common/AutocompleteField";
import { cn } from "@/lib/utils";

import {
    Card,
    CardContent,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";

import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";

import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";

export const POSSESSION_STATUS_OPTIONS = [
    "Ongoing",
    "Coming Soon",
    "Ready Position"
];

export const CATEGORY_OPTIONS = [
    "Residential",
    "Commercial",
    "Industrial",
    "Custom",
];

export const getDynamicPropertyTypes = (selectedCategories = []) => {
    const isIndustrial = selectedCategories.includes("Industrial");
    const isResidential = selectedCategories.includes("Residential");
    const isCommercial = selectedCategories.includes("Commercial");

    if (isIndustrial) {
        return ["Plot"];
    }

    if (isResidential && isCommercial) {
        return ["2 BHK", "3 BHK", "4 BHK", "Penthouse", "Shop", "Office"];
    }

    if (isResidential) {
        return ["Bungalow", "Villa", "2 BHK", "3 BHK", "4 BHK", "Penthouse"];
    }

    if (isCommercial) {
        return ["Shop", "Office"];
    }

    return [];
};

const TagsFiltersForm = () => {
    const { register, control, watch, setValue } = useFormContext();

    const [categoryOpen, setCategoryOpen] = useState(false);
    const rawCategory = watch("filters.category");
    const selectedCategories = useMemo(() => {
        if (Array.isArray(rawCategory)) return rawCategory.filter(Boolean);
        if (typeof rawCategory === "string" && rawCategory.trim()) return [rawCategory.trim()];
        return [];
    }, [rawCategory]);

    const primaryCategory = selectedCategories[0] || "";

    const customCategoryValue = watch("filters.customCategory") || (
        selectedCategories.length === 1 && !CATEGORY_OPTIONS.includes(primaryCategory) ? primaryCategory : ""
    );

    const isCustomActive = selectedCategories.includes("Custom") || (
        selectedCategories.length === 1 && primaryCategory && !CATEGORY_OPTIONS.includes(primaryCategory)
    );

    const rawPropertyType = watch("filters.propertyType");
    const selectedPropertyTypes = useMemo(() => {
        if (Array.isArray(rawPropertyType)) return rawPropertyType;
        if (typeof rawPropertyType === "string" && rawPropertyType.trim()) {
            return rawPropertyType.split(",").map((s) => s.trim()).filter(Boolean);
        }
        return [];
    }, [rawPropertyType]);

    const availablePropertyTypes = useMemo(() => {
        return getDynamicPropertyTypes(selectedCategories);
    }, [selectedCategories]);

    const handleCategoryToggle = (cat) => {
        const isAlreadySelected = selectedCategories.includes(cat);
        let newCategories = [];

        if (isAlreadySelected) {
            // Clicking an already-selected category always turns it OFF
            if (cat === "Residential" || cat === "Commercial") {
                newCategories = selectedCategories.filter((c) => c !== cat);
            } else {
                newCategories = [];
            }
        } else if (cat === "Industrial") {
            // Industrial must be solo
            newCategories = ["Industrial"];
        } else if (cat === "Residential" || cat === "Commercial") {
            // Commercial & Residential can be multi-selected together
            const currentMulti = selectedCategories.filter((c) => c === "Residential" || c === "Commercial");
            newCategories = [...currentMulti, cat];
        } else {
            // Other solo categories (Custom, Hospitality, Education)
            newCategories = [cat];
        }

        if (newCategories.includes("Custom")) {
            // Keep custom input
        } else {
            setValue("filters.customCategory", "", { shouldDirty: true });
        }

        setValue("filters.category", newCategories, { shouldDirty: true });

        const newAvailable = getDynamicPropertyTypes(newCategories);
        const updatedTypes = selectedPropertyTypes.filter((t) => newAvailable.includes(t));
        setValue("filters.propertyType", updatedTypes, { shouldDirty: true });
    };

    const handlePropertyTypeToggle = (type) => {
        let newSelected;
        if (selectedPropertyTypes.includes(type)) {
            newSelected = selectedPropertyTypes.filter((t) => t !== type);
        } else {
            newSelected = [...selectedPropertyTypes, type];
        }
        setValue("filters.propertyType", newSelected, { shouldDirty: true });
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>
                    Tags &amp; Filters
                </CardTitle>
            </CardHeader>

            <CardContent className="grid gap-6 md:grid-cols-2">

                {/* Category Multi-Select Dropdown */}
                <div className="space-y-2 w-full">
                    <Label>Category</Label>

                    <Popover open={categoryOpen} onOpenChange={setCategoryOpen}>
                        <PopoverTrigger className="flex w-full h-10 items-center justify-between gap-2 rounded-lg border border-input bg-transparent px-3 py-2 text-sm transition-colors outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 cursor-pointer dark:bg-input/30">
                            <span className={cn("truncate text-left flex-1", selectedCategories.length === 0 ? "text-muted-foreground" : "text-foreground font-normal")}>
                                {selectedCategories.length === 0 ? "Select Category" : selectedCategories.join(", ")}
                            </span>
                            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
                        </PopoverTrigger>

                        <PopoverContent className="w-(--anchor-width) min-w-[240px] p-2 space-y-1" align="start">
                            <div className="text-xs font-semibold text-slate-400 px-2 py-1 uppercase tracking-wider">
                                Select Categories
                            </div>
                            {CATEGORY_OPTIONS.map((cat) => {
                                const isChecked = selectedCategories.includes(cat);

                                return (
                                    <div
                                        key={cat}
                                        onClick={() => {
                                            handleCategoryToggle(cat);
                                            setCategoryOpen(false);
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

                    {/* Custom Category Input Field */}
                    {isCustomActive && (
                        <div className="pt-2 animate-in fade-in-50 duration-200">
                            <Label className="text-xs text-slate-500">Custom Category Name</Label>
                            <Input
                                placeholder="Enter custom category name..."
                                value={customCategoryValue}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setValue("filters.customCategory", val, { shouldDirty: true });
                                    setValue("filters.category", [val || "Custom"], { shouldDirty: true });
                                }}
                                className="mt-1"
                            />
                        </div>
                    )}
                </div>

                {/* Possession Status */}
                <div className="space-y-2">
                    <Label>Possession Status</Label>

                    <Controller
                        name="filters.possessionStatus"
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

                {/* Property Type Chips (Visible when Category is selected) */}
                {selectedCategories.length > 0 && availablePropertyTypes.length > 0 && (
                    <div className="space-y-2 md:col-span-2">
                        <Label>Property Type</Label>
                        <div className="flex flex-wrap gap-2.5">
                            {availablePropertyTypes.map((type) => {
                                const isSelected = selectedPropertyTypes.includes(type);

                                return (
                                    <button
                                        key={type}
                                        type="button"
                                        onClick={() => handlePropertyTypeToggle(type)}
                                        className={cn(
                                            "flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg border text-sm font-medium transition-all duration-150 select-none cursor-pointer",
                                            isSelected
                                                ? "border-primary bg-primary text-primary-foreground shadow-xs"
                                                : "border-slate-200 bg-white text-slate-900 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100 dark:hover:bg-slate-900"
                                        )}
                                    >
                                        {isSelected && <Check className="size-3.5 shrink-0" />}
                                        <span>{type}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}

                {/* City */}
                <div className="space-y-2">
                    <Label>City</Label>

                    <Controller
                        name="filters.city"
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

                {/* Area */}
                <div className="space-y-2">
                    <Label>Area</Label>

                    <Controller
                        name="filters.area"
                        control={control}
                        render={({ field }) => (
                            <AutocompleteField
                                type="area"
                                value={field.value || ""}
                                onChange={field.onChange}
                                placeholder="Select or create area"
                            />
                        )}
                    />
                </div>

                {/* Amenities */}
                <div className="space-y-2">
                    <Label>Amenities</Label>

                    <Controller
                        name="filters.amenities"
                        control={control}
                        render={({ field }) => (
                            <AutocompleteField
                                type="amenity"
                                multiple
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select amenities"
                            />
                        )}
                    />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <Label>Tags</Label>

                    <Controller
                        name="filters.tags"
                        control={control}
                        render={({ field }) => (
                            <AutocompleteField
                                type="tag"
                                multiple
                                value={field.value || []}
                                onChange={field.onChange}
                                placeholder="Select tags"
                            />
                        )}
                    />
                </div>

                {/* Tagline */}
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
    );
};

export default TagsFiltersForm;