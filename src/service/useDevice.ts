// services/useDevices.ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { DeviceResponse } from "../types/deviceTypes";

export function useDevices(page = 1) {
    return useQuery({
        queryKey: ["devices", page],
        queryFn: async (): Promise<DeviceResponse> => {
            const res = await api.post(`/v1/device/getAll`);
            return res.data;
        },
        staleTime: 1000 * 60,
        retry: false,
    });
}

// update device
export function useUpdateDevice() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return api.put(`/api/users/update-user/${id}`, {
        name,
      });
    },

    onSuccess: () => {
      // Refetch devices after success
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },
  });
}

// Delete device
export function useDeleteDevice() {
  const queryClient = useQueryClient();

  // DO NOT type the return value
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/devices/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["devices"] });
    },

    onError: (err: any) => {
      console.error("Delete failed:", err);
    },
  });
}
