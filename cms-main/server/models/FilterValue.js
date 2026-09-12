import mongoose from "mongoose";

const filterValueSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            required: true,
            enum: [
                "city",
                "area",
                "propertyType",
                "amenity",
                "tag",
            ],
            trim: true,
        },

        value: {
            type: String,
            required: true,
            trim: true,
        },

        usageCount: {
            type: Number,
            default: 1,
            min: 1,
        },
    },
    {
        timestamps: true,
    }
);

// Prevent duplicate values within the same type
filterValueSchema.index(
    { type: 1, value: 1 },
    { unique: true }
);

export default mongoose.model("FilterValue", filterValueSchema);