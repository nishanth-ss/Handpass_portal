import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../lib/api";
import type { UserResponse } from "../types/userTypes";

export function useUsers(page: number = 1, limit: number = 5,search?: string) {
 return useQuery<UserResponse>({
  queryKey: ["users", page, limit,search],
  queryFn: async () => {
    const searchParam = search ? `search=${search}` : ""
    const res = await api.get<UserResponse>(`/api/users?${searchParam}page=${page}&limit=${limit}`);
    return res.data;
  },
  staleTime: 1000 * 60,
  keepPreviousData: true,
  retry: false,
} as any);
}

export const useUpdateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, name }: { id: number; name: string }) => {
      const { data } = await api.put(`/api/users/update-user/${id}`, { name });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },
  });
};

// Delete User
export function useDeleteUser() {
  const queryClient = useQueryClient();

  // DO NOT type the return value
  return useMutation({
    mutationFn: (id: string) => api.delete(`/api/users/${id}`),

    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"], exact: false });
    },

    onError: (err: any) => {
      console.error("Delete failed:", err);
    },
  });
}