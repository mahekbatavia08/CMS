import { findSuggestions, incrementValue } from "../models/FilterValue.js";


/**
 * Get autocomplete suggestions
 */
/**
 * Get autocomplete suggestions
 */
export const getSuggestions = async (type, query = "") => {
    return findSuggestions(type, query.trim());
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

        await incrementValue(type, cleanedValue);
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