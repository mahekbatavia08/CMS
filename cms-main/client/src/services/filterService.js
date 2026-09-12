import api from "../api/axios";

export const getFilterSuggestions = async (
    type,
    query = ""
) => {
    const response = await api.get("/filters", {
        params: {
            type,
            q: query,
        },
    });

    return response.data.data;
};