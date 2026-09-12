import api from "@/api/axios";

const dashboardService = {
  getStats: async () => {
    const { data } = await api.get("/dashboard/stats");
    return data;
  },

  getProjectOverview: async (params = {}) => {
    const { data } = await api.get(
      "/dashboard/project-overview",
      {
        params,
      }
    );

    return data;
  },
};

export default dashboardService;