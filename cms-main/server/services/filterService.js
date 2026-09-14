import FilterValue from "../models/FilterValue.js";
import { escapeRegex } from "../utils/escapeRegex.js";


/**
 * Get autocomplete suggestions
 */
/**
 * Get autocomplete suggestions
 */
export const getSuggestions = async (type, query = "") => {
    const filters = { type };

    if (query.trim()) {
        filters.value = {
            $regex: escapeRegex(query.trim()),
            $options: "i",
        };
    }

    const suggestions = await FilterValue.find(filters)
        .sort({
            usageCount: -1,
            value: 1,
        })
        .limit(10)
        .select({
            _id: 0,
            value: 1,
            usageCount: 1,
        })
        .lean();

    return suggestions;
};

/**
 * Sync filter values after creating/updating a project
 */
export const syncFilterValues = async (type, values) => {
    if (!values) return;

    // Convert single value to array
    const filterValues = Array.isArray(values) ? values : [values];

    for (const value of filterValues) {
        if (typeof value !== "string") continue;

        const cleanedValue = value.trim();

        if (!cleanedValue) continue;

        await FilterValue.findOneAndUpdate(
            {
                type,
                value: cleanedValue,
            },
            {
                $inc: {
                    usageCount: 1,
                },
            },
            {
                upsert: true,
                new: true,
                setDefaultsOnInsert: true,
            }
        );
    }
};

/**
 * Sync all filter fields from a project
 */
/**
 * Sync all filter fields from a project
 */
export const syncProjectFilters = async (project) => {
    if (!project.filters) return;

    const {
        category,
        possessionStatus,
        city,
        area,
        propertyType,
        amenities,
        tags,
    } = project.filters;

    const filterMap = {
        category,
        possessionStatus,
        city,
        area,
        propertyType,
        amenity: amenities,
        tag: tags,
        projectType: project.general?.projectType,
    };

    for (const [type, values] of Object.entries(filterMap)) {
        await syncFilterValues(type, values);
    }
};