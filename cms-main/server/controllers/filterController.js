import asyncHandler from "../utils/asyncHandler.js";
import sendSuccess from "../utils/apiResponse.js";

import { getSuggestions } from "../services/filterService.js";

/**
 * @route GET /api/filters
 * @access Private
 */
export const getFilterSuggestions = asyncHandler(async (req, res) => {
    const { type, q = "" } = req.query;

    if (!type) {
        return res.status(400).json({
            success: false,
            message: "Filter type is required",
        });
    }

    const suggestions = await getSuggestions(type, q);

    sendSuccess(
        res,
        200,
        "Filter suggestions fetched successfully",
        suggestions
    );
});