import api from "@/lib/api";

export const uploadFloorPlan = async (projectId, payload) => {
  const formData = new FormData();

  formData.append("title", payload.title);

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const response = await api.post(
    `/projects/${projectId}/floorplans`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data.project;
};

export const replaceFloorPlan = async (projectId, floorPlanId, payload) => {
  const formData = new FormData();

  if (payload.title) {
    formData.append("title", payload.title);
  }

  if (payload.file) {
    formData.append("file", payload.file);
  }

  const response = await api.patch(
    `/projects/${projectId}/floorplans/${floorPlanId}`,
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    },
  );

  return response.data.data.project;
};

export const deleteFloorPlan = async (projectId, floorPlanId) => {
  const response = await api.delete(
    `/projects/${projectId}/floorplans/${floorPlanId}`,
  );

  return response.data.data.project;
};
