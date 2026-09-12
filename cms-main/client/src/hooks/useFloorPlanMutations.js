import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  uploadFloorPlan,
  replaceFloorPlan,
  deleteFloorPlan,
} from "@/services/project/floorPlanService";

export const useUploadFloorPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, data }) => uploadFloorPlan(projectId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
};

export const useReplaceFloorPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, floorPlanId, data }) =>
      replaceFloorPlan(projectId, floorPlanId, data),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
};

export const useDeleteFloorPlan = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ projectId, floorPlanId }) =>
      deleteFloorPlan(projectId, floorPlanId),

    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["project", variables.projectId],
      });
    },
  });
};
